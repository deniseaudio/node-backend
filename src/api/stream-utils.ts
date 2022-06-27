import fs from "fs";

/**
 * Based on the request header Content-Length, parse start and end position.
 * Also include length and total size of the file.
 *
 * @param path Path to the file.
 * @param range Range header from Express request.
 * @returns Content-Length object with stats.
 */
export const getFileContentLength = (
  path: string,
  range: string | undefined
) => {
  const contentLength = {
    length: NaN,
    start: NaN,
    end: NaN,
    size: NaN,
  };

  const stat = fs.statSync(path);

  contentLength.size = stat.size;

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");

    const partialStart = parts[0];
    const partialEnd = parts[1];

    // ERR_INCOMPLETE_CHUNKED_ENCODING
    if (
      (Number.isNaN(partialStart) && partialStart.length > 1) ||
      (Number.isNaN(partialEnd) && partialEnd.length > 1)
    ) {
      return contentLength;
    }

    contentLength.start = parseInt(partialStart, 10);
    contentLength.end = partialEnd ? parseInt(partialEnd, 10) : stat.size - 1;
    contentLength.length = contentLength.end - contentLength.start + 1;
  }

  return contentLength;
};
