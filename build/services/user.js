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
const axios_1 = __importDefault(require("axios"));
const Db_1 = require("../client/Db");
const jwt_1 = __importDefault(require("./jwt"));
const redis_1 = require("../client/Db/redis");
class UserServices {
    static verifyGoogleAuthToken(token) {
        return __awaiter(this, void 0, void 0, function* () {
            const googleToken = token;
            const googleOauthURL = new URL("https://oauth2.googleapis.com/tokeninfo");
            googleOauthURL.searchParams.set("id_token", googleToken);
            const { data } = yield axios_1.default.get(googleOauthURL.toString(), {
                responseType: "json",
            });
            const user = yield Db_1.prismaClient.user.findUnique({
                where: { email: data.email },
            });
            if (!user) {
                yield Db_1.prismaClient.user.create({
                    data: {
                        email: data.email,
                        firstName: data.given_name,
                        lastName: data.family_name,
                        profileImageURL: data.picture,
                    },
                });
            }
            const userDb = yield Db_1.prismaClient.user.findUnique({
                where: { email: data.email },
            });
            if (!userDb)
                throw new Error("Invalid User");
            const tokenUser = jwt_1.default.generateTokenForUser(userDb);
            return tokenUser;
        });
    }
    static getUserById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const cachedUser = yield redis_1.redisClient.get("GET_USER");
            if (cachedUser)
                return JSON.parse(cachedUser);
            const getUser = yield Db_1.prismaClient.user.findUnique({ where: { id } });
            yield redis_1.redisClient.set("GET_USER", JSON.stringify(getUser));
            return getUser;
        });
    }
    static followUser(from, to) {
        return __awaiter(this, void 0, void 0, function* () {
            const followsUser = Db_1.prismaClient.follows.create({
                data: {
                    follower: { connect: { id: from } },
                    following: { connect: { id: to } },
                },
            });
            yield redis_1.redisClient.del("GET_USER");
            return followsUser;
        });
    }
    static unfollowUser(from, to) {
        return __awaiter(this, void 0, void 0, function* () {
            const unfollowsUser = yield Db_1.prismaClient.follows.delete({
                where: {
                    followerId_followingId: { followerId: from, followingId: to },
                },
            });
            yield redis_1.redisClient.del("GET_USER");
            return unfollowsUser;
        });
    }
}
exports.default = UserServices;
