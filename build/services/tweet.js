"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Db_1 = require("../client/Db");
class TweeServices {
    static createTweet(data) {
        return Db_1.prismaClient.tweet.create({
            data: {
                content: data.content,
                imageURL: data.imageURL,
                author: { connect: { id: data.userId } },
            },
        });
    }
    static getAllTweets() {
        return Db_1.prismaClient.tweet.findMany({ orderBy: { createdAt: "desc" } });
    }
}
exports.default = TweeServices;
