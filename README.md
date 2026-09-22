# Jokebox

A small joke API with a web UI, used as the deployment and CI/CD assignment for
**CEN 5016 - Software Engineering** at UCF.

Jokebox is deliberately boring in what it does and deliberately careful in how
it is put together. The interesting part of this assignment is not the jokes,
it is the pipeline that carries them to a public URL: a test suite, a CI
workflow that gates merges, a deployment described in a file rather than in a
dashboard, and a health check that tells you which commit is actually live.

No database, no API keys, no network access. The joke catalogue is a JSON file.

---

## Quick start

Requires **Node.js 24+** (`node --version`). If you juggle Node versions,
[nvm](https://github.com/nvm-sh/nvm) is the usual tool.

```bash
npm ci        # install exactly what the lockfile pins
npm run dev   # start with auto-reload -> http://localhost:3000
```

Use `npm ci`, not `npm install`. It installs precisely the versions in
`package-lock.json` - which is what CI runs and what Render runs, so it is the
only way "it works on my machine" tells you anything.

| Command | What it does |
|---|---|
| `npm run dev` | Start locally with auto-reload |
| `npm start` | Start once. This is what Render runs |
| `npm test` | Run every test |
| `npm run test:watch` | Re-run tests as you edit |
| `npm run test:unit-only` | Just the service-layer unit tests |
| `npm run test:api-only` | Just the HTTP/API tests |
| `npm run lint` | Run ESLint |
| `npm run smoke -- <url>` | Check a **deployed** instance is really serving |

## How a web app like this works

If you have not built a web application before, this is the whole idea. There
are two programs, not one. A **browser** on someone's laptop draws the page, and
a **server** somewhere else holds the data and answers questions about it. They
are separate, they may be thousands of miles apart, and they talk only by
sending messages over HTTP.

Every time you press "New joke", this round trip happens:

```
        +-------------------------------------------------+
        |  BROWSER                                        |
        |                                                 |
        |  public/index.html   the page's structure       |
        |  public/styles.css   what it looks like         |
        |  public/main.js      asks for jokes, shows them |
        +-------------------------------------------------+
                |                                 ^
                | (1) GET /api/jokes/random       | (4) the JSON reply
                v                                 |
        +-------------------------------------------------+
        |  SERVER   Node + Express                        |
        |                                                 |
        |  src/server.js     opens the port               |
        |       |                                         |
        |  src/app.js        matches the URL to a handler |
        |       |                                         |
        |  src/routes/       (2) read the request,        |
        |       |                choose a status code     |
        |       |                                         |
        |  src/services/     (3) the actual logic:        |
        |       |                pick, filter, find       |
        |       |                                         |
        |  src/data/             jokes.json               |
        +-------------------------------------------------+
```

1. `public/main.js`, running in the browser, calls `fetch("/api/jokes/random")`.
   That sends an HTTP request across the network.
2. On the server, `app.js` looks at the URL and hands it to the matching handler
   in `src/routes/jokes.js`. The handler's job is narrow: read the request, call
   something, pick a status code.
3. The handler calls `randomJoke()` in `src/services/jokeService.js`, which does
   the real work against `src/data/jokes.json`.
4. The joke travels back as JSON - just text, shaped like
   `{"setup": "...", "punchline": "..."}` - and `main.js` puts it into the page.

The browser never touches `jokes.json`. It only ever sees what the API chose to
send, which is why `GET /api/jokes` can withhold punchlines: they are simply
never put in the reply.

You can watch this yourself. Start the app and run:

```bash
curl http://localhost:3000/api/jokes/random
```

That is exactly what the browser does - `curl` is just a browser with no
opinions about drawing.

## Repository structure

```
src/
  server.js               binds the port. The only file that calls listen()
  app.js                  assembles the Express app. Never calls listen()
  config.js               every value read from the environment, in one place
  routes/
    jokes.js              HTTP handlers for the catalogue
    health.js             GET /healthz
  services/
    jokeService.js        the logic: plain functions over plain data
  middleware/
    errors.js             404 and 500 handlers
  data/
    jokes.json            the joke catalogue
public/                   the browser UI. No build step, no framework
tests/
  jokeService.test.js     unit tests, call the service directly
  routes/                 API tests, driven over HTTP by supertest
scripts/
  smoke.js                post-deploy check against a live URL
render.yaml               the deployment, as a reviewable file
.github/workflows/ci.yml  lint and tests on every push and pull request
```

Three separations in that tree carry most of the design, and the assignment
leans on all three:

**`server.js` is separate from `app.js`.** Building the app and starting a
server are different jobs. Because `app.js` never binds a port, the tests can
import it and drive it in-process - no server to start, no port to collide with,
no teardown to forget.

**Routes are separate from services.** A route handler reads the request, calls
a function, and picks a status code; the logic lives in `services/` as plain
functions over plain data. That is why the unit tests need no HTTP at all and
the whole suite finishes in well under a second.

**Configuration is separate from code.** Nothing outside `config.js` reads
`process.env`. A deployed app differs from your laptop mostly in its
environment, so keeping that in one file is what stops "but it works locally"
from becoming a mystery.

## The API

| Endpoint | Returns |
|---|---|
| `GET /healthz` | Health, environment, and the commit this build came from |
| `GET /api/jokes` | Every joke, punchlines withheld |
| `GET /api/categories` | The categories you can filter by |
| `GET /api/jokes/random` | One random joke, punchline included |
| `GET /api/jokes/:id` | One joke by id, punchline included |

Unknown paths answer `404` as JSON and a bad id answers `400`, so a client that
asked for JSON never gets an HTML error page back.

## CI and deployment

`.github/workflows/ci.yml` runs `npm ci`, `npm run lint`, and `npm test` on
every push to `main` and every pull request. The pull request trigger is the one
that matters: it puts a red X or a green check on your PR *before* you merge,
and Render is configured to deploy only once those checks pass.

`render.yaml` describes the service - runtime, build command, start command,
health check path, environment. Because it is a file in the repository rather
than settings in someone's dashboard, the deployment is version controlled,
diffable, and reviewable like any other code.

`/healthz` reports the commit it was built from, which is the fastest way to
answer "did my deploy land, or am I looking at the old one?"

---

Full instructions are on the
[course website](https://cs-ucf.github.io/CEN-5016-F26/assignments/assignment-3/).
