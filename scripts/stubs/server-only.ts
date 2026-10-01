/**
 * No-op stand-in for Next.js's `server-only` marker, used only by scripts run
 * with `tsconfig.scripts.json`.
 *
 * The real module exists to fail the *client* build if a server module is
 * imported into a browser bundle. `tsx` runs neither a client nor a server
 * bundle, and `server-only` is a Next.js alias rather than an installed package,
 * so it cannot otherwise be resolved at all. Pointing the specifier at this file
 * for script runs is what lets `verify:stock` and `verify:alerts` exercise the
 * real database modules instead of a reimplementation of them.
 *
 * Nothing in the app imports this file.
 */
export {};
