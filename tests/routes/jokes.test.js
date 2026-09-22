/**
 * API tests: the routes, driven over HTTP by supertest.
 *
 * supertest starts the app on an ephemeral port for the duration of each
 * request, so these need no running server and no `npm start` in another
 * terminal. Importing `createApp` rather than a live server is what makes that
 * possible.
 */

import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../../src/app.js";

let app;

beforeEach(() => {
  app = createApp();
});

describe("GET /api/jokes", () => {
  it("responds 200 with the catalogue", async () => {
    const response = await request(app).get("/api/jokes");

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
  });

  it("does not leak punchlines", async () => {
    const response = await request(app).get("/api/jokes");

    for (const joke of response.body) {
      expect(joke.punchline).toBeUndefined();
    }
  });
});

describe("GET /api/categories", () => {
  it("responds 200 with a list of categories", async () => {
    const response = await request(app).get("/api/categories");

    expect(response.status).toBe(200);
    expect(response.body).toContain("animals");
  });
});

describe("GET /api/jokes/random", () => {
  it("responds 200 with a complete joke", async () => {
    const response = await request(app).get("/api/jokes/random");

    expect(response.status).toBe(200);
    expect(response.body.setup).toBeTruthy();
    expect(response.body.punchline).toBeTruthy();
  });
});

describe("GET /api/jokes/:id", () => {
  it("responds 200 with the requested joke", async () => {
    const response = await request(app).get("/api/jokes/2");

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(2);
    expect(response.body.punchline).toBeTruthy();
  });

  it("responds 404 for an id nobody has", async () => {
    const response = await request(app).get("/api/jokes/9999");

    expect(response.status).toBe(404);
    expect(response.body.error).toMatch(/no joke/i);
  });

  it("responds 400 when the id is not a number", async () => {
    const response = await request(app).get("/api/jokes/banana");

    expect(response.status).toBe(400);
  });
});

describe("unknown routes", () => {
  it("respond 404 as JSON rather than HTML", async () => {
    const response = await request(app).get("/api/nothing-here");

    expect(response.status).toBe(404);
    expect(response.body.error).toBe("Not found");
  });
});
