import test from "node:test";
import assert from "node:assert/strict";
import {
  MRN_MAX_LENGTH,
  MRN_PATTERN,
  buildDirectoryFilter,
  escapeRegExp,
  normalizeMrn,
  toDirectoryRow,
  validateMrn,
} from "@/lib/user-directory";

/**
 * MRN rules and the Users directory filter.
 *
 * The rule under test: an MRN identifies exactly one patient's file, so the
 * format is strict, what is typed is normalised before it is stored, and a
 * blank box in the search shows everyone rather than nobody.
 */

// ---------------------------------------------------------------- normalising

test("an MRN is stored trimmed and uppercased", () => {
  assert.equal(normalizeMrn("  s1900615 "), "S1900615");
});

test("two admins typing the same number differently get one number", () => {
  // "s19 00615" and "S19-00615" must not become two different patients' files.
  assert.equal(normalizeMrn("s19 00615"), normalizeMrn("S19-00615"));
});

test("repeated spaces collapse to a single dash rather than stacking", () => {
  assert.equal(normalizeMrn("S19   0615"), "S19-0615");
});

test("inner dashes are left alone", () => {
  assert.equal(normalizeMrn("s19-0615-a"), "S19-0615-A");
});

test("a missing value normalises to empty rather than the string undefined", () => {
  assert.equal(normalizeMrn(undefined), "");
  assert.equal(normalizeMrn(null), "");
});

// ------------------------------------------------------------------ validating

test("an empty MRN means remove, which is allowed and is not an error", () => {
  const result = validateMrn("   ");
  assert.deepEqual(result, { ok: true, removing: true, value: "" });
});

test("a well-formed MRN is accepted and normalised", () => {
  assert.deepEqual(validateMrn(" s1900615 "), { ok: true, removing: false, value: "S1900615" });
});

test("a one-character MRN is rejected as too short rather than as malformed", () => {
  const result = validateMrn("X");
  assert.equal(result.ok, false);
  assert.match(result.ok === false ? result.error : "", /too short/i);
});

test("an over-long MRN is rejected with the limit stated", () => {
  const result = validateMrn("S".repeat(MRN_MAX_LENGTH + 1));
  assert.equal(result.ok, false);
  assert.match(result.ok === false ? result.error : "", new RegExp(String(MRN_MAX_LENGTH)));
});

test("punctuation that could break a later lookup is rejected", () => {
  for (const bad of ["S19/0615", "S19.0615", "S19_0615", "$19-0615", "-S1900615", "S19 0615*"]) {
    assert.equal(validateMrn(bad).ok, false, `${bad} should be rejected`);
  }
});

test("the pattern accepts the clinic's own example", () => {
  assert.equal(MRN_PATTERN.test("S1900615"), true);
});

// -------------------------------------------------------------------- escaping

test("a search term is escaped so it cannot act as a wildcard", () => {
  assert.equal(escapeRegExp("a+b"), "a\\+b");
  // A real query for the literal text must not become "any char then b".
  assert.equal(new RegExp(escapeRegExp("a+b"), "i").test("aab"), false);
  assert.equal(new RegExp(escapeRegExp("a+b"), "i").test("A+B"), true);
});

// --------------------------------------------------------------------- filters

test("an empty search shows every account rather than none", () => {
  assert.deepEqual(buildDirectoryFilter(), {});
  assert.deepEqual(buildDirectoryFilter({ query: "   " }), {});
});

test("searching matches name, email, phone or MRN case-insensitively", () => {
  const filter = buildDirectoryFilter({ query: "s1900615" });
  assert.ok(filter.$or, "expected an $or across the searchable fields");
  const fields = (filter.$or as Array<Record<string, RegExp>>).map((c) => Object.keys(c)[0]);
  assert.deepEqual(fields, ["name", "email", "phone", "mrn"]);
  for (const clause of filter.$or as Array<Record<string, RegExp>>) {
    assert.equal(Object.values(clause)[0].test("S1900615"), true);
    assert.equal(Object.values(clause)[0].flags, "i");
  }
});

test("a role filter narrows the result", () => {
  assert.deepEqual(buildDirectoryFilter({ role: "admin" }), { role: "admin" });
  assert.deepEqual(buildDirectoryFilter({ role: "all", query: "ada" }), {
    $or: buildDirectoryFilter({ query: "ada" }).$or,
  });
});

test("assigned and unassigned are exact opposites", () => {
  const assigned = buildDirectoryFilter({ mrnState: "assigned" });
  const unassigned = buildDirectoryFilter({ mrnState: "unassigned" });
  assert.ok(assigned.mrn, "assigned must constrain mrn");
  assert.ok(unassigned.$or, "unassigned must allow both absent and empty");

  // A patient with no MRN at all is found by the unassigned search.
  const unassignedClauses = unassigned.$or as Array<Record<string, { $exists?: boolean } | undefined>>;
  const matchesMissing = unassignedClauses.some((c) => Object.values(c)[0]?.$exists === false);
  assert.equal(matchesMissing, true);
});

test("a search and a role filter combine as AND, not as an accidental OR", () => {
  const filter = buildDirectoryFilter({ query: "ada", role: "doctor" });
  assert.ok(Array.isArray(filter.$and), "clauses must be ANDed");
  const textClause = (filter.$and as Array<Record<string, unknown>>)[0];
  assert.ok(textClause.$or, "the text clause keeps its own $or");
  assert.deepEqual((filter.$and as Array<Record<string, unknown>>)[1], { role: "doctor" });
});

test("a query with regex metacharacters is not treated as a pattern", () => {
  const filter = buildDirectoryFilter({ query: ".*" });
  const clause = (filter.$or as Array<Record<string, RegExp>>)[0];
  assert.equal(Object.values(clause)[0].test("anything"), false);
});

// ------------------------------------------------------------------ row shape

test("a directory row defaults every optional field so the tile never renders undefined", () => {
  const row = toDirectoryRow({
    _id: "abc",
    name: "Ada",
    email: "ada@example.com",
    role: "user",
    isActive: true,
    emailVerified: false,
    createdAt: new Date("2026-01-01T00:00:00Z"),
  });
  assert.equal(row.id, "abc");
  assert.equal(row.mrn, "");
  assert.equal(row.phone, "");
  assert.equal(row.dob, "");
  assert.equal(row.gender, "");
  assert.equal(row.address, "");
  assert.equal(row.avatar, "");
  assert.equal(row.whatsappOptIn, false);
  assert.equal(row.lastLoginAt, null);
  assert.equal(row.familyCount, 0);
});

test("an unassigned patient reports no MRN rather than an empty one, so the tile can say so", () => {
  const row = toDirectoryRow({
    _id: "abc",
    name: "Ada",
    email: "ada@example.com",
    role: "user",
    isActive: true,
    emailVerified: true,
    mrn: "S1900615",
    createdAt: new Date("2026-01-01T00:00:00Z"),
  });
  assert.equal(row.mrn, "S1900615");
  assert.equal(row.familyCount, 0);
});

test("family members are counted, not shipped, so the list stays light", () => {
  const row = toDirectoryRow({
    _id: "abc",
    name: "Ada",
    email: "ada@example.com",
    role: "user",
    isActive: true,
    emailVerified: true,
    familyMembers: [{ name: "Kid" }, { name: "Other" }],
    createdAt: new Date("2026-01-01T00:00:00Z"),
  });
  assert.equal(row.familyCount, 2);
  assert.equal("familyMembers" in row, false);
});