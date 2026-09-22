/**
 * The health check is what the deployment platform polls and what you will
 * check yourself after every deploy, so it gets its own test.
 */

import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../../src/app.js";

describe("GET /healthz", () => {
  it("responds 200 and reports that it is ok", async () => {
    const response = await request(createApp()).get("/healthz");

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("ok");
  });

  it("reports the commit and environment it is running", async () => {
    const response = await request(createApp()).get("/healthz");

    expect(response.body).toHaveProperty("commit");
    expect(response.body).toHaveProperty("env");
    expect(response.body.jokes).toBeGreaterThan(0);
  });
});
