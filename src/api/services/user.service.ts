import type { User } from "@prisma/client";
import type { Request, Response } from "express-serve-static-core";
import { validationResult } from "express-validator";
import bcrypt from "bcryptjs";

import { config } from "../../config";
import {
  createUser,
  findUser,
  findUserById,
  findUserLikes,
  setUserLikes,
} from "../../prisma";
import { signToken } from "../jwt-utils";

type RegisterPayload = {
  email: string;
  username: string;
  password: string;
  secretKey: string;
};

const BCRYPT_SALT = 8;

/**
 * Clean the Prisma user object by removing the password.
 *
 * @param user Prisma user object.
 * @returns Cleaned user object without password.
 */
const cleanUserPayload = (user: User): Omit<User, "password"> => {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    likes: user.likes,
  };
};

/**
 * Create a new user. Make sure the request has required fields, verify if a
 * user doesn't exist with the same email before creating user.
 *
 * @param req Express request.
 * @param res Express response.
 */
export const registerUser = async (req: Request, res: Response) => {
  const validationErrors = validationResult(req);

  if (!validationErrors.isEmpty()) {
    res.status(400).json({ errors: validationErrors.array() });
    return;
  }

  const { email, password, username, secretKey } = req.body as RegisterPayload;

  if (secretKey !== config.secretKey) {
    res.status(401).send({ error: "not authorized" });
    return;
  }

  const existingUser = await findUser(email);

  if (existingUser) {
    res.status(409).send({ error: "user already exists" });
    return;
  }

  const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT);

  try {
    const user = await createUser(email, username, hashedPassword);
    const token = signToken(user);

    res.status(201).send({ token, user: cleanUserPayload(user) });
  } catch (err) {
    console.log(err);
    res.status(500).send({ error: "something went wrong" });
  }
};

/**
 * Login a user by matching its email and password.
 *
 * @param req Express request.
 * @param res Express response.
 */
export const loginUser = async (req: Request, res: Response) => {
  const validationErrors = validationResult(req);

  if (!validationErrors.isEmpty()) {
    res.status(400).json({ errors: validationErrors.array() });
    return;
  }

  const { email, password } = req.body as Omit<
    RegisterPayload,
    "username" | "secretKey"
  >;

  const existingUser = await findUser(email);

  if (!existingUser) {
    res.status(404).send({ error: "user doesn't exist" });
    return;
  }

  try {
    const matchedPassword = bcrypt.compareSync(password, existingUser.password);

    if (!matchedPassword) {
      res.status(401).send({ error: "invalid email or password" });
      return;
    }

    const token = signToken(existingUser);

    res.status(200).send({ token, user: cleanUserPayload(existingUser) });
  } catch (err) {
    console.log(err);
    res.status(500).send({ error: "something went wrong" });
  }
};

export const getUserLikes = async (req: Request, res: Response) => {
  const validationErrors = validationResult(req);

  if (!validationErrors.isEmpty()) {
    res.status(400).json({ errors: validationErrors.array() });
    return;
  }

  const { userId } = req.query as { userId: string };

  const user = await findUserById(userId);

  if (!user) {
    res.status(404).send({ error: "user doesn't exist" });
    return;
  }

  try {
    const likes = await findUserLikes(userId);

    res.status(200).send(likes);
  } catch (error) {
    res.status(500).send({ error: "something went wrong" });
  }
};

export const toggleUserLike = async (req: Request, res: Response) => {
  const validationErrors = validationResult(req);

  if (!validationErrors.isEmpty()) {
    res.status(400).json({ errors: validationErrors.array() });
    return;
  }

  const { userId, songId } = req.body as { userId: string; songId: string };

  const user = await findUserLikes(userId);

  if (!user) {
    res.status(404).send({ error: "user doesn't exist" });
    return;
  }

  try {
    if (user.likes.includes(songId)) {
      const response = await setUserLikes(
        userId,
        user.likes.filter((id) => id !== songId)
      );

      res.status(200).send({ likes: response.likes });
    } else {
      const response = await setUserLikes(userId, [...user.likes, songId]);

      res.status(200).send({ likes: response.likes });
    }
  } catch (err) {
    console.log(err);
    res.status(500).send({ error: "something went wrong" });
  }
};
