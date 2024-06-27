import axios from "axios";
import { prismaClient } from "../../client/Db";

import { GraphqlContext } from "../../interface";
import { User } from "@prisma/client";
import UserServices from "../../services/user";

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
  },
};
export const resolver = { queries, extraRessolver };
