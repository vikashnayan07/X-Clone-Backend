"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const jwtSecret = "@123Vikash";
class JWTServices {
    static generateTokenForUser(user) {
        const payload = {
            id: user === null || user === void 0 ? void 0 : user.id,
            email: user === null || user === void 0 ? void 0 : user.email,
        };
        const token = jsonwebtoken_1.default.sign(payload, jwtSecret);
        return token;
    }
}
exports.default = JWTServices;