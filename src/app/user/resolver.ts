import axios from "axios";
import { prismaClient } from "../../client/Db";
import JWTServices from "../../services/jwt";
import { GraphqlContext } from "../../interface";

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

const queries = {
  verifyGoogleToken: async (parent: any, { token }: { token: string }) => {
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
  },
  getCurrentUser: async (parent: any, args: any, ctx: GraphqlContext) => {
    const id = ctx.user?.id;
    if (!id) return null;
    const user = await prismaClient.user.findUnique({ where: { id } });
    return user;
  },
};
export const resolver = { queries };
