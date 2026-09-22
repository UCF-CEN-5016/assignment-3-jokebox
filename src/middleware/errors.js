/**
 * The two handlers that catch everything the routes did not.
 *
 * Express decides these are error/fallback handlers by *position* - they are
 * registered last in `app.js` - rather than by anything in their names.
 */

/** Nothing matched the request: answer 404 in the same JSON shape as the API. */
export function notFound(req, res) {
  res.status(404).json({ error: "Not found", path: req.originalUrl });
}

/**
 * Something threw. Log it server-side and answer with a generic message.
 *
 * The four-argument signature is required: Express identifies error handlers by
 * arity, so dropping the unused `next` silently turns this back into ordinary
 * middleware that never runs. That is also why it is `_next` rather than
 * deleted - the linter is told to ignore underscore-prefixed arguments.
 */
export function errorHandler(err, req, res, _next) {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
}
