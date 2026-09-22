# Jokebox

A small joke API with a web UI, used as the deployment and CI/CD assignment for
**CEN 5016 - Software Engineering** at UCF.

Jokebox is deliberately boring in what it does and deliberately careful in how
it is put together. The interesting part of this assignment is not the jokes,
it is the pipeline that carries them to a public URL: a test suite, a CI
workflow that gates merges, a deployment described in a file rather than a
dashboard, and a health check that tells you which commit is actually live.

There is no database, no API key, and no network access required. The joke
catalogue is a local JSON file.

---

## Requirements

- **Node.js 24** or newer (`node --version` to check)
- npm 11 or newer, which ships with Node 24

If you need to manage more than one Node version,
[nvm](https://github.com/nvm-sh/nvm) is the usual tool:
`nvm install --lts && nvm use --lts`.

## Getting started

```bash
npm ci        # install exactly what the lockfile pins
npm run dev   # start with auto-reload, then open http://localhost:3000
```

Use `npm ci` rather than `npm install`. It installs precisely the versions in
`package-lock.json`, which is what CI does and what Render does, so it is the
only way to be confident that "works on my machine" means anything.

## The commands you will need

| Command | What it does |
|---|---|
| `npm run dev` | Start locally with auto-reload on file changes |
| `npm start` | Start once, no watching. This is what Render runs |
| `npm test` | Run every test once |
| `npm run test:watch` | Re-run tests as you edit |
| `npm run test:unit-only` | Just the pure service-layer unit tests |
| `npm run test:api-only` | Just the HTTP/API tests |
| `npm run lint` | Run ESLint |
| `npm run smoke -- <url>` | Check a **deployed** instance is really serving |

## The API

| Endpoint | Returns |
|---|---|
| `GET /healthz` | Health, environment, and the commit this build came from |
| `GET /api/jokes` | Every joke, punchlines withheld |
| `GET /api/categories` | The categories you can filter by |
| `GET /api/jokes/random` | One random joke, punchline included |
| `GET /api/jokes/:id` | One joke by id, punchline included |

Unknown paths answer `404` as JSON, and a bad id answers `400`, so the API
never hands a client an HTML error page when it asked for JSON.

## How the code is laid out

```
src/
  server.js               binds the port. The only file that calls listen()
  app.js                  assembles the Express app. Never calls listen()
  config.js               every value read from the environment, in one place
  routes/
    jokes.js              HTTP handlers for the catalogue
    health.js             GET /healthz
  services/
    jokeService.js        the actual logic: plain functions over plain data
  middleware/
    errors.js             404 and 500 handlers
  data/
    jokes.json            the joke catalogue
public/                   the browser UI: no build step, no framework
  index.html
  styles.css
  main.js
tests/
  jokeService.test.js     unit tests, call the service directly
  routes/
    jokes.test.js         API tests, driven over HTTP by supertest
    health.test.js
scripts/
  smoke.js                post-deploy check against a live URL
```

Three separations in that tree are worth understanding, because the assignment
leans on all three:

**`server.js` is separate from `app.js`.** Building the app and starting a
server are different jobs. Because `app.js` never binds a port, the tests can
import it and drive it in-process - no server to start, no port to collide, no
teardown to forget.

**Routes are separate from services.** A route handler reads the request, calls
a function, and picks a status code. The logic lives in `services/`, where it
is a plain function you can call directly. That is why the unit tests run in
milliseconds and the API tests are thin.

**Configuration is separate from code.** Nothing outside `config.js` reads
`process.env`. A deployed app differs from your laptop mostly in its
environment, so keeping that in one file is what stops "it works locally" from
becoming a mystery.

## CI

`.github/workflows/ci.yml` runs `npm ci`, `npm run lint`, and `npm test` on
every push to `main` and on every pull request. The pull request trigger is the
one that matters: it puts a red X or a green check on your PR *before* you
merge, and Render is configured to deploy only after those checks pass.

## Deployment

`render.yaml` describes the service - runtime, build command, start command,
health check path, environment. Because it is a file in the repository rather
than settings in a dashboard, the deployment configuration is version
controlled, diffable, and reviewable in a pull request like any other code.

`/healthz` reports the commit it was built from, which is the fastest way to
answer "did my deploy actually land, or am I looking at the old one?"

---

Full assignment instructions are on the
[course website](https://cs-ucf.github.io/CEN-5016-F26/assignments/assignment-3/).
