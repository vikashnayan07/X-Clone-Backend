import { GraphqlContext } from "../../interface";
import { prismaClient } from "../../client/Db";
import { Tweet } from "@prisma/client";

interface CreateTweetPayload {
  content: string;
  imageURL?: string;
}
const queries = {
  getAllTweets: () => {
    return prismaClient.tweet.findMany({ orderBy: { createdAt: "desc" } });
  },
};

const mutaion = {
  createTweet: async (
    parent: any,
    { payload }: { payload: CreateTweetPayload },
    ctx: GraphqlContext
  ) => {
    if (!ctx.user) throw new Error("Not Authenticated");
    const tweet = await prismaClient.tweet.create({
      data: {
        content: payload.content,
        imageURL: payload.imageURL,
        author: { connect: { id: ctx.user.id } },
      },
    });
    return tweet;
  },
};
const extraRessolver = {
  Tweet: {
    author: (parent: Tweet) => {
      return prismaClient.user.findUnique({ where: { id: parent.authorId } });
    },
  },
};

export const resolver = { mutaion, extraRessolver, queries };
