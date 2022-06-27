import type { User } from "@prisma/client";
import jwt from "jsonwebtoken";

const secret = "audio-server-rest-api";

/**
 * Sign a JWT based on prisma user object.
 *
 * @param user Prisma user object.
 * @returns A signed JWT.
 */
export const signToken = (user: User): string => {
  return jwt.sign(user, secret);
};

/**
 * Verify a JWT validity.
 *
 * @param token JWT.
 * @returns True if user is authorized.
 */
export const verifyToken = (token: string): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, secret, (err) => {
      if (err) {
        reject(new Error("Unauthorized"));
        return;
      }

      resolve(true);
    });
  });
};
