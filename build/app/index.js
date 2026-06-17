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
exports.initServer = void 0;
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const cors_1 = __importDefault(require("cors"));
const multer_1 = __importDefault(require("multer"));
const server_1 = require("@apollo/server");
const express4_1 = require("@apollo/server/express4");
const user_1 = require("./user");
const tweets_1 = require("./tweets");
const jwt_1 = __importDefault(require("../services/jwt"));
const media_1 = __importDefault(require("../services/media"));
function initServer() {
    return __awaiter(this, void 0, void 0, function* () {
        const app = (0, express_1.default)();
        const upload = (0, multer_1.default)({
            storage: multer_1.default.memoryStorage(),
            limits: {
                fileSize: 5 * 1024 * 1024,
            },
        });
        app.use(body_parser_1.default.json());
        app.use((0, cors_1.default)());
        app.post("/media/tweet", upload.single("file"), (req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split("Bearer ")[1];
                const user = token ? jwt_1.default.decodeToken(token) : null;
                if (!(user === null || user === void 0 ? void 0 : user.id))
                    return res.status(401).json({ error: "Unauthorized" });
                if (!req.file)
                    return res.status(400).json({ error: "File is required" });
                const imageURL = yield media_1.default.uploadTweetMedia({
                    userId: user.id,
                    fileName: req.file.originalname,
                    mediaType: req.file.mimetype,
                    buffer: req.file.buffer,
                });
                return res.json({ imageURL });
            }
            catch (error) {
                const message = error instanceof Error ? error.message : "Upload failed";
                return res.status(400).json({ error: message });
            }
        }));
        app.get("/media/*", (req, res) => __awaiter(this, void 0, void 0, function* () {
            var _b;
            try {
                const blobName = req.params[0];
                const blob = yield media_1.default.downloadMedia(blobName);
                if (blob.contentType)
                    res.setHeader("Content-Type", blob.contentType);
                if (blob.contentLength) {
                    res.setHeader("Content-Length", blob.contentLength.toString());
                }
                res.setHeader("Cache-Control", "public, max-age=3600");
                return (_b = blob.readableStreamBody) === null || _b === void 0 ? void 0 : _b.pipe(res);
            }
            catch (error) {
                const message = error instanceof Error ? error.message : "Media not found";
                return res.status(404).json({ error: message });
            }
        }));
        const graphqlServer = new server_1.ApolloServer({
            typeDefs: `
      ${user_1.User.type}
      ${tweets_1.Tweet.types}
        type Query{
        ${user_1.User.queries}
        ${tweets_1.Tweet.queries}
        }
        type Mutation{
        ${tweets_1.Tweet.mutation}
        ${user_1.User.mutations}
        }
        `,
            resolvers: Object.assign(Object.assign({ Query: Object.assign(Object.assign({}, user_1.User.resolver.queries), tweets_1.Tweet.resolver.queries), Mutation: Object.assign(Object.assign({}, tweets_1.Tweet.resolver.mutaion), user_1.User.resolver.mutations) }, tweets_1.Tweet.resolver.extraRessolver), user_1.User.resolver.extraRessolver),
        });
        yield graphqlServer.start();
        app.use("/graphql", (0, express4_1.expressMiddleware)(graphqlServer, {
            context: (_c) => __awaiter(this, [_c], void 0, function* ({ req, res }) {
                return {
                    user: req.headers.authorization
                        ? jwt_1.default.decodeToken(req.headers.authorization.split("Bearer ")[1])
                        : undefined,
                };
            }),
        }));
        return app;
    });
}
exports.initServer = initServer;
