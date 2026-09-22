#!/usr/bin/env node
/**
 * Smoke test: prove a *deployed* instance is actually serving.
 *
 * The unit and API tests check the code. They say nothing about whether the
 * thing you deployed came up, which is a genuinely different question - a
 * build can go green and still ship an instance that crashes on boot, listens
 * on the wrong port, or serves an older commit than you think.
 *
 * Usage:
 *   npm run smoke -- https://your-app.onrender.com
 */

const base = process.argv[2]?.replace(/\/$/, "");

if (!base) {
  console.error("usage: npm run smoke -- <base-url>");
  process.exit(2);
}

/** Fetch a path and fail loudly with a useful message if it is not 200 JSON. */
async function check(path, assertion, describe) {
  const url = `${base}${path}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`${url} responded ${response.status} ${response.statusText}`);
  }

  const body = await response.json();
  if (!assertion(body)) {
    throw new Error(`${url} responded 200 but ${describe}\n  got: ${JSON.stringify(body)}`);
  }

  return body;
}

const checks = [
  ["/healthz", (b) => b.status === "ok", "did not report status ok"],
  ["/api/jokes", (b) => Array.isArray(b) && b.length > 0, "returned no jokes"],
  ["/api/jokes/random", (b) => Boolean(b.setup && b.punchline), "returned an incomplete joke"],
];

let failed = false;

for (const [path, assertion, describe] of checks) {
  try {
    await check(path, assertion, describe);
    console.log(`  ok    ${path}`);
  } catch (err) {
    failed = true;
    console.error(`  FAIL  ${path}\n        ${err.message}`);
  }
}

if (failed) {
  console.error(`\nSmoke test failed against ${base}`);
  process.exit(1);
}

const health = await check("/healthz", () => true, "");
console.log(`\nAll checks passed against ${base} (commit ${health.commit}, env ${health.env})`);
