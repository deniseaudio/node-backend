import fs from "fs";
import path from "path";
import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";
import bodyparser from "body-parser";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import ratelimit from "express-rate-limit";
import { body, query } from "express-validator";

import { getSongCover, getSongSearchResults } from "./services/song.service";
import {
  getRootDirectories,
  getDirectoryContent,
} from "./services/directory.service";
import {
  loginUser,
  registerUser,
  getUserLikes,
  toggleUserLike,
  getLikesAsSongs,
} from "./services/user.service";
import { getAudioStream } from "./services/stream.service";
import { jwtAuth } from "./middlewares/jwt-auth.middleware";

export const app = express();

const ratelimiter = ratelimit({
  windowMs: 1000 * 30,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
});

const corsWhitelist: string[] = [];

if (process.env.NODE_ENV === "production" && process.env.CORS_ALLOWED_ORIGINS) {
  corsWhitelist.push(...process.env.CORS_ALLOWED_ORIGINS.split(","));
}

const logFolderpath = path.join(__dirname, "../../.logs");
const logFilename = "api.log";
const logFilepath = path.join(logFolderpath, logFilename);

// Create folder and file, if not existing for the REST-API logger.
if (!fs.existsSync(logFolderpath)) {
  fs.mkdirSync(logFolderpath, { recursive: true });
  fs.openSync(path.join(logFolderpath, logFilename), "a");
}

const logWriteStream = fs.createWriteStream(logFilepath, { flags: "a" });

app.use(express.json());
app.use(helmet());
app.use(bodyparser.json());

app.use(
  cors({
    origin: (origin, cb) => {
      if (
        process.env.NODE_ENV !== "production" ||
        (origin && corsWhitelist.includes(origin))
      ) {
        cb(null, true);
      } else {
        cb(new Error("Not allowed due to CORS restrictions"));
      }
    },
  })
);

app.use(morgan("dev"));

// In production, log Express REST-API requests into logfile.
if (process.env.NODE_ENV === "production") {
  app.use(morgan("combined", { stream: logWriteStream }));
}

app.post(
  "/api/user/register",
  ratelimiter,
  body("email").isEmail(),
  body("username").isLength({ min: 3, max: 32 }).trim().escape(),
  body("password").isLength({ min: 6, max: 128 }),
  body("secretKey").isLength({ min: 1, max: 128 }),
  (req, res) => {
    registerUser(req, res).catch((err) => console.log(err));
  }
);

app.post(
  "/api/user/login",
  ratelimiter,
  body("email").isEmail(),
  body("password"),
  (req, res) => {
    loginUser(req, res).catch((err) => console.log(err));
  }
);

app.get(
  "/api/user/likes",
  query("userId").isMongoId(),
  (req: Request, res: Response, next: NextFunction) => {
    jwtAuth(req, res, next).catch((err) => console.log(err));
  },
  (req: Request, res: Response) => {
    getUserLikes(req, res).catch((err) => console.log(err));
  }
);

app.post(
  "/api/user/like",
  body("userId").isMongoId(),
  body("songId").isMongoId(),
  (req: Request, res: Response, next: NextFunction) => {
    jwtAuth(req, res, next).catch((err) => console.log(err));
  },
  (req: Request, res: Response) => {
    toggleUserLike(req, res).catch((err) => console.log(err));
  }
);

app.get(
  "/api/user/likes-as-songs",
  query("userId").isMongoId(),
  (req: Request, res: Response, next: NextFunction) => {
    jwtAuth(req, res, next).catch((err) => console.log(err));
  },
  (req: Request, res: Response) => {
    getLikesAsSongs(req, res).catch((err) => console.log(err));
  }
);

app.get(
  "/api/app/root-directories",
  (req, res, next) => {
    jwtAuth(req, res, next).catch((err) => console.log(err));
  },
  (req, res) => {
    getRootDirectories(req, res).catch((err) => console.log(err));
  }
);

app.get(
  "/api/app/directory-content",
  (req, res, next) => {
    jwtAuth(req, res, next).catch((err) => console.log(err));
  },
  (req, res) => {
    getDirectoryContent(req, res).catch((err) => console.log(err));
  }
);

app.get(
  "/api/app/stream",
  (req, res, next) => {
    jwtAuth(req, res, next).catch((err) => console.log(err));
  },
  (req, res) => {
    getAudioStream(req, res).catch((err) => console.log(err));
  }
);

app.get(
  "/api/app/cover",
  (req, res, next) => {
    jwtAuth(req, res, next).catch((err) => console.log(err));
  },
  (req, res) => {
    getSongCover(req, res).catch((err) => console.log(err));
  }
);

app.get(
  "/api/app/search",
  (req, res, next) => {
    jwtAuth(req, res, next).catch((err) => console.log(err));
  },
  (req, res) => {
    getSongSearchResults(req, res).catch((err) => console.log(err));
  }
);
