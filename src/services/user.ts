import axios from "axios";
import { prismaClient } from "../client/Db";
import JWTServices from "./jwt";
import { redisClient } from "../client/Db/redis";

interface GoogleTokenResult {
  iss: string;
  azp: string;
  aud: string;
  sub: string;
  email: string;
  email_verified: string;
  nbf: string;
  name: string;
  picture: string;
  given_name: string;
  family_name: string;
  iat: string;
  exp: string;
  jti: string;
  alg: string;
  kid: string;
  typ: string;
}
class UserServices {
  public static async verifyGoogleAuthToken(token: string) {
    const googleToken = token;
    const googleOauthURL = new URL("https://oauth2.googleapis.com/tokeninfo");
    googleOauthURL.searchParams.set("id_token", googleToken);
    const { data } = await axios.get<GoogleTokenResult>(
      googleOauthURL.toString(),
      {
        responseType: "json",
      }
    );

    const user = await prismaClient.user.findUnique({
      where: { email: data.email },
    });
    if (!user) {
      await prismaClient.user.create({
        data: {
          email: data.email,
          firstName: data.given_name,
          lastName: data.family_name,
          profileImageURL: data.picture,
        },
      });
    }

    const userDb = await prismaClient.user.findUnique({
      where: { email: data.email },
    });
    if (!userDb) throw new Error("Invalid User");

    const tokenUser = JWTServices.generateTokenForUser(userDb);

    return tokenUser;
  }
  public static async getUserById(id: string) {
    const cachedUser = await redisClient.get("GET_USER");
    if (cachedUser) return JSON.parse(cachedUser);
    const getUser = await prismaClient.user.findUnique({ where: { id } });
    await redisClient.set("GET_USER", JSON.stringify(getUser));
    return getUser;
  }

  public static async followUser(from: string, to: string) {
    const followsUser = prismaClient.follows.create({
      data: {
        follower: { connect: { id: from } },
        following: { connect: { id: to } },
      },
    });
    await redisClient.del("GET_USER");
    return followsUser;
  }
  public static async unfollowUser(from: string, to: string) {
    const unfollowsUser = await prismaClient.follows.delete({
      where: {
        followerId_followingId: { followerId: from, followingId: to },
      },
    });
    await redisClient.del("GET_USER");
    return unfollowsUser;
  }
}
export default UserServices;
