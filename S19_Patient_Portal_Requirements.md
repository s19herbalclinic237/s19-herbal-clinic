

<!-- Start of picture text -->
S19<br><!-- End of picture text -->

# **S19 HERBAL CLINIC Patient Portal** 

R E Q U I R E M E N TS & F E AT U R E S P E C I F I CAT I O N 

A reference document covering account access (sign up, login, password recovery), what the patient does inside the portal, and how the clinic accesses and manages patient data — for use when planning and building the S19 website patient portal. 

**1 What the Patient Portal Is For** 

The S19 Herbal Clinic Patient Portal is a secure, private online account that gives each patient 24/7 access to their own health information and clinic services, and gives S19 staff an organized, permission-controlled way to manage patient records, appointments, and communication. It replaces back-and-forth phone calls and paper forms with a self-service online space, while keeping every patient's data separate, private, and only visible to the patient themselves and authorized clinic staff. 

## **2 Account Access** 

### **2.1 Sign Up (Registration)** 

How a new patient creates an account: 

- Full name, date of birth, sex, and phone number 

- Email address (used as the account username) 

- Create a password (with confirm-password field and password strength check) 

- Accept Terms of Use and a Privacy / Data Consent notice before the account is created 

- Optional: link the account to an existing in-clinic patient file using a Patient ID or registration code given at the physical clinic, so returning patients don't create a duplicate record 

- Email (or SMS) verification link/code sent to confirm the account before first login 

- Short welcome / first-time walkthrough after verification, prompting the patient to complete their health profile 

### **2.2 Login** 

- Email/phone + password login form 

- "Remember this device" option so returning patients aren't asked to re-verify every visit 

- Optional two-factor login step (a one-time code sent by SMS, WhatsApp, or email) for extra protection of health data 

- Account lock after repeated failed attempts, with a clear message and a way to recover the account 

- Automatic logout after a period of inactivity, especially important on shared/public computers 

### **2.3 Password & Account Recovery** 

- "Forgot password" link on the login page 

- Patient enters their email or phone number, receives a secure reset link or one-time code 

- Reset link expires after a short time (e.g. 30–60 minutes) for security 

- Patient sets a new password and is signed out of all other devices as a precaution 

- If the patient no longer has access to their email/phone, a manual identity-verification path through S19 staff (e.g. confirming name, date of birth, and a recent visit) to regain access 

- Option to update recovery email/phone number once logged in, under Account Settings 

### **2.4 Family / Caregiver Access (optional but recommended)** 

A parent managing a child's record, or a family member helping an elderly patient, should get their own linked login rather than sharing a password. Each linked ("proxy") account should have its own credentials, a clearly defined scope of what it can see or do, and its own entry in the activity log, so it's always clear who viewed or changed what. 

## **3 Inside the Portal — What the Patient Can Do** 

Once logged in, the patient lands on a personal Dashboard (similar in spirit to the reference screenshot provided), showing a snapshot of their health summary, action items, and upcoming appointments. From there they can access the following areas: 

### **3.1 Dashboard / Health Summary** 

- Basic profile snapshot: name, age, gender, weight, known allergies/conditions, photo (optional) 

- "Action Center" style list of things needing attention — e.g. unpaid bill, unread message, form to complete, upcoming refill due 

- Quick shortcuts to book an appointment, message the clinic, or view recent activity 

### **3.2 My Health Record** 

- Visit history — date, reason for visit, herbalist/consultant seen, notes shared by the clinic • Herbal remedies & treatment plans prescribed, with dosage and usage instructions (matching the product usage notes, e.g. "2 teaspoons in hot water, morning & evening") 

- • Known allergies, ongoing conditions, and any precautions on file • Uploaded lab results or referral documents, where applicable • Simple self-tracking log for conditions S19 commonly supports — e.g. blood sugar, blood pressure, or symptom notes the patient can log between visits and share with their herbalist 

### **3.3 Appointments** 

- Request/book a new appointment, choosing a service type, preferred date, and consultant 

- View Upcoming, Past, and Other (e.g. cancelled) appointments in separate tabs • Reschedule or cancel an upcoming appointment within an allowed time window • Reminders (email/SMS/WhatsApp) ahead of the appointment • Optional pre-visit questionnaire the patient fills in before arriving, so the herbalist has context in advance 

### **3.4 Secure Messaging** 

- A private inbox to message the clinic directly (question about a remedy, dosage clarification, follow-up concern) • Message history kept per patient, viewable any time • Read receipts / unread counters, similar to the "Inbox (10)" indicator in the reference design 

### **3.5 Orders, Products & Billing** 

- Order history of S19 herbal products purchased (linking to the S19 Products catalog) 

