import type { Request, Response } from "express-serve-static-core";

import { findDirectoryContentById, findRootDirectories } from "../../prisma";

/**
 * Retrieve a specific directory.
 *
 * @param req Express request.
 * @param res Express response.
 */
export const getDirectoryContent = async (req: Request, res: Response) => {
  const { directoryId } = req.query;

  if (!directoryId || typeof directoryId !== "string") {
    res.status(400).send({ error: "missing directoryId query parameter" });
    return;
  }

  const directory = await findDirectoryContentById(directoryId);

  if (!directory) {
    res.status(404).send({ error: "directory not found" });
    return;
  }

  res.status(200).send({ directory });
};

/**
 * Get all root directories.
 *
 * @param req Express request.
 * @param res Express response.
 */
export const getRootDirectories = async (req: Request, res: Response) => {
  const directories = await findRootDirectories();

  res.status(200).send({ directories });
};
