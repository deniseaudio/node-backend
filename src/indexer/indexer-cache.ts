/* eslint @typescript-eslint/no-unsafe-call: "off" */
import { EOL } from "os";
import fs from "fs";
import path from "path";
import es from "event-stream";

const cacheFolder = path.join(process.cwd(), ".cache");
const cacheFile = path.join(cacheFolder, "indexer-cache");

// If folder and file doesn't exist, create folder and file.
if (!fs.existsSync(cacheFolder)) {
  fs.mkdirSync(cacheFolder, { recursive: true });
  fs.closeSync(fs.openSync(cacheFile, "a"));
}

const cacheFileStream = fs.createWriteStream(cacheFile, { flags: "a" });

export const addCachedPath = (filepath: string) => {
  cacheFileStream.write(`${filepath}${EOL}`);
};

export const findCachedPath = (filepath: string) => {
  return new Promise<boolean>((resolve, reject) => {
    const stream = fs
      .createReadStream(cacheFile)
      .pipe(es.split())
      .pipe(
        es.mapSync((line: string, callback: any) => {
          stream.pause();

          if (line === filepath) {
            resolve(true);
            stream.destroy();
            callback(null, line);
          } else {
            stream.resume();
          }
        })
      )
      .on("end", () => {
        resolve(false);
        stream.destroy();
      })
      .on("error", (err: Error) => {
        reject(err);
        stream.destroy();
      });
  });
};
