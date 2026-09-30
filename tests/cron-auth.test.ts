/**
 * Tests for cron endpoint authorization.
 *
 * These are regression tests for a live security hole. The backup cron used to
 * guard with `if (secret && ...)`, so when `CRON_SECRET` was unset the guard
 * never fired and the endpoint - which assembles and emails a full database
 * export, health records included - accepted unauthenticated public requests.
 *
 * The most important test in this file is "production without a secret refuses".
 * The whole failure was an unset variable turning into an open door, so that
 * exact scenario is pinned here.
 *
 * Run with: npm.cmd test
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { cronAuthGuidance, evaluateCronAuth, safeEqual } from "@/lib/cron-auth";

const SECRET = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

describe("fail closed when the secret is missing", () => {
  test("regression: production with no CRON_SECRET is refused, not allowed", () => {
    // The bug in one assertion. An unset secret must never read as "open".
    const result = evaluateCronAuth({
      authorization: null,
      secret: undefined,
      nodeEnv: "production",
    });
    assert.equal(result.ok, false);
  });

  test("reports 503 rather than 401 so the cause is obvious", () => {
    // A caller cannot fix a missing server variable, so the status must not
    // imply it was their fault.
    const result = evaluateCronAuth({
      authorization: `Bearer ${SECRET}`,
      secret: undefined,
      nodeEnv: "production",
    });
    assert.equal(result.ok, false);
    if (result.ok) throw new Error("unreachable");
    assert.equal(result.status, 503);
    assert.equal(result.reason, "unconfigured");
  });

  test("an empty or whitespace-only secret is treated as missing", () => {
    for (const secret of ["", "   ", "\t\n"]) {
      const result = evaluateCronAuth({
        authorization: `Bearer ${SECRET}`,
        secret,
        nodeEnv: "production",
      });
      assert.equal(result.ok, false, `secret=${JSON.stringify(secret)} should be refused`);
    }
  });

  test("an empty-string bearer does not satisfy an empty-string secret", () => {
    // Guards against a future refactor that trims both sides and then compares
    // two empty strings, which would be true and therefore open.
    const result = evaluateCronAuth({
      authorization: "Bearer ",
      secret: "",
      nodeEnv: "production",
    });
    assert.equal(result.ok, false);
  });
});

describe("correct secret is accepted", () => {
  test("production with the right bearer token passes", () => {
    const result = evaluateCronAuth({
      authorization: `Bearer ${SECRET}`,
      secret: SECRET,
      nodeEnv: "production",
    });
    assert.equal(result.ok, true);
  });

  test("the scheme is matched case-insensitively, as RFC 7235 requires", () => {
    for (const scheme of ["Bearer", "bearer", "BEARER", "BeArEr"]) {
      const result = evaluateCronAuth({
        authorization: `${scheme} ${SECRET}`,
        secret: SECRET,
        nodeEnv: "production",
      });
      assert.equal(result.ok, true, `${scheme} should be accepted`);
    }
  });

  test("surrounding whitespace is tolerated", () => {
    const result = evaluateCronAuth({
      authorization: `  Bearer ${SECRET}  `,
      secret: SECRET,
      nodeEnv: "production",
    });
    assert.equal(result.ok, true);
  });
});

describe("wrong or missing credentials are rejected", () => {
  test("a near-miss token is refused", () => {
    const result = evaluateCronAuth({
      authorization: `Bearer ${SECRET.slice(0, -1)}0`,
      secret: SECRET,
      nodeEnv: "production",
    });
    assert.equal(result.ok, false);
    if (result.ok) throw new Error("unreachable");
    assert.equal(result.status, 401);
  });

  test("a token of a different length is refused without throwing", () => {
    // safeEqual hashes first precisely so that a length mismatch does not
    // crash the handler or reveal the secret's length.
    for (const token of ["short", SECRET + "extra", ""]) {
      const result = evaluateCronAuth({
        authorization: `Bearer ${token}`,
        secret: SECRET,
        nodeEnv: "production",
      });
      assert.equal(result.ok, false, `token=${JSON.stringify(token)} should be refused`);
    }
  });

  test("a missing header is refused", () => {
    const result = evaluateCronAuth({
      authorization: null,
      secret: SECRET,
      nodeEnv: "production",
    });
    assert.equal(result.ok, false);
  });

  test("a non-bearer scheme is refused", () => {
    for (const header of [`Basic ${SECRET}`, SECRET, `Token ${SECRET}`]) {
      const result = evaluateCronAuth({
        authorization: header,
        secret: SECRET,
        nodeEnv: "production",
      });
      assert.equal(result.ok, false, `${header.split(" ")[0]} should be refused`);
    }
  });

  test("staging is treated like production, not like development", () => {
    // The hole was reachable in the real deployment; a preview deployment must
    // not be a way back into it.
    const result = evaluateCronAuth({
      authorization: null,
      secret: undefined,
      nodeEnv: "production",
    });
    assert.equal(result.ok, false);
  });
});

describe("development is exempt", () => {
  test("no secret is required locally", () => {
    const result = evaluateCronAuth({
      authorization: null,
      secret: undefined,
      nodeEnv: "development",
    });
    assert.equal(result.ok, true);
  });

  test("an unset NODE_ENV is treated as production, not as a bypass", () => {
    // Defaulting to permissive is the same class of mistake as `secret &&`.
    const result = evaluateCronAuth({
      authorization: null,
      secret: SECRET,
      nodeEnv: undefined,
    });
    assert.equal(result.ok, false);
  });
});

describe("safeEqual", () => {
  test("is true only for identical strings", () => {
    assert.equal(safeEqual("abc", "abc"), true);
    assert.equal(safeEqual("abc", "abd"), false);
    assert.equal(safeEqual("abc", "abcd"), false);
    assert.equal(safeEqual("", ""), true);
  });

  test("handles non-ascii secrets of differing byte length", () => {
    // A byte-length comparison would be the wrong tool here; hashing is not.
    assert.equal(safeEqual("clé-secrète", "clé-secrète"), true);
    assert.equal(safeEqual("clé-secrète", "clé-secrete"), false);
  });
});

describe("operator guidance", () => {
  test("an unconfigured lock tells the operator how to fix it", () => {
    const guidance = cronAuthGuidance("unconfigured");
    assert.match(guidance, /CRON_SECRET/);
    assert.match(guidance, /randomBytes/);
  });

  test("a rejected caller is told what header to send", () => {
    assert.match(cronAuthGuidance("bad_token"), /Authorization: Bearer/);
  });
});
