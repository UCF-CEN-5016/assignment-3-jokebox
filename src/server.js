/**
 * The entry point Render (and `npm start`) runs.
 *
 * Its whole job is to bind a port. Everything else is in `src/app.js`, which
 * is what keeps the app testable without a live server.
 */

import app from "./app.js";
import { COMMIT, NODE_ENV, PORT } from "./config.js";

app.listen(PORT, () => {
  console.log(`Jokebox listening on port ${PORT} (env=${NODE_ENV}, commit=${COMMIT})`);
});
