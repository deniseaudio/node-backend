import { resolve } from "path";

import { isDirectoryValid } from "./fs-utils";

export type Config = {
  /**
   * List of directories to index. Path are already resolved using `path.resolve`.
   */
  directories: string[];

  /**
   * List of files with specified extensions to index.
   */
  filesExtensions: string[];

  /**
   * Express HTTP server port.
   */
  port: number;

  /**
   * List of allowed hostnames for CORS.
   */
  allowedCorsOrigins: string[];

  /**
   * If true, will index audio files on launch.
   */
  enableIndexing: boolean;

  /**
   * Secret key that acts as a whitelist for register.
   */
  secretKey: string;
};

/**
 * Generate a configuration object from environment variables.
 *
 * @returns Parsed `Config` object.
 */
export const generateConfig = (): Config => {
  const directories = process.env.DIRECTORIES
    ? process.env.DIRECTORIES.split(",")
    : null;

  const filesExtensions = process.env.FILES_EXTENSIONS
    ? process.env.FILES_EXTENSIONS.split(",")
    : null;

  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  const corsAllowedOrigins = process.env.CORS_ALLOWED_ORIGINS
    ? process.env.CORS_ALLOWED_ORIGINS.split(",")
    : null;

  const enableIndexing = process.env.ENABLE_INDEXING
    ? process.env.ENABLE_INDEXING === "true"
    : false;

  const secretKey = process.env.SECRET_KEY;

  if (!directories) {
    throw new Error('Missing environment variable "DIRECTORIES".');
  }

  if (!filesExtensions) {
    throw new Error('Missing environment variable "FILES_EXTENSIONS".');
  }

  if (!corsAllowedOrigins) {
    throw new Error('Missing environment variable "CORS_ALLOWED_ORIGINS".');
  }

  // Verify if the directories are valid.
  if (!directories.every((directory) => isDirectoryValid(directory))) {
    throw new Error(
      "Something went wrong while verifying the validity of the directories."
    );
  }

  if (!secretKey) {
    throw new Error('Missing environment variable "SECRET_KEY".');
  }

  return {
    port,
    enableIndexing,
    secretKey,
    directories: [...directories.map((directory) => resolve(directory))],
    filesExtensions: [...filesExtensions],
    allowedCorsOrigins: [...corsAllowedOrigins],
  };
};

/**
 * Parsed configuration object from `config.json`.
 */
export const config = generateConfig();
