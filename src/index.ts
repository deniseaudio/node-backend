/* eslint import/first: off */
import dotenv from "dotenv";

dotenv.config();

import { config } from "./config";
import { app } from "./api/express";
import { startIndexing } from "./indexer/indexer";

app.listen(config.port, () => {
  console.log(`🚀 Server ready at: localhost:${config.port}`);
  console.log("📦 Configuration:", config);

  if (config.enableIndexing) {
    startIndexing(config.directories).catch((err) => console.log(err));
  }
});