- Reorder / repeat-purchase button for products the patient uses regularly • Invoices and receipts, downloadable as PDF • Outstanding balance shown clearly, with a way to pay online or record that payment will be made on pickup/delivery • Delivery address book and delivery status tracking, tied to the clinic's delivery service (within Cameroon and worldwide) 

### **3.6 Forms & Consent** 

- Digital intake form for new patients (medical history, current medications, reason for consultation) • Consent forms for treatment, telehealth (if offered), and data sharing, signed electronically • Any outstanding/unsubmitted forms flagged clearly on the dashboard until completed 

### **3.7 Education & Resources** 

- A simple resource library — articles or short guides on the conditions S19 supports (digestion, liver health, men's/women's wellness, etc.) • How-to-use guides for each herbal product, mirroring the directions already on product labels • FAQ / Help section 

### **3.8 Account Settings** 

- Update contact details, address, and communication preferences (email, SMS, WhatsApp) 

- Change password, manage two-factor authentication 

- Manage linked family/proxy accounts 

- Download or request a full copy of personal health data on file 

• Close/deactivate account, with a clear explanation of what happens to their records 

## **4 Clinic Side — How S19 Staff Access Patient Data** 

Patient data should never be openly visible to every staff member. Access is organized through a separate staff/admin login, with permissions based on each person's role at the clinic. 

### **4.1 Staff Login & Roles** 

- Separate secure login for clinic staff (distinct from the patient-facing login) 

- Role-based access control, for example: Front Desk (appointments, billing, basic contact info), Herbalist/Consultant (full clinical notes and treatment history for their own patients), Clinic Admin (full access, reporting, and staff management) 

- Two-factor authentication required for all staff accounts, since they can view multiple patients' data 

### **4.2 Patient Record Management** 

- Search and open any patient's file by name, phone number, or Patient ID 

- Add visit notes, prescribed remedies, dosages, and follow-up instructions after a consultation 

- Upload lab results or documents to a patient's file 

- Update allergies, conditions, and precautions on record 

- Mark forms as reviewed, and respond to unsubmitted-form reminders 

### **4.3 Appointments, Messaging & Orders (Clinic View)** 

- Calendar view of all bookings, with ability to confirm, reschedule, or cancel on behalf of a patient 

- Shared inbox for incoming patient messages, assignable to the right staff member 

- View and update order status (processing, ready for pickup, out for delivery, delivered) for each patient's purchases 

- Record payments and issue invoices/receipts 

### **4.4 Audit Trail & Data Protection** 

- Every time a staff member views or edits a patient's record, it is logged with their name, timestamp, and what changed 

- Patients can only ever see their own data; staff can only see what their role permits 

- All patient data encrypted in storage and in transit between the browser and the server 

- Automatic session timeout for staff accounts left idle 

- Regular, secure backups of all patient records 

### **4.5 Reporting** 

- Simple reports for clinic management — appointments per week, most-requested products/remedies, outstanding invoices 

- Export options (e.g. CSV/PDF) for record-keeping 

## **5 Additional Features Worth Considering** 

Based on current patient-portal practice generally, these are features many clinics add over time, beyond the essentials above — useful to keep in mind while planning, even if not built in the first version: 

- **Waitlist for appointments** — automatically offer a freed-up slot to the next patient on a waitlist when someone cancels 

- • **Telehealth / video consultation** — for follow-up consultations that don't need an in-person visit • **Refill requests** — a one-tap request to refill a herbal remedy the patient is already on, sent straight to the clinic 

- **Symptom / progress tracker** — simple check-ins between visits (e.g. "how are your symptoms this week?") that build a visual history for the herbalist 

- • **Multi-language support** — English and French toggle, matching how S19 already presents its products 

- **Push/SMS/WhatsApp notifications** — for appointment reminders, order status, and messages — matching the clinic's existing WhatsApp-first communication style 

- **Loyalty / repeat-patient recognition** — simple recognition for long-term or repeat patients, tied into the product ordering side 

## **6 Security & Privacy Requirements** 

- All data transmitted over HTTPS (encrypted connection) — no exceptions 

- Passwords never stored in plain text; stored using strong, salted hashing 

- Multi-factor authentication available to patients and required for staff 

- Clear, short Privacy Policy explaining what data is collected, how it's used, and who can see it 

- Patients can request a copy of their data or ask for their account to be closed 

- Defined data retention rules (how long records are kept after a patient becomes inactive) 

- A named person at S19 responsible for data protection decisions and handling any data requests 

**Note:** This document is a functional and planning reference for design and development purposes. It is not a legal or compliance certification — if S19 will store sensitive health data at scale, it is worth a short consultation with a local advisor on Cameroon's data protection requirements before launch. 

