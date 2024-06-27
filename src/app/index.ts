import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { User } from "./user";
import { Tweet } from "./tweets";
import JWTServices from "../services/jwt";
import { GraphqlContext } from "../interface";

export async function initServer() {
  const app = express();

  app.use(bodyParser.json());
  app.use(cors());

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
        }
        `,
    resolvers: {
      Query: {
        ...User.resolver.queries,
        ...Tweet.resolver.queries,
      },
      Mutation: {
        ...Tweet.resolver.mutaion,
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
