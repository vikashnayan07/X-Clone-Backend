import { GraphqlContext } from "../../interface";
import { prismaClient } from "../../client/Db";
import { Tweet } from "@prisma/client";
import UserServices from "../../services/user";
import TweeServices, { CreateTweetPayload } from "../../services/tweet";
import MediaServices from "../../services/media";

const queries = {
  getAllTweets: () => {
    return TweeServices.getAllTweets();
  },
  getSingnedURLForTweet: async (
    parent: any,
    { imageType, imageName }: { imageType: string; imageName: string },
    ctx: GraphqlContext
  ) => {
    if (!ctx.user || !ctx.user.id) throw new Error("Unothorized user");

    const blobName = MediaServices.getBlobName(ctx.user.id, imageName, imageType);
    return MediaServices.getSignedUploadUrl(blobName, imageType);
  },
};

const mutaion = {
  createTweet: async (
    parent: any,
    { payload }: { payload: CreateTweetPayload },
    ctx: GraphqlContext
  ) => {
    if (!ctx.user) throw new Error("Not Authenticated");
    const tweet = await TweeServices.createTweet({
      ...payload,
      userId: ctx.user.id,
    });
    return tweet;
  },
};
const extraRessolver = {
  Tweet: {
    author: (parent: Tweet) => {
      return UserServices.getUserById(parent.authorId);
    },
  },
};

export const resolver = { mutaion, extraRessolver, queries };
