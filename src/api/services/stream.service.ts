import type { Request, Response } from "express-serve-static-core";
import fs from "fs";

import { getFileContentLength } from "../stream-utils";
import { findSongById } from "../../prisma";

/**
 * Generate an entire audio stream for a specific song.
 *
 * @param req Express request.
 * @param res Express response.
 */
export const getAudioStream = async (req: Request, res: Response) => {
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

  let readStream: fs.ReadStream | null = null;

  const file = `${song.directory.path}/${song.filename}`;
  const { range } = req.headers;
  const { size } = getFileContentLength(file, range);

  res.header({
    "Content-Type": "application/octet-stream",
    "Content-Length": size,
  });

  readStream = fs.createReadStream(file);
  readStream.pipe(res);
};

/**
 * Generate an audio segment stream based on range request headers.
 *
 * @param req Express request.
 * @param res Express response.
 * @deprecated
 */
export const getSongSegment = async (req: Request, res: Response) => {
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

  let readStream: fs.ReadStream | null = null;

  const file = `${song.directory.path}/${song.filename}`;
  const { range } = req.headers;
  const { end, length, start, size } = getFileContentLength(file, range);

  if (!Number.isNaN(end) && !Number.isNaN(start) && !Number.isNaN(length)) {
    res.status(206).header({
      "Accept-Ranges": "bytes",
      "Content-Type": "application/octet-stream",
      "Content-Length": end - start + 1,
      "Content-Range": `bytes ${start}-${end}/${size}`,
    });

    readStream = fs.createReadStream(file, { start, end });
    readStream.pipe(res);
  } else {
    res.status(500).json({ error: "something went wrong" });
  }
};
