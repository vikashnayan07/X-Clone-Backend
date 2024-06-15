import { User } from "@prisma/client";
import jwt from "jsonwebtoken";
import { JWTUser } from "../interface";

const jwtSecret = "@123Vikash";
class JWTServices {
  public static generateTokenForUser(user: User) {
    const payload: JWTUser = {
      id: user?.id,
      email: user?.email,
    };
    const token = jwt.sign(payload, jwtSecret);
    return token;
  }
  public static decodeToken(token: string) {
    try {
      return jwt.verify(token, jwtSecret) as JWTUser;
    } catch (error) {
      return null;
    }
  }
}

export default JWTServices;
