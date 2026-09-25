# Performance testing and production acceptance

**Baseline:** 25 September 2026  
**Purpose:** Reproducible performance testing for S19's public website, storefront, patient portal, and clinic APIs.

Performance budgets are engineering targets, not guarantees. Measure against the real production domain, production-like data, and the hosting plan that will be used in production.

## 1. Current performance risks to test

1. `app/layout.tsx` reads the locale cookie. The locale-aware root currently produces dynamic public pages, so many pages are marked `ƒ` in the build output despite page-level `revalidate` values.
2. The home page performs several independent data operations and probes active remote video URLs before rendering. Slow video providers can therefore delay server response.
3. Catalog/content reads include MongoDB and bundled fallback behavior. Database latency and connection status affect dynamic requests.
4. Several images use raw `<img>`, bypassing Next Image optimization and potentially sending unnecessarily large assets.
5. Framer Motion, OGL, charts/visuals, dashboard tabs, and icon packages can increase client JavaScript and hydration cost.
6. Several dashboard/admin APIs fetch up to 100–500 records without pagination. Performance and response size will degrade as data grows.
7. Clinical dashboard data is loaded across multiple effects/tabs; repeated navigation and refreshes can create avoidable request bursts.
8. Cloudinary transformations, remote image dimensions, font loading, and third-party video behavior materially affect field performance.
9. SMTP and external translation calls have network timeouts or best-effort behavior that can affect request duration when awaited.
10. No repository performance-test script, load-test suite, RUM configuration, or performance budget is currently committed.

## 2. Environments and test data

### Environments

Use at least three environments:

| Environment | Purpose | Data/behavior |
| --- | --- | --- |
| Local | Regression and debugging | Seeded/anonymized dataset; no real personal data. |
| Staging | Repeatable integration/load testing | Production-like infrastructure and anonymized/generated records. Never use production patient data. |
| Production | Canary/field verification | Real data handled under approved privacy/security controls; no destructive load testing. |

Pin the test version with a commit SHA. Record hostname, region, database tier, Cloudinary plan, SMTP provider, and whether video/third-party integrations are enabled.

### Required datasets

Test at three approximate account/data volumes:

- **Small:** 100 clients, matching the expected early clinic size.
- **Target:** 1,000 clients, the stated upper planning range.
- **Stress:** synthetic data above 1,000 clients to identify the first bottleneck; do not describe this as required business capacity.

Generate synthetic records across every relevant collection, including long treatment histories and realistic attachment counts. Use fake names, emails, phone numbers, diagnoses, and image assets. Never copy MongoDB or Cloudinary production data into an unapproved test system.

## 3. Metrics and definitions

Capture at least:

### User-facing metrics

- TTFB (time to first byte).
- FCP (First Contentful Paint).
- LCP (Largest Contentful Paint).
- CLS (Cumulative Layout Shift).
- INP (Interaction to Next Paint).
- Total Blocking Time.
- Speed Index and Time to Interactive for diagnostic comparison.
- JavaScript transfer, decoded JavaScript, CSS/image/font transfer.
- Main-thread task duration and long tasks.

### API metrics

- Request count and requests per active user.
- p50, p75, p90, p95, and p99 latency.
- Error and timeout rate.
- MongoDB query duration and documents examined/returned.
- SMTP/Cloudinary/third-party call duration and failure rate.
- Concurrent sessions and database connections.
- Serverless invocations, CPU, memory, and function duration if the chosen host exposes them.

### Reliability metrics

- Duplicate orders or bookings caused by retries.
- Lost cart/message/clinical submissions.
- Session invalidation errors.
- Media upload failure and orphaned-resource count.
- Backup duration/size/failure rate (daily emailed backup + optional archive pipeline are now implemented; still measure them).

## 4. Proposed performance budgets

Validate these initial budgets against real users, then tighten or document exceptions.

| Surface/device | Metric | Initial target |
| --- | --- | --- |
| Public page, mobile + p75 field data | LCP | ≤ 2.5 s |
| Public page, mobile + p75 field data | INP | ≤ 200 ms |
| Public page, mobile + p75 field data | CLS | ≤ 0.10 |
| Public page, production server | TTFB | ≤ 800 ms |
| Public page | Initial route JavaScript | ≤ 200 KB compressed where practical; investigate every increase. |
| Public page | Total initial transfer | ≤ 1.0 MB compressed excluding intentionally deferred media. |
| Patient dashboard, warm session | Main route TTFB p95 | ≤ 1.2 s |
| Patient dashboard | tab/action API p95 excluding email/upload | ≤ 800 ms |
| Simple Mongo read API | p95 | ≤ 500 ms |
| Mongo write API | p95 | ≤ 800 ms |
| Cloudinary upload | p95 | ≤ 5 s for approved file sizes on clinic network |
| Error rate | public/portal 5xx | < 0.5%; investigate every clinical write failure. |
| Availability | patient/clinic critical routes | Target agreed with provider; measure, do not assume. |

