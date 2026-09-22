/**
 * HTTP routes for the joke catalogue, mounted at /api by `app.js`.
 *
 * These handlers do three things and nothing else: read the request, call a
 * function from the service layer, and choose a status code. All of the actual
 * logic lives in `src/services/jokeService.js`.
 */

import { Router } from "express";
import {
  findJoke,
  listCategories,
  listJokes,
  randomJoke,
} from "../services/jokeService.js";

export const jokesRouter = Router();

/** GET /api/jokes - every joke, punchlines withheld. */
jokesRouter.get("/jokes", (req, res) => {
  res.json(listJokes());
});

/** GET /api/categories - the categories you can filter by. */
jokesRouter.get("/categories", (req, res) => {
  res.json(listCategories());
});

/**
 * GET /api/jokes/random - one random joke, punchline included.
 *
 * Registered before /jokes/:id on purpose. Express matches in order, so with
 * these two the other way round "random" would be captured as an :id, and this
 * route would be unreachable.
 */
jokesRouter.get("/jokes/random", (req, res) => {
  const joke = randomJoke();
  res.json(joke);
});

/** GET /api/jokes/:id - one joke by id, punchline included. */
jokesRouter.get("/jokes/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: "id must be an integer" });
  }

  const joke = findJoke(id);
  if (!joke) {
    return res.status(404).json({ error: `No joke with id ${id}` });
  }

  res.json(joke);
});
