import type { IAudioMetadata } from "music-metadata";
import { parseFile } from "music-metadata";

import { getLastPartOfPath } from "./fs-utils";

export type ValidAudioMetadata = IAudioMetadata & {
  common: {
    artist: string;
    title: string;
    album: string;
  };

  format: {
    codec: string;
    duration: number;
  };
};

/**
 * Get the metadata of a file.
 *
 * @param path Resolved path to the file.
 * @returns Promise that resolves to the file metadata.
 */
export const getFileMetadata = (path: string) => {
  return parseFile(path);
};

/**
 * Verify if a file contains essential metadata, which is required to properly
 * interact with the database.
 *
 * @param metadata File metadata.
 * @returns False if the file doesn't contain essential metadata.
 */
export const validateFileMetadata = (
  metadata: IAudioMetadata
): metadata is ValidAudioMetadata => {
  const { album, artist, title } = metadata.common;
  const { codec, duration } = metadata.format;

  if (!album || !artist || !title || !codec || !duration) {
    return false;
  }

  return true;
};

/**
 * Verify if a file has basic minimum metadata (codec and duration). For the
 * common tags, we set artist and album to "Unknown" and set the title to
 * the filename.
 *
 * @param path Path to the file.
 * @param metadata File metadata.
 * @returns Return an object if the file contains at least basic metadata.
 */
export const validateFileWithoutMetadata = (
  path: string,
  metadata: IAudioMetadata
): ValidAudioMetadata | null => {
  const { codec, duration } = metadata.format;

  const filename = getLastPartOfPath(path)!;

  if (!duration) {
    return null;
  }

  return {
    ...metadata,

    common: {
      ...metadata.common,
      artist: "Unknown",
      title: filename,
      album: "Unknown",
    },

    format: {
      ...metadata.format,
      codec: codec || "unknown",
      duration,
    },
  };
};
