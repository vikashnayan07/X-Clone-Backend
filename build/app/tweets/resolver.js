"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolver = void 0;
const Db_1 = require("../../client/Db");
const queries = {
    getAllTweets: () => {
        return Db_1.prismaClient.tweet.findMany({ orderBy: { createdAt: "desc" } });
    },
};
const mutaion = {
    createTweet: (parent_1, _a, ctx_1) => __awaiter(void 0, [parent_1, _a, ctx_1], void 0, function* (parent, { payload }, ctx) {
        if (!ctx.user)
            throw new Error("Not Authenticated");
        const tweet = yield Db_1.prismaClient.tweet.create({
            data: {
                content: payload.content,
                imageURL: payload.imageURL,
                author: { connect: { id: ctx.user.id } },
            },
        });
        return tweet;
    }),
};
const extraRessolver = {
    Tweet: {
        author: (parent) => {
            return Db_1.prismaClient.user.findUnique({ where: { id: parent.authorId } });
        },
    },
};
exports.resolver = { mutaion, extraRessolver, queries };
