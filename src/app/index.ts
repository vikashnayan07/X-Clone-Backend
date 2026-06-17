import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import multer from "multer";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { User } from "./user";
import { Tweet } from "./tweets";
import JWTServices from "../services/jwt";
import { GraphqlContext } from "../interface";
import MediaServices from "../services/media";

export async function initServer() {
  const app = express();
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 5 * 1024 * 1024,
    },
  });

  app.use(bodyParser.json());
  app.use(cors());

  app.post("/media/tweet", upload.single("file"), async (req, res) => {
    try {
      const token = req.headers.authorization?.split("Bearer ")[1];
      const user = token ? JWTServices.decodeToken(token) : null;

      if (!user?.id) return res.status(401).json({ error: "Unauthorized" });
      if (!req.file) return res.status(400).json({ error: "File is required" });

      const imageURL = await MediaServices.uploadTweetMedia({
        userId: user.id,
        fileName: req.file.originalname,
        mediaType: req.file.mimetype,
        buffer: req.file.buffer,
      });

      return res.json({ imageURL });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload failed";
      return res.status(400).json({ error: message });
    }
  });

  app.get("/media/*", async (req, res) => {
    try {
      const blobName = (req.params as Record<string, string>)[0];
      const blob = await MediaServices.downloadMedia(blobName);

      if (blob.contentType) res.setHeader("Content-Type", blob.contentType);
      if (blob.contentLength) {
        res.setHeader("Content-Length", blob.contentLength.toString());
      }
      res.setHeader("Cache-Control", "public, max-age=3600");

      return blob.readableStreamBody?.pipe(res);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Media not found";
      return res.status(404).json({ error: message });
    }
  });

  const graphqlServer = new ApolloServer<GraphqlContext>({
    typeDefs: `
      ${User.type}
      ${Tweet.types}
        type Query{
        ${User.queries}
        ${Tweet.queries}
        }
        type Mutation{
        ${Tweet.mutation}
        ${User.mutations}
        }
        `,
    resolvers: {
      Query: {
        ...User.resolver.queries,
        ...Tweet.resolver.queries,
      },
      Mutation: {
        ...Tweet.resolver.mutaion,
        ...User.resolver.mutations,
      },
      ...Tweet.resolver.extraRessolver,
      ...User.resolver.extraRessolver,
    },
  });

  await graphqlServer.start();

  app.use(
    "/graphql",
    expressMiddleware(graphqlServer, {
      context: async ({ req, res }) => {
        return {
          user: req.headers.authorization
            ? JWTServices.decodeToken(
                req.headers.authorization.split("Bearer ")[1]
              )
            : undefined,
        };
      },
    })
  );
  return app;
}
