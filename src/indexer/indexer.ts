import { walkRootDirectory } from "./walk";

let timeStarted = 0;

/**
 * Start the indexing process.
 */
export const startIndexing = async (directories: string[]) => {
  timeStarted = new Date().getTime();

  for (const directory of directories) {
    await walkRootDirectory(directory);
  }

  const indexingDurationInSeconds = (new Date().getTime() - timeStarted) / 1000;

  console.log("Indexing finished.");
  console.log(
    "Total duration:",
    Math.floor(indexingDurationInSeconds),
    "seconds"
  );
};
