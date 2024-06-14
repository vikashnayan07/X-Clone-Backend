"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const type_1 = require("./type");
const resolver_1 = require("./resolver");
const queries_1 = require("./queries");
exports.User = { type: type_1.type, queries: queries_1.queries, resolver: resolver_1.resolver };
