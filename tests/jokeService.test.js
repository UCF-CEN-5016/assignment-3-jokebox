/**
 * Unit tests for the service layer.
 *
 * These call the functions directly - no Express, no HTTP, no port. That is
 * why they run in milliseconds, and it is the payoff for keeping the logic out
 * of the route handlers.
 */

import { describe, expect, it } from "vitest";
import {
  findJoke,
  jokeCount,
  listCategories,
  listJokes,
  randomJoke,
} from "../src/services/jokeService.js";

describe("listJokes", () => {
  it("returns every joke in the catalogue", () => {
    expect(listJokes()).toHaveLength(jokeCount());
  });

  it("withholds the punchline", () => {
    for (const joke of listJokes()) {
      expect(joke).not.toHaveProperty("punchline");
      expect(joke).toHaveProperty("setup");
      expect(joke).toHaveProperty("id");
    }
  });
});

describe("listCategories", () => {
  it("lists each category once, in alphabetical order", () => {
    const categories = listCategories();
    expect(categories).toEqual([...new Set(categories)].sort());
    expect(categories).toContain("tech");
  });
});

describe("findJoke", () => {
  it("returns the joke with that id, punchline included", () => {
    const joke = findJoke(1);
    expect(joke.id).toBe(1);
    expect(joke.punchline).toBeTruthy();
  });

  it("returns undefined for an id nobody has", () => {
    expect(findJoke(9999)).toBeUndefined();
  });
});

describe("randomJoke", () => {
  it("returns the first joke when randomness is pinned to 0", () => {
    // Injecting `random` is what makes this assertable. With Math.random you
    // could only check "some joke came back".
    expect(randomJoke({ random: () => 0 }).id).toBe(1);
  });

  it("returns the last joke when randomness is pinned just under 1", () => {
    const last = randomJoke({ random: () => 0.9999 });
    expect(last.id).toBe(jokeCount());
  });

  it("only ever picks from the requested category", () => {
    for (let i = 0; i < 20; i += 1) {
      expect(randomJoke({ category: "tech" }).category).toBe("tech");
    }
  });

  it("returns undefined when the category matches nothing", () => {
    expect(randomJoke({ category: "not-a-category" })).toBeUndefined();
  });
});