Do not force a dashboard to meet the public-page JavaScript budget: the application is data-heavy. Instead, measure interaction responsiveness and prevent the entire clinical/admin bundle from loading on the public storefront.

## 5. Test matrix

### 5.1 Routes

| Class | Representative routes |
| --- | --- |
| Home/marketing | `/`, `/about`, `/programs`, `/telehealth` |
| Catalog/content | `/shop`, `/shop/[slug]`, `/health-library`, `/blog`, `/blog/[slug]` |
| Conversion | `/contact`, `/cart`, `/checkout`, `/track` |
| Legal | `/privacy`, `/terms`, `/cookies`, `/refund-and-returns` |
| Authentication | `/account`, verify, forgot/reset password |
| Patient portal | `/account` with overview, appointments, orders, messages, records, prescriptions, treatment, family, stories, settings |
| Staff portal | Clinical, treatment, order, user/message, content, and subscriber tabs |
| Doctor portal | Clinical-work tabs only (appointments, records, prescriptions, treatment plans, treatment alerts, patients & messages) + settings |
| Administration (roles/backups) | `GET/PATCH /api/admin/roles`, `GET/POST /api/admin/backups`, `GET /api/cron/backups` |
| API | Public content, authenticated patient, administrator, uploads, order tracking, translation/video proxy |

Test one actual slug from each dynamic content class. Do not put secrets or real identifiers in a committed test file.

### 5.2 Viewports and network profiles

- Desktop: 1440 × 900.
- Mobile: 390 × 844.
- Slow 4G: approximately 1.6 Mbps down, 750 kbps up, 150 ms RTT.
- Very slow 4G/careful field test: approximately 400 kbps down and 400 ms RTT.
- Desktop broadband: 10 Mbps down, 1 Mbps up, 30 ms RTT.

Test both languages. A French response can have different image/font/content sizes and must not be assumed equivalent.

### 5.3 Browser coverage

Minimum release matrix:

- Chrome/Edge current and previous major.
- Firefox current ESR/current desktop.
- Safari current macOS/iOS.
- Chrome Android low/mid-range hardware profile.
- iOS Safari on a real supported device.

Test reduced motion, keyboard-only navigation, screen-reader-compatible labels, 200% zoom, and text enlargement.

## 6. Repeatable test procedure

### 6.1 Clean build

```powershell
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm.cmd ci
npm.cmd run lint
npm.cmd run build
```

Record Node/npm versions, Git SHA, environment-variable names (never values), and build duration.

### 6.2 Local/static bundle inspection

Start the production server:

```powershell
npm.cmd run start
```

In Chrome/Edge DevTools:

1. Open Network and disable cache.
2. Set the requested throttling profile.
3. Record a fresh hard navigation for each route.
4. Capture a performance profile and waterfall.
5. Identify the largest transferred/decoded JavaScript, render-blocking resources, image waste, and main-thread tasks.
6. Repeat three times and retain the median; investigate meaningful variance.

For repeatable lab collection, use Lighthouse with a fixed profile. Install `lighthouse` as a development-only tool in a controlled test environment or use a CI image; do not add a global unversioned dependency to production.

Example:

```powershell
npx --yes lighthouse@<PINNED_VERSION> `
  https://staging.example.com/ `
  --output=html `
  --output=json `
  --output-path=.artifacts/lighthouse-home `
  --chrome-flags="--headless --no-sandbox" `
  --form-factor=mobile `
  --screenEmulation.mobile=true `
  --screenEmulation.width=390 `
  --screenEmulation.height=844 `
  --screenEmulation.deviceScaleFactor=2 `
  --throttling-method=simulate
```

Pin a version and store the command/config in CI or a documented operator workstation. Do not use floating `latest` tooling for release evidence.

### 6.3 API timing baseline

Use `curl.exe` on Windows. Measure warm requests and record the response status/body size:

