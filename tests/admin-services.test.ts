/**
 * Regression tests for the admin-managed Services (formerly Programs).
 *
 * The static `treatmentPrograms` list in `lib/data/programs.ts` is now only the
 * seed + offline fallback. The live Services page reads from MongoDB through
 * `lib/services.ts` with a small admin API and dashboard tab. These tests read
 * the wiring on disk so a later refactor cannot quietly detach the admin panel
 * from the public page, or drop the fallback that keeps the page populated on a
 * fresh or unreachable database.
 *
 * Run with: npm.cmd test
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

import { translate } from "@/lib/i18n";
import { treatmentPrograms } from "@/lib/data/programs";

const root = path.resolve(process.cwd());

function read(...parts: string[]): string {
  return readFileSync(path.join(root, ...parts), "utf8");
}

describe("dynamic services: the model stores what the admin can edit", () => {
  const model = read("lib", "models", "Service.ts");

  test("every editable field is persisted", () => {
    for (const field of ["slug", "title", "short", "detail", "conditions", "order", "status"]) {
      assert.match(model, new RegExp(`\\b${field}\\b`), `Service model must store '${field}'`);
    }
  });

  test("services are drafts until they are published", () => {
    assert.match(model, /enum:\s*\["draft",\s*"published"\]/);
  });

  test("the bilingual fields are carried over from the old static list", () => {
    for (const field of ["titleFr", "shortFr", "detailFr", "conditionsFr", "noteFr"]) {
      assert.match(model, new RegExp(`\\b${field}\\b`));
    }
  });
});

describe("dynamic services: the admin API is guarded and complete", () => {
  const collection = read("app", "api", "admin", "services", "route.ts");
  const single = read("app", "api", "admin", "services", "[id]", "route.ts");

  test("both routes reject non-admins", () => {
    assert.match(collection, /adminGuard\(\)/);
    assert.match(single, /adminGuard\(\)/);
  });

  test("the list endpoint seeds the built-in services when the collection is empty", () => {
    assert.match(collection, /seedServicesIfEmpty\(\)/);
  });

  test("the collection route can list and create", () => {
    assert.match(collection, /export async function GET/);
    assert.match(collection, /export async function POST/);
  });

  test("the item route can edit and delete", () => {
    assert.match(single, /export async function PATCH/);
    assert.match(single, /export async function DELETE/);
  });
});

describe("dynamic services: the public page reads live data with a fallback", () => {
  const page = read("app", "programs", "page.tsx");
  const helper = read("lib", "services.ts");

  test("the Services page uses the database-backed helper", () => {
    assert.match(page, /getLocalizedServices/);
    assert.doesNotMatch(page, /localizedPrograms\(/);
  });

  test("the helper falls back to the built-in list when the database is empty", () => {
    assert.match(helper, /import\s*\{\s*treatmentPrograms\s*\}/);
    assert.match(helper, /if\s*\(!docs\.length\)\s*return/);
  });

  test("the public query only returns published services", () => {
    assert.match(helper, /find\(\{\s*status:\s*"published"\s*\}\)/);
  });

  test("the built-in list is non-empty so the fallback can never blank the page", () => {
    assert.ok(treatmentPrograms.length > 0);
  });
});

describe("dynamic services: the admin dashboard exposes the tab", () => {
  const shell = read("components", "account", "dashboard-screen.tsx");

  test("the dashboard registers the services tab and its panel", () => {
    assert.match(shell, /"admin-services"/);
    assert.match(shell, /ServicesTab/);
  });

  test("the nav label is translated into both locales", () => {
    assert.equal(translate("en", "dash.shell.nav.adminServices"), "Services");
    assert.equal(translate("fr", "dash.shell.nav.adminServices"), "Services");
  });
});
