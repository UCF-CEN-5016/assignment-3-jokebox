/**
 * The health check, mounted at /healthz.
 *
 * Deployment platforms poll an endpoint like this to decide whether an
 * instance is actually serving, as opposed to merely running. It is also the
 * fastest way for *you* to answer "did my deploy land?", because it reports the
 * commit it was built from.
 */

import { Router } from "express";
import { COMMIT, NODE_ENV } from "../config.js";
import { jokeCount } from "../services/jokeService.js";

export const healthRouter = Router();

healthRouter.get("/healthz", (req, res) => {
  res.json({
    status: "ok",
    env: NODE_ENV,
    commit: COMMIT,
    jokes: jokeCount(),
    uptimeSeconds: Math.round(process.uptime()),
  });
});
