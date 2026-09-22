/**
 * Assembles the Express application: static files, routes, error handling.
 *
 * Note what this file does *not* do - it never calls `listen`. Building the app
 * and starting a server are separated so the tests can import this module and
 * drive it in-process through supertest, with no port bound and nothing to
 * clean up. `src/server.js` is the only place a port is opened.
 */

import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { healthRouter } from "./routes/health.js";
import { jokesRouter } from "./routes/jokes.js";
import { errorHandler, notFound } from "./middleware/errors.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(here, "..", "public");

export function createApp() {
  const app = express();

  app.use(express.json());

  // The browser UI.
  app.use(express.static(publicDir));

  // The API.
  app.use("/", healthRouter);
  app.use("/api", jokesRouter);

  // Registered last: these two only run when nothing above matched or threw.
  app.use(notFound);
  app.use(errorHandler);

  return app;
}

export default createApp();
