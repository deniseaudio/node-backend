import { resolve } from "path";
import fs from "fs";

/**
 * Verify if the given directory exists and if the script is allowed to access
 * it (only READ permission).
 *
 * @param path Directory path to test.
 * @returns True if directory exist and have sufficient permissions.
 */
export const isDirectoryValid = (path: string): boolean => {
  const resolvedPath = resolve(path);

  if (fs.existsSync(resolvedPath)) {
    try {
      fs.accessSync(resolvedPath, fs.constants.R_OK);

      return true;
    } catch (err) {
      console.error(
        new Error(`Not enough permission, cannot read ${resolvedPath}.`)
      );
    }
  }

  return false;
};

/**
 * Extract the last part of a path, that can be a file or a folder.
 *
 * @param path Resolved path.
 * @returns Last part of the path (a folder or a file).
 */
export const getLastPartOfPath = (path: string): string | undefined => {
  return path.split("/").pop();
};
