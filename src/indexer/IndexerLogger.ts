/* eslint class-methods-use-this: "off" */
import { join } from "path";
import Winston from "winston";

export class IndexerLogger {
  private winston: Winston.Logger;

  constructor() {
    this.winston = Winston.createLogger({
      level: "info",

      format: Winston.format.combine(
        Winston.format.timestamp({
          format: "YYYY-MM-DD HH:mm:ss",
        }),
        Winston.format.errors({ stack: true }),
        Winston.format.simple(),
        Winston.format.printf(
          (info) =>
            `[${info.timestamp as string}] ${info.level}: ${info.message}`
        )
      ),

      transports: [
        new Winston.transports.Console(),
        new Winston.transports.File({
          filename: join(__dirname, "../../.logs/combined.log"),
        }),
        new Winston.transports.File({
          filename: join(__dirname, "../../.logs/errors.log"),
          level: "error",
        }),
      ],

      rejectionHandlers: [
        new Winston.transports.File({
          filename: join(__dirname, "../../.logs/rejections.log"),
        }),
      ],
    });
  }

  public rootDirectoryIndexed(directoryName: string) {
    this.winston.info(`Root directory indexed: ${directoryName}`);
  }

  public rootDirectoryAlreadyIndexed(directoryName: string) {
    this.winston.info(`Root directory already indexed: ${directoryName}`);
  }

  public rootDirectoryIndexingError(directoryName: string, err: Error) {
    this.winston.error(
      `Root directory not indexed: ${directoryName}. ${err.name} - ${err.message}`
    );
  }

  public directoryBlacklisted(directoryPath: string) {
    this.winston.info(`Directory blacklisted ignored: ${directoryPath}`);
  }

  public directoryIndexed(directoryPath: string) {
    this.winston.info(`Directory created: ${directoryPath}`);
  }

  public directoryAlreadyIndexed(directoryPath: string) {
    this.winston.info(`Directory already indexed: ${directoryPath}`);
  }

  public directoryCached(directoryPath: string) {
    this.winston.info(`Directory already cached: ${directoryPath}`);
  }

  public directoryIndexingError(directoryPath: string, err: Error) {
    this.winston.error(
      `Directory not created: ${directoryPath}. ${err.name} - ${err.message}`
    );
  }

  public songPoorMetadata(songPath: string) {
    this.winston.warn(`Song has poor metadata: ${songPath}`);
  }

  public songIndexed(songPath: string, songId: string) {
    this.winston.info(`Song indexed: ${songId} - ${songPath}`);
  }

  public songAlreadyIndexed(songPath: string) {
    this.winston.info(`Song already indexed: ${songPath}`);
  }

  public songCached(songPath: string) {
    this.winston.info(`Song already cached: ${songPath}`);
  }

  public songIndexingError(songPath: string, err: Error) {
    this.winston.error(
      `Song not indexed: ${songPath}. ${err.name} - ${err.message}`
    );
  }

  public fileSkipped(filePath: string) {
    this.winston.info(`File skipped: ${filePath}`);
  }
}
