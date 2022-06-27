import path from "path";
import walk, { WalkStatEventCallback, WalkStatArrayEventCallback } from "walk";

import { config } from "../config";
import { createSong, findOrCreateDirectory } from "../prisma";
import {
  getFileMetadata,
  validateFileMetadata,
  validateFileWithoutMetadata,
} from "../file-metadata";
import { findCachedPath, addCachedPath } from "./indexer-cache";
import { IndexerLogger } from "./IndexerLogger";

// Synology creates some folders that we want to ignore.
const blacklistedDirectories = ["@eaDir"];

const indexerLogger = new IndexerLogger();

const handleWalkDirectory: WalkStatEventCallback = (root, fileStats, next) => {
  const folderpath = path.join(root, fileStats.name);
  const isBlacklisted =
    blacklistedDirectories.findIndex((blacklistedDirectory) =>
      folderpath.toLowerCase().includes(blacklistedDirectory.toLowerCase())
    ) > -1;

  if (isBlacklisted || fileStats.isSymbolicLink()) {
    indexerLogger.directoryBlacklisted(folderpath);
    next();
    return;
  }

  const splittedFolderpath = folderpath.split(path.sep);
  const parentFolderpath = splittedFolderpath
    .splice(0, splittedFolderpath.length - 1)
    .join(path.sep);

  findCachedPath(folderpath)
    .then((isCached) => {
      if (isCached) {
        indexerLogger.directoryCached(folderpath);
        return null;
      }

      return findOrCreateDirectory(
        fileStats.name,
        folderpath,
        false,
        parentFolderpath
      );
    })
    .then((createdDirectory) => {
      if (createdDirectory) {
        addCachedPath(folderpath);

        if (createdDirectory.alreadyExist) {
          indexerLogger.directoryAlreadyIndexed(folderpath);
        } else {
          indexerLogger.directoryIndexed(folderpath);
        }
      }
    })
    .catch((err: Error) =>
      indexerLogger.directoryIndexingError(folderpath, err)
    )
    .finally(() => next());
};

const handleWalkFile: WalkStatEventCallback = (root, fileStats, next) => {
  const filepath = path.join(root, fileStats.name);
  const folderpath = path.dirname(filepath);

  if (config.filesExtensions.includes(path.extname(fileStats.name))) {
    findCachedPath(filepath)
      .then((isCached) => {
        if (isCached) {
          indexerLogger.songCached(filepath);
          return null;
        }

        return getFileMetadata(filepath);
      })
      .then((metadata) => {
        if (!metadata) {
          return null;
        }

        const hasMetadata = validateFileMetadata(metadata);
        const poorMetadata = validateFileWithoutMetadata(filepath, metadata);

        if (hasMetadata) {
          return createSong(metadata, filepath, folderpath);
        }

        if (poorMetadata) {
          indexerLogger.songPoorMetadata(filepath);
          return createSong(poorMetadata, filepath, folderpath);
        }

        return Promise.reject(new Error(`invalid metadata ${fileStats.name}`));
      })
      .then((song) => {
        addCachedPath(filepath);

        if (song) {
          indexerLogger.songIndexed(filepath, song.id);
        } else {
          indexerLogger.songAlreadyIndexed(filepath);
        }
      })
      .catch((err: Error) => {
        indexerLogger.songIndexingError(filepath, err);
      })
      .finally(() => next());
  } else {
    indexerLogger.fileSkipped(filepath);
    next();
  }
};

const handleWalkError: WalkStatArrayEventCallback = (root, nodeStats, next) => {
  console.log("error:", nodeStats);
  next();
};

export const walkRootDirectory = async (rootDirectoryPath: string) => {
  // Register root directory.
  const foldername = rootDirectoryPath.split(path.sep).pop()!;

  await findOrCreateDirectory(foldername, rootDirectoryPath, true)
    .then(({ alreadyExist }) => {
      if (alreadyExist) {
        indexerLogger.rootDirectoryAlreadyIndexed(foldername);
      } else {
        indexerLogger.rootDirectoryIndexed(foldername);
      }
    })
    .catch((err: Error) =>
      indexerLogger.rootDirectoryIndexingError(foldername, err)
    );

  return new Promise((resolve) => {
    const walker = walk.walk(rootDirectoryPath, { followLinks: false });

    walker.on("directory", handleWalkDirectory);
    walker.on("file", handleWalkFile);
    walker.on("errors", handleWalkError);
    walker.on("end", () => resolve(true));
  });
};
