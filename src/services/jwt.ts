import { User } from "@prisma/client";
import jwt from "jsonwebtoken";
const jwtSecret = "@123Vikash";
class JWTServices {
  public static generateTokenForUser(user: User) {
    const payload = {
      id: user?.id,
      email: user?.email,
    };
    const token = jwt.sign(payload, jwtSecret);
    return token;
  }
}

export default JWTServices;
