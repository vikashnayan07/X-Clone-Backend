import { type } from "./type";
import { mutations } from "./mutation";
import { resolver } from "./resolver";
import { queries } from "./queries";

export const User = { type, queries, resolver, mutations };
