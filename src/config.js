/**
 * Every value the app reads from its environment, resolved in one place.
 *
 * A deployed app and your laptop differ mainly in their environment, so the
 * rule this file exists to enforce is: nothing else in `src/` reads
 * `process.env`. When you need a new setting, add it here with a default that
 * makes local development work, and set the real value in Render's dashboard.
 */

/** Port to listen on. Render assigns this; locally it falls back to 3000. */
export const PORT = Number(process.env.PORT ?? 3000);

/** "development" locally, "production" on Render. */
export const NODE_ENV = process.env.NODE_ENV ?? "development";

/**
 * Identifies the running build. Render sets RENDER_GIT_COMMIT automatically,
 * which is what lets /healthz tell you *which* commit is actually live - the
 * question you will ask every time you wonder whether a deploy landed.
 */
export const COMMIT = process.env.RENDER_GIT_COMMIT ?? "local";

export const IS_PRODUCTION = NODE_ENV === "production";
