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
 *
 * A free Render service sleeps after about 15 minutes without traffic, and the
 * first request after that has to wait for it to boot - up to a minute or so.
 * While it wakes, Render may answer with a 502/503 or an HTML holding page
 * instead of your app. A scheduled run almost always finds the app asleep, so
 * the script first waits for /healthz to come up, and only then runs the
 * checks. An app that never comes up still fails, just not on the first try.
 *
 * SMOKE_WAKE_SECONDS sets how long to wait for it to wake (default 180).
 */

const base = process.argv[2]?.replace(/\/$/, "");

if (!base) {
  console.error("usage: npm run smoke -- <base-url>");
  process.exit(2);
}

// How long to keep trying while the app wakes, and how long any one request
// may take. Without a per-request limit, a connection Render holds open while
// the instance boots could hang the run until GitHub cancels the job.
const wakeSeconds = Number(process.env.SMOKE_WAKE_SECONDS ?? 180);
const REQUEST_TIMEOUT_MS = 30_000;
const RETRY_DELAY_MS = 5_000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Poll /healthz until it reports ok, or give up once wakeSeconds have passed. */
async function waitForWake() {
  const url = `${base}/healthz`;
  const deadline = Date.now() + wakeSeconds * 1000;
  const started = Date.now();

  for (let attempt = 1; ; attempt++) {
    let reason;
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
      const text = await response.text();
      if (response.ok) {
        try {
          if (JSON.parse(text).status === "ok") {
            const waited = Math.round((Date.now() - started) / 1000);
            if (attempt > 1) console.log(`  awake after ${waited}s\n`);
            return;
          }
          reason = "responded 200 but did not report status ok";
        } catch {
          // Render's holding page is HTML served with a 200.
          reason = "responded 200 with a page that is not JSON (probably still waking)";
        }
      } else {
        reason = `responded ${response.status} ${response.statusText}`;
      }
    } catch (err) {
      reason = err.name === "TimeoutError" ? "timed out" : err.cause?.code ?? err.message;
    }

    if (Date.now() + RETRY_DELAY_MS > deadline) {
      throw new Error(`${url} did not come up within ${wakeSeconds}s (last attempt ${reason})`);
    }
    console.log(`  waiting for ${base} to wake (attempt ${attempt}: ${reason})`);
    await sleep(RETRY_DELAY_MS);
  }
}

/** Fetch a path and fail loudly with a useful message if it is not 200 JSON. */
async function check(path, assertion, describe) {
  const url = `${base}${path}`;
  const response = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });

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

try {
  await waitForWake();
} catch (err) {
  console.error(`  FAIL  /healthz\n        ${err.message}`);
  console.error(`\nSmoke test failed against ${base}`);
  process.exit(1);
}

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
