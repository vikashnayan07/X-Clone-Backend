"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tweet = void 0;
const types_1 = require("./types");
const queries_1 = require("./queries");
const mutation_1 = require("./mutation");
const resolver_1 = require("./resolver");
exports.Tweet = { types: types_1.types, mutation: mutation_1.mutation, resolver: resolver_1.resolver, queries: queries_1.queries };
