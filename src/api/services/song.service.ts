import type { Request, Response } from "express-serve-static-core";
import type { IAudioMetadata } from "music-metadata";

import { findSongById } from "../../prisma";
import { getFileMetadata } from "../../file-metadata";

/**
 * Retrieve a song by its song ID. Scan song metadata to extract cover image
 * buffer directly from the file. Stream the image buffer to the Express
 * response.
 *
 * @param req Express request.
 * @param res Express response.
 * @returns Image cover or an empty 200 response.
 */
export const getSongCover = async (req: Request, res: Response) => {
  const { songId } = req.query;

  if (!songId || typeof songId !== "string") {
    res.status(400).send({ error: "missing songId query parameter" });
    return;
  }

  const song = await findSongById(songId);

  if (!song) {
    res.status(404).send({ error: "song not found" });
    return;
  }

  let metadata: IAudioMetadata | null = null;

  try {
    metadata = await getFileMetadata(`${song.directory.path}/${song.filename}`);
  } catch (error) {
    console.log("Error while getting file metadata:", error);
  }

  if (!metadata) {
    res.status(500).send({ error: "file has invalid metadata" });
    return;
  }

  if (!metadata.common.picture || !metadata.common.picture.length) {
    res.sendStatus(200);
    return;
  }

  res.writeHead(200, { "Content-Type": "image/jpeg" });

  res.write(Buffer.from(metadata.common.picture[0].data), (err) => {
    if (err) {
      res.end();
      res.sendStatus(500);
      return;
    }

    res.end();
  });
};
