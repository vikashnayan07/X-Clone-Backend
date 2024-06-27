import { prismaClient } from "../client/Db";

export interface CreateTweetPayload {
  content: string;
  imageURL?: string;
  userId: string;
}
class TweeServices {
  public static createTweet(data: CreateTweetPayload) {
    return prismaClient.tweet.create({
      data: {
        content: data.content,
        imageURL: data.imageURL,
        author: { connect: { id: data.userId } },
      },
    });
  }
  public static getAllTweets() {
    return prismaClient.tweet.findMany({ orderBy: { createdAt: "desc" } });
  }
}
export default TweeServices;
