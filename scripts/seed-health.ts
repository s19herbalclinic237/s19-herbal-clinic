/**
 * Seeds demo health-clinic data: doctors with weekly schedules, a demo
 * patient account (with family member + profile details), and sample
 * appointments, medical records and prescriptions for that account.
 *
 * Run:  npx tsx scripts/seed-health.ts        (MONGO_URL from .env.local)
 */
import dotenv from "dotenv";
import path from "path";
import mongoose from "mongoose";
import { User } from "../lib/models/User";
import { Doctor } from "../lib/models/Doctor";
import { Appointment } from "../lib/models/Appointment";
import { MedicalRecord } from "../lib/models/MedicalRecord";
import { Prescription } from "../lib/models/Prescription";
import { hashPassword } from "../lib/auth";
import { Message } from "../lib/models/Message";
import { todayDateOnly, weekdayOf } from "../lib/appointments";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const DEMO_EMAIL = "demo.patient@s19clinic.com";
const DEMO_PASSWORD = "S19Demo2026!";

function addDays(dateOnly: string, days: number): string {
  const [y, m, d] = dateOnly.split("-").map(Number);
  const dt = new Date(y, m - 1, d + days, 12, 0, 0, 0);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(
    dt.getDate()
  ).padStart(2, "0")}`;
}

function weekdayLabel(day: number): string {
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][day];
}

const DOCTORS = [
  {
    name: "Dr. Nadège Mouna",
    specialty: "Diabetes & Metabolic Health",
    specialtyFr: "Diabète et santé métabolique",
    bio: "15 years of clinical experience guiding patients through blood-sugar control with diet, herbal protocols and lifestyle coaching.",
    bioFr:
      "15 ans d'expérience clinique à accompagner les patients vers l'équilibre de la glycémie par l'alimentation, les protocoles à base de plantes et le coaching de vie.",
    phone: "+237 6 70 00 00 01",
    sortOrder: 1,
    schedule: [
      { day: 1, start: "09:00", end: "13:00", slotMinutes: 30 },
      { day: 2, start: "14:00", end: "18:00", slotMinutes: 30 },
      { day: 4, start: "09:00", end: "12:00", slotMinutes: 30 },
      { day: 5, start: "10:00", end: "15:00", slotMinutes: 30 },
    ],
  },
  {
    name: "Dr. Jean-Paul Essomba",
    specialty: "Cardiovascular Health",
    specialtyFr: "Santé cardiovasculaire",
    bio: "Specialist in hypertension and heart-health monitoring through natural protocols and regular follow-up.",
    bioFr:
      "Spécialiste de l'hypertension et du suivi de la santé cardiaque grâce à des protocoles naturels et un suivi régulier.",
    phone: "+237 6 70 00 00 02",
    sortOrder: 2,
    schedule: [
      { day: 1, start: "14:00", end: "18:00", slotMinutes: 30 },
      { day: 3, start: "09:00", end: "13:00", slotMinutes: 30 },
      { day: 5, start: "09:00", end: "12:00", slotMinutes: 30 },
      { day: 6, start: "09:00", end: "12:00", slotMinutes: 30 },
    ],
  },
  {
    name: "Dr. Angèle Kamga",
    specialty: "Women's & Family Health",
    specialtyFr: "Santé des femmes et de la famille",
    bio: "Care for women's health, hormones and family wellbeing - including consultations for children and parents.",
    bioFr:
      "Soins de santé féminine, équilibre hormonal et bien-être familial - y compris les consultations pour enfants et parents.",
    phone: "+237 6 70 00 00 03",
    sortOrder: 3,
    schedule: [
      { day: 2, start: "09:00", end: "13:00", slotMinutes: 30 },
      { day: 3, start: "14:00", end: "18:00", slotMinutes: 30 },
      { day: 4, start: "14:00", end: "17:00", slotMinutes: 30 },
    ],
  },
  {
    name: "Dr. Paul Mbarga",
    specialty: "Men's & Digestive Health",
    specialtyFr: "Santé masculine et digestive",
    bio: "Focus on prostate health, digestion, gastritis and detox protocols.",
    bioFr:
      "Axé sur la prostate, la digestion, la gastrite et les protocoles de détoxication.",
    phone: "+237 6 70 00 00 04",
    sortOrder: 4,
    schedule: [
      { day: 1, start: "13:00", end: "17:00", slotMinutes: 30 },
      { day: 3, start: "13:00", end: "17:00", slotMinutes: 30 },
      { day: 5, start: "14:00", end: "18:00", slotMinutes: 30 },
    ],
  },
] as const;

async function main() {
  const uri = process.env.MONGO_URL || process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGO_URL is not set. Set it in .env.local before running this script.");
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log("Connected to MongoDB.\n");

  /* 1 ── Doctors ─────────────────────────────────────────────────────── */
  const doctorIds = new Map<string, string>();
  for (let i = 0; i < DOCTORS.length; i++) {
    const d = DOCTORS[i];
    const doc = await Doctor.findOneAndUpdate(
      { name: d.name },
      {
        $set: {
          specialty: d.specialty,
          specialtyFr: d.specialtyFr,
          bio: d.bio,
          bioFr: d.bioFr,
          phone: d.phone,
          schedule: (d.schedule as unknown as { day: number; start: string; end: string; slotMinutes: number }[]).map((s) => ({
            ...s,
          })),
          active: true,
          sortOrder: i + 1,
        },
      },
      { upsert: true, new: true }
    );
    doctorIds.set(d.name, String(doc._id));
    const brief = doc.schedule
      .map((s) => `${weekdayLabel(s.day)} ${s.start}-${s.end}`)
      .join(", ");
    console.log(`Doctor: ${d.name}  [${brief}]`);
  }

  /* 2 ── Demo patient ────────────────────────────────────────────────── */
  let user = await User.findOne({ email: DEMO_EMAIL });
  if (!user) {
    user = await User.create({
      name: "Demo Patient",
      email: DEMO_EMAIL,
      passwordHash: hashPassword(DEMO_PASSWORD),
      role: "user",
      emailVerified: true,
      phone: "+237 6 99 00 00 01",
      isActive: true,
    });
    console.log(`\nCreated demo patient ${DEMO_EMAIL} (password "${DEMO_PASSWORD}").`);
  } else {
    console.log(`\nDemo patient already exists: ${DEMO_EMAIL}.`);
  }

  user = await User.findByIdAndUpdate(
    user._id,
    {
      $set: {
        dob: "1988-04-12",
        gender: "male",
        address: "Quartier Tamdja, Bafoussam, Cameroon",
        emergencyContact: {
          name: "Marie Kamdem",
          phone: "+237 6 99 00 00 02",
          relation: "spouse",
        },
      },
      $addToSet: {
        familyMembers: {
          name: "Clarisse Kamdem",
          dob: "2016-07-03",
          gender: "female",
          relation: "child",
          notes: "Asthma follow-up",
        },
      },
    },
    { new: true }
  );
  console.log("Profile + emergency contact + family member set.");

  const userId = String(user!._id);

  /* 3 ── Sample appointments ─────────────────────────────────────────── */
  await Appointment.deleteMany({ user: userId });
  let count = 0;
  for (const def of [
    {
      doctorName: "Dr. Nadège Mouna",
      mode: "clinic",
      status: "completed",
      daysAgo: 21,
      time: "10:00",
      concern: "Diabetes / Blood sugar",
    },
    {
      doctorName: "Dr. Nadège Mouna",
      mode: "video",
      status: "confirmed",
      daysAgo: 5,
      time: "11:00",
      concern: "Diabetes / Blood sugar",
      meetingUrl: "https://meet.google.com/demo-s19",
    },
    {
      doctorName: "Dr. Angèle Kamga",
      mode: "clinic",
      status: "confirmed",
      daysAgo: 1,
      time: "09:30",
      concern: "Women's health / Hormones",
      forMember: "Clarisse Kamdem",
    },
  ] as const) {
    const doctorId = doctorIds.get(def.doctorName);
    if (!doctorId) continue;
    const today = todayDateOnly();
    const past = addDays(today, -def.daysAgo);
    // demo doctors don't necessarily work that exact weekday; that's fine for history.
    void weekdayOf(past);
    await Appointment.create({
      user: userId,
      doctor: doctorId,
      forMember: def.forMember,
      date: past,
      time: def.time,
      mode: def.mode,
      concern: def.concern,
      status: def.status,
      meetingUrl: def.meetingUrl,
    });
    count++;
  }
  console.log(`${count} sample appointment(s) seeded for ${DEMO_EMAIL}.`);

  /* 4 ── Medical records ─────────────────────────────────────────────── */
  await MedicalRecord.deleteMany({ user: userId });
  const visitDate = addDays(todayDateOnly(), -21);
  const labDate = addDays(todayDateOnly(), -14);
  await MedicalRecord.create([
    {
      user: userId,
      type: "visit",
      title: "First consultation - type 2 diabetes plan",
      date: new Date(`${visitDate}T12:00:00`),
      doctorName: "Dr. Nadège Mouna",
      diagnosis:
        "Type 2 diabetes with elevated fasting glucose (1.42 g/L). Stage 1 hypertension noted.",
      notes:
        "Started the S19 Diabecare protocol. Dietary guidance given: low-sugar meals, green vegetables twice daily, 30 minutes of walking daily. Follow-up at 3 weeks.",
      results: "Fasting glucose 1.42 g/L; HbA1c 7.1%; BP 142/90.",
      attachments: [],
    },
    {
      user: userId,
      type: "lab",
      title: "Lab results - glucose and lipid panel",
      date: new Date(`${labDate}T12:00:00`),
      doctorName: "Lab S19",
      diagnosis: "Improvement after 1 week of the herbal + diet protocol.",
      results:
        "Fasting glucose 1.18 g/L; HbA1c 6.4%; Total cholesterol 1.98 g/L; triglycerides 1.31 g/L.",
      notes: "Continue current protocol. Repeat panel in 6 weeks.",
      attachments: [],
    },
    {
      user: userId,
      type: "scan",
      title: "Abdominal ultrasound - liver & kidneys",
      date: new Date(`${addDays(todayDateOnly(), -7)}T12:00:00`),
      doctorName: "Dr. Paul Mbarga",
      diagnosis: "Mild hepatic steatosis. No other abnormality.",
      notes: "Metabolic detox program prescribed for 4 weeks.",
      results: "Mild fatty liver. Kidneys normal. No masses detected.",
      attachments: [],
    },
  ]);
  console.log("Sample medical records seeded.");

  /* 5 ── Prescriptions ───────────────────────────────────────────────── */
  await Prescription.deleteMany({ user: userId });
  const issued = addDays(todayDateOnly(), -14);
  const issuedOld = addDays(todayDateOnly(), -120);
  await Prescription.create([
    {
      user: userId,
      doctorName: "Dr. Nadège Mouna",
      issuedDate: new Date(`${issued}T12:00:00`),
      expiresAt: new Date(`${addDays(todayDateOnly(), 14)}T12:00:00`),
      status: "active",
      medications: [
        {
          name: "S19 Diabecare",
          dosage: "10 ml",
          frequency: "2x daily after meals",
          duration: "4 weeks",
          instructions: "Shake well. Take with warm water 30 minutes after breakfast and dinner.",
        },
        {
          name: "S19 Bitters",
          dosage: "1 tablespoon",
          frequency: "1x daily in the morning",
          duration: "4 weeks",
          instructions: "Dilute in a glass of warm water. Avoid in case of pregnancy.",
        },
      ],
      notes: "Monitor glucose weekly. Report any dizziness or hypoglycaemia.",
    },
    {
      user: userId,
      doctorName: "Dr. Paul Mbarga",
      issuedDate: new Date(`${issuedOld}T12:00:00`),
      expiresAt: new Date(`${addDays(todayDateOnly(), -90)}T12:00:00`),
      status: "expired",
      medications: [
        {
          name: "S19 Digestive Tea",
          dosage: "1 sachet",
          frequency: "1x daily after lunch",
          duration: "3 months",
          instructions: "Infuse 5 minutes. Completed course - follow-up in clinic.",
        },
      ],
      notes: "Course completed. Patient reports improved digestion.",
    },
  ]);
  console.log("Sample prescriptions seeded (1 active, 1 past).");

  /* 5 ── Sample message thread (admin + patient reply) ───────────────── */
  await Message.deleteMany({ user: userId });
  const root = await Message.create({
    user: userId,
    author: "admin",
    subject: "Your follow-up appointment is confirmed",
    body: "Hello, your video follow-up with Dr. Nadège Mouna is confirmed. Bring any recent blood-sugar readings you have. - S19 Clinic",
    read: false,
  });
  await Message.create({
    user: userId,
    author: "user",
    subject: root.subject,
    body: "Thank you, noted - I'll have my readings ready. - Clarisse's parent",
    thread: String(root._id),
    read: true,
  });
  await Message.create({
    user: userId,
    author: "admin",
    subject: "Your latest lab results are available",
    body: "Your most recent lab results have been added to your medical records. You can view and download them from your dashboard.",
    read: false,
  });
  console.log("Sample message thread seeded (1 admin thread + 1 reply + 1 unread).");

  await mongoose.disconnect();
  console.log("\nDone. Demo login:");
  console.log(`  email:    ${DEMO_EMAIL}`);
  console.log(`  password: ${DEMO_PASSWORD}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});