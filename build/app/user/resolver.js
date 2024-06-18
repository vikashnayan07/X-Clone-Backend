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
const axios_1 = __importDefault(require("axios"));
const Db_1 = require("../../client/Db");
const jwt_1 = __importDefault(require("../../services/jwt"));
const queries = {
    verifyGoogleToken: (parent_1, _a) => __awaiter(void 0, [parent_1, _a], void 0, function* (parent, { token }) {
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
    }),
    getCurrentUser: (parent, args, ctx) => __awaiter(void 0, void 0, void 0, function* () {
        var _b;
        const id = (_b = ctx.user) === null || _b === void 0 ? void 0 : _b.id;
        if (!id)
            return null;
        const user = yield Db_1.prismaClient.user.findUnique({ where: { id } });
        return user;
    }),
};
const extraRessolver = {
    User: {
        tweets: (parent) => {
            return Db_1.prismaClient.tweet.findMany({
                where: { author: { id: parent.id } },
            });
        },
    },
};
exports.resolver = { queries, extraRessolver };
