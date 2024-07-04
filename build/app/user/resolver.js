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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolver = void 0;
const Db_1 = require("../../client/Db");
const user_1 = __importDefault(require("../../services/user"));
const redis_1 = require("../../client/Db/redis");
const queries = {
    verifyGoogleToken: (parent_1, _a) => __awaiter(void 0, [parent_1, _a], void 0, function* (parent, { token }) {
        const resultToken = yield user_1.default.verifyGoogleAuthToken(token);
        return resultToken;
    }),
    getCurrentUser: (parent, args, ctx) => __awaiter(void 0, void 0, void 0, function* () {
        var _b;
        const id = (_b = ctx.user) === null || _b === void 0 ? void 0 : _b.id;
        if (!id)
            return null;
        const user = yield user_1.default.getUserById(id);
        return user;
    }),
    getUserById: (parent_2, _c, ctx_1) => __awaiter(void 0, [parent_2, _c, ctx_1], void 0, function* (parent, { id }, ctx) { return user_1.default.getUserById(id); }),
};
const extraRessolver = {
    User: {
        tweets: (parent) => {
            return Db_1.prismaClient.tweet.findMany({
                where: { author: { id: parent.id } },
            });
        },
        followers: (parent) => __awaiter(void 0, void 0, void 0, function* () {
            const result = yield Db_1.prismaClient.follows.findMany({
                where: { following: { id: parent.id } },
                include: {
                    follower: true,
                },
            });
            return result.map((el) => el.follower);
        }),
        following: (parent) => __awaiter(void 0, void 0, void 0, function* () {
            const result = yield Db_1.prismaClient.follows.findMany({
                where: { follower: { id: parent.id } },
                include: {
                    following: true,
                },
            });
            return result.map((el) => el.following);
        }),
        recommendedUsers: (parent, _, ctx) => __awaiter(void 0, void 0, void 0, function* () {
            if (!ctx.user)
                return [];
            const chachedValue = yield redis_1.redisClient.get(`RECOMMENED_USER:${ctx.user.id}`);
            if (chachedValue) {
                return JSON.parse(chachedValue);
            }
            const myfollowers = yield Db_1.prismaClient.follows.findMany({
                where: { follower: { id: ctx.user.id } },
                include: {
                    following: {
                        include: { followers: { include: { following: true } } },
                    },
                },
            });
            const users = [];
            for (const followings of myfollowers) {
                for (const followingOfFollowedUser of followings.following.followers) {
                    if (followingOfFollowedUser.following.id !== ctx.user.id &&
                        myfollowers.findIndex((el) => (el === null || el === void 0 ? void 0 : el.followingId) === followingOfFollowedUser.following.id) < 0) {
                        users.push(followingOfFollowedUser.following);
                    }
                }
            }
            yield redis_1.redisClient.set(`RECOMMENED_USER:${ctx.user.id}`, JSON.stringify(users));
            return users;
        }),
    },
};
const mutations = {
    followUser: (parent_3, _d, ctx_2) => __awaiter(void 0, [parent_3, _d, ctx_2], void 0, function* (parent, { to }, ctx) {
        if (!ctx.user || !ctx.user.id)
            throw new Error("unauthorized");
        yield user_1.default.followUser(ctx.user.id, to);
        yield redis_1.redisClient.del(`RECOMMENED_USER:${ctx.user.id}`);
        return true;
    }),
    unfollowUser: (parent_4, _e, ctx_3) => __awaiter(void 0, [parent_4, _e, ctx_3], void 0, function* (parent, { to }, ctx) {
        if (!ctx.user || !ctx.user.id)
            throw new Error("unauthorized");
        yield user_1.default.unfollowUser(ctx.user.id, to);
        yield redis_1.redisClient.del(`RECOMMENED_USER:${ctx.user.id}`);
        return true;
    }),
};
exports.resolver = { queries, extraRessolver, mutations };
