/**
 * The joke catalogue and the operations over it.
 *
 * Everything here is a plain function over plain data: no `req`, no `res`, no
 * Express. That separation is the point of the file. Route handlers are
 * awkward to test because you have to build an HTTP request to reach them;
 * these functions you can call directly, which is why the unit tests in
 * `tests/jokeService.test.js` need no server at all.
 */

import catalogue from "../data/jokes.json" with { type: "json" };

/** A joke as the API exposes it before the punchline is revealed. */
function withoutPunchline({ id, category, setup }) {
  return { id, category, setup };
}

/** Every joke, punchlines withheld. */
export function listJokes() {
  return catalogue.map(withoutPunchline);
}

/** The distinct categories present in the catalogue, alphabetically. */
export function listCategories() {
  return [...new Set(catalogue.map((joke) => joke.category))].sort();
}

/**
 * One joke, punchline included.
 * @returns the joke, or `undefined` if no joke has that id.
 */
export function findJoke(id) {
  return catalogue.find((joke) => joke.id === id);
}

/**
 * A joke chosen at random, punchline included.
 *
 * `random` is injectable so tests can pin the choice instead of hoping a
 * random pick eventually covers the branch they care about. Production callers
 * omit it and get Math.random.
 *
 * @param {object} [options]
 * @param {string} [options.category] restrict the pick to one category
 * @param {() => number} [options.random] source of randomness in [0, 1)
 * @returns a joke, or `undefined` if the category matches nothing
 */
export function randomJoke({ category, random = Math.random } = {}) {
  const pool = category
    ? catalogue.filter((joke) => joke.category === category)
    : catalogue;
  if (pool.length === 0) return undefined;
  return pool[Math.floor(random() * pool.length)];
}

/** How many jokes the catalogue holds. Used by /healthz as a sanity check. */
export function jokeCount() {
  return catalogue.length;
}
