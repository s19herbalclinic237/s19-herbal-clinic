# Legal compliance gap register

**Baseline:** 25 September 2026
**Purpose:** Cameroon-first legal gap register for the S19 Herbal Clinic web platform. It maps applicable law to the evidence currently in the repository and deployed pages, separates what is genuinely remediated from what still needs clinic decisions or qualified Cameroon counsel, and records the questions counsel must answer. **This register is not legal advice and does not replace counsel review.**

The clinic owner/developer operates the platform from Cameroon. The applicable framework is Cameroon-first: Law No. 2024/017 of 23 December 2024 on the protection of personal data (in force from January 2026 and the primary data-protection regime), Law No. 2010/012 of 21 December 2010 on cyber security and cyber criminality, the Constitution of Cameroon (right to privacy, Preamble), and consumer-law obligations. Where the EU GDPR applies (processing of EU data subjects' data), the policies reference GDPR rights and transfers, but the controlling framework is Cameroonian.

## 1. Status legend

| Status | Meaning |
| --- | --- |
| **Implemented** | Working code/content in this repository fulfils the control as described. |
| **Partial** | Substantial implementation exists; a defined piece remains (listed in "Remaining work"). |
| **Open** | Requires a clinic decision, infrastructure, or counsel input before it can be completed. |

## 2. Public policy pages — status vs. reality

| Page | Requirement (summary) | Status | Evidence / remaining work |
| --- | --- | --- | --- |
| Privacy policy (`/privacy`) | Controller identity + contact; lawful bases; health-data confidentiality; cookies accuracy; transfers with safeguards; marketing consent; data-subject rights; retention schedule; breach notification; Cameroon law references; complaints route | **Implemented** (content) | Controller details verified against `lib/site.ts`; rights workflow (below) not yet automatable; retention schedule requires counsel sign-off. |
| Terms of use (`/terms`) | General acceptance; health disclaimer; **no-guaranteed-results**; telemedicine scope; medical records; orders/shipping/returns; governing law = Cameroon (Law 2024/017 + Law 2010/012); competent courts of Cameroon; changes | **Implemented** (content) | Counsel must confirm forum/arbitration clause and product claims language. |
| Cookie policy (`/cookies`) | Accurately lists first-party cookies/local storage; states no analytics/advertising/tracking; lawful-basis framing (ePrivacy + Law 2024/017); third-party disclosure; management | **Implemented** (content) | Matches real inventory: `s19_session`, `s19_locale`, `s19-cart` localStorage. No analytics scripts exist on the site. |
| Refund & returns (`/refund-and-returns`) | Consumer-rights-compliant refund/exchange terms | **Review required** | Existing page content predates this register; needs counsel review of Cameroon consumer law. |

The previous privacy/cookie pages claimed "anonymous, aggregated page-usage information" and "measurement & analytics" that **do not exist** — a false disclosure that itself created risk. This was corrected: policies now state that no analytics/advertising/tracking cookies are placed.

## 3. Real cookie/local-storage inventory (verified against code)

| Storage | Type | Purpose | First-party | Essential? |
| --- | --- | --- | --- | --- |
| `s19_session` | HTTP-only cookie | Authentication session (30-day, SameSite=Lax, Secure in production) | Yes | Yes |
| `s19_locale` | Cookie | English/French language preference (`COOKIE_NAME` in `lib/i18n.ts`) | Yes | Functional (user-requested language) |
| `s19-cart` | localStorage | Guest shopping cart | Yes | Functional (e-commerce) |

No analytics, advertising, or third-party tracking cookies were found in the repository. Third-party disclosures are limited to: SMTP provider (transactional email), MongoDB hosting, Cloudinary (media), MyMemory (admin-supplied translation of non-clinical copy), and video providers (public testimonial embeds). A consent mechanism for any future non-essential cookies must be added **before** any such cookie is introduced (ePrivacy + Law 2024/017 consent).

## 4. Requirements register

| # | Requirement | Cameroon source | Status | Evidence | Remaining work |
| --- | --- | --- | --- | --- | --- |
| L-01 | Lawful basis recorded for each processing purpose | Law 2024/017 arts. (lawfulness); GDPR Art. 6 where applicable | **Implemented** (policy) | Privacy §"Legal Basis for Processing" | Business facts to be confirmed with counsel (vital interest vs. contract vs. consent for health data). |
| L-02 | Informed consent before processing/health-data publication | Law 2024/017; GDPR Art. 9 for EU users | **Partial** | Testimonial submission + moderation flow exists | No consent text/version/timestamp/source/withdrawal record is stored with the testimonial; newsletter subscription has no double opt-in or consent record. |
| L-03 | Controller identity and contact published | Law 2024/017 (controller duties) | **Implemented** (policy) | Privacy §"Data Controller & Contact"; `lib/site.ts` | Confirm legal entity status (clinic registered? individual developer?) with counsel — the controller must be a real, identified entity. |
| L-04 | Data-subject rights (access, rectification, erasure, restriction, objection, portability, withdrawal) | Law 2024/017; GDPR Arts. 15–21 | **Partial** | Rights listed in policy with response-window commitment | No self-service export/deletion/correction endpoints exist; requests are handled manually by email. Build the rights-request workflow (see SEC-011). |
| L-05 | Retention schedule tied to record classes | Law 2024/017 (storage limitation); medical-records practice | **Partial** (policy) | Privacy §"Data Retention" | No automated retention/expiry job; backups retain per `BACKUP_RETENTION_DAYS` (35) — counsel must approve the schedule. |
| L-06 | Breach notification procedure | Law 2024/017 (notification duties); GDPR Art. 33/34 | **Implemented** (policy) | Privacy §"Data Breach Notification"; backup alert emails exist | No documented incident-response runbook or authority contact details — draft with counsel. |
| L-07 | International transfers with appropriate safeguards | Law 2024/017 (transfers); GDPR Ch. V | **Implemented** (policy) | Privacy §"Hosting & Data Transfers" names MongoDB/Cloudinary/Vercel + SCCs/adequacy framing | Confirm providers' regions and DPA status; sign processor agreements. |
| L-08 | Health data confidentiality | Law 2024/017 (sensitive data); professional secrecy | **Partial** | Privacy §"Health Information"; clinicalGuard; own-account scoping | Doctor-to-patient care-scope is not enforced; clinical writes use free-text `doctorName`; no immutable audit log. This is the highest-technical-risk item. |
| L-09 | Security measures proportional to risk | Law 2010/012 (cyber security); Law 2024/017 (security) | **Partial** | 17 public/auth routes rate-limited; security headers (X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy, HSTS in prod); scrypt passwords; hashed sessions | No CSP, no MFA for admin/doctor, no audit log, no automated abuse controls beyond rate limits, no monitoring/alerting beyond backup email. |
| L-10 | Accurate claims / no false advertising | Consumer law; health-claims rules | **Implemented** (content) | New Terms "No Guaranteed Results" section; health disclaimer | Existing marketing/product copy needs a claims review by counsel before any patient-visible claims about curing are relied upon. |
| L-11 | Governing law and jurisdiction clear to users | Cameroon civil procedure | **Implemented** (content) | Terms "Governing Law & Disputes" (Cameroon law; competent courts of Cameroon) | Confirm wording with counsel. |
| L-12 | ID-document processing minimized and protected | Law 2024/017 (special categories) | **Partial** | Policy discloses purpose; documents removable by user | Media not consistently private (Cloudinary `secure_url`) — see SEC-002; access not audited. |
| L-13 | Minors/family member consent | Law 2024/017 (children) | **Partial** (policy) | Privacy "Family Accounts & Children" | Policy asserts account-holder authority; no age gate or evidence of consent for family profiles. Counsel review required. |
| L-14 | Payment data handling | Consumer/payment rules | **Open** | Policy states mobile-money flows occur on provider platforms; no card data stored | No contract with MTN/Orange; PCI scope assertion to confirm with counsel. |
| L-15 | Copyright/licensing of third-party content (images, video, fonts, translations) | Law 2000/011 on copyright | **Open** | Unsplash/Cloudinary licensing assumed | Verify licenses for all media; check fonts and testimonials imagery. |

## 5. Why this matters operationally (risk framing)

- **Law 2010/012 (cyber criminality)** criminalizes certain computing offenses; a breach caused by gross negligence of mandatory security measures can expose the developer personally, not just the clinic. Current mitigations (rate limits, headers, hashed passwords, HTTPS cookies) reduce exposure but are not complete.
- **Law 2024/017** carries administrative/financial sanctions (up to 4% of turnover in the EU model referenced by the law and substantial fines in Cameroon), plus civil liability and, for repeated/aggravated violations, potential imprisonment under the law's penal provisions. False privacy disclosures (now corrected) and missing consent records are the kinds of failures that get investigated first.
- **Record-keeping is cross-cutting:** the pages now document rights and retention, but until the clinic can actually produce an export/erasure or show a consent record for a testimonial, the documentation is ahead of the machinery. Prioritize L-04, L-08, L-02.

## 6. Registered open questions for Cameroon counsel

1. What is the correct **controller identity** (registered business? natural person?) and the registration requirement/timeline for the new personal-data authority under Law 2024/017, including the transitional deadline?
2. Which **lawful basis** should the clinic rely on for health data processing (consent vs. contract vs. vital interest), and what exact consent wording/record satisfies the new law?
3. **Retention:** acceptable medical-record retention period in Cameroon, and whether backups may be retained longer than the source data under an operational necessity justification.
4. **Care relationships and clinician liability:** what records must be kept per patient encounter (attribution, consent forms, prescriptions) to defend a negligence or disciplinary claim, and does the current free-text `doctorName` need to be replaced by authenticated clinician identity before day one?
5. **Advertising/health-claims:** which product statements are permitted for herbal products in Cameroon, and does the site need any registration/marketing authorization for the products sold?
6. **Cross-border transfers:** are MongoDB Atlas/Cloudinary/Vercel processing locations consistent with Law 2024/017 transfer rules, and which contractual instruments (DPAs/SCCs) must be signed with each provider?
7. **Refund/consumer law:** are the current refund-and-returns terms consistent with mandatory Cameroon consumer protections?
8. **Minors:** what age/consent regime applies to child family profiles under Law 2024/017 and family law?
9. **Breach notification:** the authority's contact details and the notification deadline once the new authority is operational.
10. **Term of service/jurisdiction provisions** — is a courts-of-Cameroon clause enforceable as written, and is arbitration worth adding?

## 7. Immediate next actions (engineering, no counsel needed)

1. Build the **data-subject rights workflow** (export/erasure/correction requests with identity verification and an audit row) — the single biggest policy-vs-reality gap.
2. Record **consent evidence** for testimonials and newsletter subscriptions (consent text/version, timestamp, source, withdrawal) and add double opt-in to the newsletter.
3. Enforce the **doctor care-scope** and write the acting clinician ID onto every clinical record — resolves L-08's technical half.
4. Draft the **incident-response runbook** with the breach notification template ready to send.
5. Do the **media-licensing check** (L-15) and a **product-claims copy pass** (L-10) before any further marketing push.
6. Run the quarterly **restore drill** described in `BACKUP_AND_RECOVERY.md` §8 and store the evidence.

## 8. Change log

| Date | Change |
| --- | --- |
| 2026-09-25 | Corrected cookie/privacy policy false analytics claims; matched policies to real cookie/local-storage inventory; added lawful-basis, controller, breach-notification, no-results-guarantee, and Cameroon governing-law sections; created this register. |