```powershell
curl.exe -sS -o NUL -w "home status=%{http_code} dns=%{time_namelookup}s connect=%{time_connect}s ttfb=%{time_starttransfer}s total=%{time_total}s bytes=%{size_download}`n" https://staging.example.com/
curl.exe -sS -o NUL -w "shop status=%{http_code} ttfb=%{time_starttransfer}s total=%{time_total}s bytes=%{size_download}`n" https://staging.example.com/shop
```

For authenticated routes, use a staging test cookie/token from a dedicated test account. Do not commit it to shell history, repository files, or CI logs.

### 6.4 Browser automation timings

Use Lighthouse/WebPageTest for Core Web Vitals and Playwright only for workflow timing where it provides useful repeatability. A minimal future Playwright suite should record:

- Sign-in to dashboard-ready.
- Open each patient tab.
- Open representative admin tabs.
- Add product to cart and reach checkout.
- Submit contact and authentication forms.
- Open a product/blog detail page.

Example assertions should use generous CI timings for correctness and separate performance annotations for medians/p95. Do not make a shared staging environment's wall-clock time a user-facing SLA by accident.

## 7. Load tests

### 7.1 Safety limits

- Test staging only unless the provider and clinic approve a production canary.
- Obtain written approval for target request rate, duration, data, and stop conditions.
- Never load-test authentication against real accounts without synthetic identities and an approved plan.
- Never submit real patient clinical data or send real emails/WhatsApp messages from a load test.
- Disable or redirect SMTP, fan-out, analytics, and external notifications in the load environment.
- Stop on error-rate increase, database saturation, unexpected data mutation, provider throttling, or cost threshold.

### 7.2 k6 scenario outline

Commit a versioned scenario under `performance/` when the load tool is adopted. A representative outline is:

```javascript
import http from "k6/http";
import { check, sleep } from "k6";
import { Rate } from "k6/metrics";

const failures = new Rate("s19_failures");

