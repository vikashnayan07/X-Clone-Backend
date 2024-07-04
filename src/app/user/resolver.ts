import axios from "axios";
import { prismaClient } from "../../client/Db";

import { GraphqlContext } from "../../interface";
import { User } from "@prisma/client";
import UserServices from "../../services/user";
import { redisClient } from "../../client/Db/redis";

const queries = {
  verifyGoogleToken: async (parent: any, { token }: { token: string }) => {
    const resultToken = await UserServices.verifyGoogleAuthToken(token);
    return resultToken;
  },
  getCurrentUser: async (parent: any, args: any, ctx: GraphqlContext) => {
    const id = ctx.user?.id;
    if (!id) return null;
    const user = await UserServices.getUserById(id);
    return user;
  },
  getUserById: async (
    parent: any,
    { id }: { id: string },
    ctx: GraphqlContext
  ) => UserServices.getUserById(id),
};
const extraRessolver = {
  User: {
    tweets: (parent: User) => {
      return prismaClient.tweet.findMany({
        where: { author: { id: parent.id } },
      });
    },
    followers: async (parent: User) => {
      const result = await prismaClient.follows.findMany({
        where: { following: { id: parent.id } },
        include: {
          follower: true,
        },
      });
      return result.map((el) => el.follower);
    },
    following: async (parent: User) => {
      const result = await prismaClient.follows.findMany({
        where: { follower: { id: parent.id } },
        include: {
          following: true,
        },
      });
      return result.map((el) => el.following);
    },

    recommendedUsers: async (parent: User, _: any, ctx: GraphqlContext) => {
      if (!ctx.user) return [];

      const chachedValue = await redisClient.get(
        `RECOMMENED_USER:${ctx.user.id}`
      );
      if (chachedValue) {
        return JSON.parse(chachedValue);
      }
      const myfollowers = await prismaClient.follows.findMany({
        where: { follower: { id: ctx.user.id } },
        include: {
          following: {
            include: { followers: { include: { following: true } } },
          },
        },
      });
      const users: User[] = [];
      for (const followings of myfollowers) {
        for (const followingOfFollowedUser of followings.following.followers) {
          if (
            followingOfFollowedUser.following.id !== ctx.user.id &&
            myfollowers.findIndex(
              (el) => el?.followingId === followingOfFollowedUser.following.id
            ) < 0
          ) {
            users.push(followingOfFollowedUser.following);
          }
        }
      }

      await redisClient.set(
        `RECOMMENED_USER:${ctx.user.id}`,
        JSON.stringify(users)
      );
      return users;
    },
  },
};

const mutations = {
  followUser: async (
    parent: any,
    { to }: { to: string },
    ctx: GraphqlContext
  ) => {
    if (!ctx.user || !ctx.user.id) throw new Error("unauthorized");
    await UserServices.followUser(ctx.user.id, to);
    await redisClient.del(`RECOMMENED_USER:${ctx.user.id}`);
    return true;
  },
  unfollowUser: async (
    parent: any,
    { to }: { to: string },
    ctx: GraphqlContext
  ) => {
    if (!ctx.user || !ctx.user.id) throw new Error("unauthorized");
    await UserServices.unfollowUser(ctx.user.id, to);
    await redisClient.del(`RECOMMENED_USER:${ctx.user.id}`);
    return true;
  },
};
export const resolver = { queries, extraRessolver, mutations };
