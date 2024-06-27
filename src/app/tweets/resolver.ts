import { GraphqlContext } from "../../interface";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { prismaClient } from "../../client/Db";
import { Tweet } from "@prisma/client";
import UserServices from "../../services/user";
import TweeServices, { CreateTweetPayload } from "../../services/tweet";

const s3Client = new S3Client({
  region: process.env.AWS_DEFAULT_REGION,
});
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

    const allowedImageType = [
      "image/jpg",
      "image/jpeg",
      "image/png",
      "image/webp",
    ];
    if (!allowedImageType.includes(imageType))
      throw new Error("Invalid image Type");

    const putObjectCommand = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: `update/${
        ctx.user.id
      }/tweets/${imageName}-${Date.now()}.${imageType}`,
    });
    const signedURL = getSignedUrl(s3Client, putObjectCommand);
    return signedURL;
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
