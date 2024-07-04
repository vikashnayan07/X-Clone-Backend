import { prismaClient } from "../client/Db";
import { redisClient } from "../client/Db/redis";

export interface CreateTweetPayload {
  content: string;
  imageURL?: string;
  userId: string;
}
class TweeServices {
  public static async createTweet(data: CreateTweetPayload) {
    const limitTweet = await redisClient.get(`RATE_LIMIT:TWEET:${data.userId}`);
    if (limitTweet) throw Error("please wait for 10 sec....");
    const tweet = prismaClient.tweet.create({
      data: {
        content: data.content,
        imageURL: data.imageURL,
        author: { connect: { id: data.userId } },
      },
    });
    await redisClient.setex(`RATE_LIMIT:TWEET:${data.userId}`, 10, 1);
    await redisClient.del("ALL_TWEET");
    return tweet;
  }
  public static async getAllTweets() {
    const cachedTweet = await redisClient.get("ALL_TWEET");
    if (cachedTweet) return JSON.parse(cachedTweet);

    const tweet = await prismaClient.tweet.findMany({
      orderBy: { createdAt: "desc" },
    });
    await redisClient.set("ALL_TWEET", JSON.stringify(tweet));
    return tweet;
  }
}
export default TweeServices;
