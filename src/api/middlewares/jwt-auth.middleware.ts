import type { Request, Response, NextFunction } from "express";

import { verifyToken } from "../jwt-utils";

/**
 * Verify if user has a valid JWT.
 *
 * @param req Express request.
 * @param res Express response.
 * @param next Express next function.
 */
export const jwtAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.headers.authorization) {
    return next(res.status(401).json({ message: "Unauthorized" }));
  }

  const token = req.headers.authorization.split(" ")[1];

  if (!token) {
    return next(res.status(401).json({ message: "Unauthorized" }));
  }

  try {
    const isAuthorized = await verifyToken(token);

    if (!isAuthorized) {
      return next(res.status(401).json({ message: "Unauthorized" }));
    }

    return next();
  } catch (err) {
    console.log(err);
    return next(res.status(500).send({ error: "something went wrong" }));
  }
};