export const options = {
  scenarios: {
    public_browse: {
      executor: "ramping-arrival-rate",
      startRate: 1,
      timeUnit: "s",
      preAllocatedVUs: 10,
      maxVUs: 50,
      stages: [
        { target: 5, duration: "2m" },
        { target: 20, duration: "5m" },
        { target: 0, duration: "1m" },
      ],
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.005"],
    "http_req_duration{type:public}": ["p(95)<800"],
    checks: ["rate>0.995"],
  },
};

const baseUrl = __ENV.BASE_URL || "https://staging.example.com";

export default function () {
  const response = http.get(`${baseUrl}/`, { tags: { type: "public" } });
  const ok = check(response, {
    "home is 200": (r) => r.status === 200,
    "home is not an error page": (r) => String(r.body).includes("S19"),
  });
  failures.add(!ok);
  sleep(Math.random() * 2 + 1);
}
```

Before executing, add realistic route weights, production-like data, optional authenticated account scenarios, and explicit thresholds after the first baseline. Do not publish stress settings as a claim that the system has been tested until the actual run evidence is attached.

### 7.3 Staging scenarios

| Scenario | Suggested initial profile | What it finds |
| --- | --- | --- |
| Public browse | 5 → 20 → 0 requests/second, 8 minutes | CDN/Next/Mongo baseline, cache, media, server function. |
| Catalog/content | Mixed home/shop/blog/detail/search | Content-query and payload behavior. |
| Auth | Low synthetic RPS with strict lockout/rate policy | Login/session/Mongo and enumeration/brute-force controls. |
| Patient dashboard | 10–50 synthetic accounts, normal click delays | Parallel dashboard API burst, payload, database saturation. |
| Booking | Same slot contention and duplicate submits | Atomicity, race conditions, notification load. |
| Order intake | Small controlled batches | Validation, database uniqueness, email queue impact. |
| Upload | Approved image sizes only | Cloudinary, memory, function duration, orphan handling. |
| Admin list | 1,000 synthetic users/records | 100–500 item queries, response size, lack of pagination. |
| Backup (email) | Manual `POST /api/admin/backups` with ≤ 25 MB synthetic DB | Export duration, gzip size, memory/function limits, SMTP send, `BackupRun` accounting, 400 path when SMTP unconfigured. |
| Backup (cron) | `GET /api/cron/backups` with `CRON_SECRET` | Endpoint auth (401 without bearer), idempotency (second same-day call returns `duplicate`), per-step failure isolation. |
| Backup (archive) | `npm run backup -- archive` on staging with `BACKUP_S3_*` | Tar/age/S3 duration, object size, manifest hashes, lease/claim behavior, retry after simulated crash. |

### 7.4 Stress and soak

- **Stress:** increase load gradually until a defined bottleneck or safety limit is reached. Identify whether it is Next.js, MongoDB, Cloudinary, SMTP, external video, network, or test tooling—not simply “the server.”
- **Soak:** run expected peak for at least 2–4 hours after fixing stress failures. Check for connection leaks, session growth, memory growth, queue buildup, and expired-token cleanup.
- **Recovery:** return to normal load and verify booking/order integrity, session behavior, MongoDB connection recovery, and queued work.

## 8. Workflow-specific checks

### Home page

- Verify whether remote video probing is on the critical rendering path.
- Set explicit image dimensions and use responsive `next/image` where practical.
- Confirm the hero LCP resource is discovered early and not delayed by fonts/scripts.
- Defer below-the-fold carousels, video, and heavy motion until interaction/viewport.

### Shop/catalog

- Measure payload as product count grows.
- Confirm product image variants have correct width/height and Cloudinary transformations.
- Assess whether all product/category data should be sent to the client or filtered server-side after an intentional design decision.
- Confirm search/filter operations stay responsive on 1,000 synthetic products.

### Patient dashboard

- Prevent loading every tab's data before the tab is opened unless a product requirement needs summary data.
- Batch/cancel obsolete requests when users switch tabs quickly.
- Add pagination/virtualization to long messages, reminders, follow-ups, glucose history, and admin lists.
- Use server-side row limits that guarantee bounded payloads; never rely only on a large `.limit()`.

### Authentication and forms

- Rate-limit and test repeated failure latency.
- Avoid long server work before returning security-sensitive responses.
- Test input maximum sizes to reject oversized JSON early.

### Uploads

- Test exact approved MIME types, corrupted files, oversized files, filename edge cases, and interrupted transfers.
- Verify temporary credentials, private delivery, and deletion behavior.

### MongoDB

Review with `explain("executionStats")` on staging/synthetic data. Confirm query patterns have supporting indexes and do not scan large collections. At minimum assess indexes for:

- Sessions/resets: token hash, expiry.
- Users: normalized unique email.
- Appointments: doctor/date/status and user/date.
- Orders: user/created date and unique reference.
- Messages: user/thread/created date.
- Clinical/treatment collections: user/plan/created date.
- Testimonials/subscribers: user/status/created date and email.

Do not add indexes blindly. Compare index size, write cost, query plans, and production cardinality.

## 9. Monitoring and real-user measurement

After load/performance testing, add privacy-reviewed production telemetry:

- Web Vitals by route template, device class, and coarse region—not by patient identity or health journey.
- Edge/server status, latency, and error rate by normalized route.
- MongoDB connection count, slow operations, CPU, storage, and replication/backup state.
- Cloudinary request/upload failures.
- SMTP delivery/failure metrics.
- Client JS errors with sensitive values redacted.
- Uptime checks for public, authentication, patient, and clinical critical paths.

Do not send query strings, form bodies, medical values, names, email addresses, ID-document URLs, full Cloudinary signed URLs, or session tokens to analytics/error tools. Obtain consent where required and define retention.

## 10. Release gates

A release should not be called performance-accepted unless:

1. Clean lint and production build pass.
2. Public mobile lab results meet or have an approved exception for LCP, INP, CLS, and transfer budgets.
3. Staging load tests meet p95/error thresholds at the target synthetic scale.
4. No unresolved booking/order duplicate, session, upload, or clinical-submission integrity issue was found.
5. Database query plans and indexes are reviewed.
6. No real patient data entered the test environment.
7. Results, environment, Git SHA, tool versions, and known limitations are stored as release evidence.
8. Production monitoring and rollback criteria are ready.
9. Any legal/privacy assessment of analytics/performance tooling is complete.

## 11. Evidence template

```text
Date:
Tester:
Commit SHA:
Environment/region:
Hosting/database/Cloudinary tiers:
Tool and exact version:
Dataset size/synthetic status:
Routes/scenarios:
Runs and discarded-run reason:
p50/p75/p95/p99:
LCP/INP/CLS/TTFB:
5xx/timeouts:
Database/Cloudinary bottleneck:
Integrity errors:
Accessibility regressions:
Privacy/security observations:
Pass/fail:
Approved exceptions and expiry:
Artifact links (redacted):
```
