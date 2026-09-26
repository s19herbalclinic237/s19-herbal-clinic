"use client";

import Link from "next/link";
import { useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import {
  useDashboardData,
  type PatientTabId,
} from "@/components/account/dashboard-data";
import { DashboardOverview, getGreeting } from "@/components/account/overview-tab";
import { UserAvatar } from "@/components/account/user-avatar";
import { OrdersTab } from "@/components/account/orders-tab";
import { MessagesTab } from "@/components/account/messages-tab";
import { TestimonialsTab } from "@/components/account/testimonials-tab";
import { SettingsTab } from "@/components/account/settings-tab";
import { AppointmentsTab } from "@/components/account/appointments-tab";
import { RecordsTab } from "@/components/account/records-tab";
import { PrescriptionsTab } from "@/components/account/prescriptions-tab";
import { TreatmentTab } from "@/components/account/treatment-tab";
import { FamilyTab } from "@/components/account/family-tab";
import { ProductsTab } from "@/components/admin/products-tab";
import { AdminOrdersTab } from "@/components/admin/orders-tab";
import { AdminTestimonialsTab } from "@/components/admin/testimonials-tab";
import { MessagingTab } from "@/components/admin/messaging-tab";
import { PostsTab } from "@/components/admin/posts-tab";
import { SubscribersTab } from "@/components/admin/subscribers-tab";
import { AdminVideosTab } from "@/components/admin/video-reviews-tab";
import { DoctorsTab } from "@/components/admin/doctors-tab";
import { AdminAppointmentsTab } from "@/components/admin/admin-appointments-tab";
import { AdminMedicalRecordsTab } from "@/components/admin/medical-records-tab";
import { AdminPrescriptionsTab } from "@/components/admin/prescriptions-tab";
import { TreatmentPlansTab } from "@/components/admin/treatment-plans-tab";
import { TreatmentAlertsTab } from "@/components/admin/treatment-alerts-tab";
import { RolesTab } from "@/components/admin/roles-tab";
import { BackupsTab } from "@/components/admin/backups-tab";
import { buttonLinkClasses } from "@/components/ui/button";
import { S19_ASSETS } from "@/lib/site-assets";
import {
  FaArrowRightFromBracket,
  FaBars,
  FaBoxOpen,
  FaCalendarCheck,
  FaCalendarDays,
  FaCheck,
  FaCommentDots,
  FaEnvelope,
  FaFileMedical,
  FaFilePrescription,
  FaFolderOpen,
  FaGear,
  FaHouse,
  FaNewspaper,
  FaPeopleGroup,
  FaPills,
  FaShieldHalved,
  FaTableCellsLarge,
  FaTags,
  FaTriangleExclamation,
  FaTruckFast,
  FaUserDoctor,
  FaUserGear,
  FaUserShield,
  FaUsers,
  FaVideo,
  FaXmark,
  FaBoxArchive,
} from "react-icons/fa6";

type TabId =
  | PatientTabId
  | "admin-products"
  | "admin-orders"
  | "admin-testimonials"
  | "admin-messaging"
  | "admin-posts"
  | "admin-subscribers"
  | "admin-videos"
  | "admin-doctors"
  | "admin-appointments"
  | "admin-records"
  | "admin-prescriptions"
  | "admin-treatment-plans"
  | "admin-treatment-alerts"
  | "admin-roles"
  | "admin-backups";

interface NavItem {
  id: TabId;
  label: string;
  icon: ReactNode;
}

const patientTabs: NavItem[] = [
  {
    id: "overview",
    label: "Dashboard",
    icon: <FaTableCellsLarge className="h-4 w-4" aria-hidden />,
  },
  {
    id: "appointments",
    label: "Appointments",
    icon: <FaCalendarCheck className="h-4 w-4" aria-hidden />,
  },
  {
    id: "orders",
    label: "Orders",
    icon: <FaBoxOpen className="h-4 w-4" aria-hidden />,
  },
  {
    id: "messages",
    label: "Messages",
    icon: <FaEnvelope className="h-4 w-4" aria-hidden />,
  },
  {
    id: "records",
    label: "Medical Records",
    icon: <FaFileMedical className="h-4 w-4" aria-hidden />,
  },
  {
    id: "prescriptions",
    label: "Prescriptions",
    icon: <FaPills className="h-4 w-4" aria-hidden />,
  },
  {
    id: "treatment",
    label: "Treatment Plan",
    icon: <FaCalendarDays className="h-4 w-4" aria-hidden />,
  },
  {
    id: "family",
    label: "Family",
    icon: <FaPeopleGroup className="h-4 w-4" aria-hidden />,
  },
  {
    id: "testimonials",
    label: "Your Stories",
    icon: <FaCommentDots className="h-4 w-4" aria-hidden />,
  },
  {
    id: "settings",
    label: "Settings",
    icon: <FaGear className="h-4 w-4" aria-hidden />,
  },
];

const adminTabs: NavItem[] = [
  {
    id: "admin-products",
    label: "Products",
    icon: <FaTags className="h-4 w-4" aria-hidden />,
  },
  {
    id: "admin-doctors",
    label: "Doctors",
    icon: <FaUserDoctor className="h-4 w-4" aria-hidden />,
  },
  {
    id: "admin-appointments",
    label: "Appointments",
    icon: <FaCalendarCheck className="h-4 w-4" aria-hidden />,
  },
  {
    id: "admin-records",
    label: "Medical Records",
    icon: <FaFolderOpen className="h-4 w-4" aria-hidden />,
  },
  {
    id: "admin-prescriptions",
    label: "Prescriptions",
    icon: <FaFilePrescription className="h-4 w-4" aria-hidden />,
  },
  {
    id: "admin-treatment-plans",
    label: "Treatment Plans",
    icon: <FaCalendarDays className="h-4 w-4" aria-hidden />,
  },
  {
    id: "admin-treatment-alerts",
    label: "Treatment Alerts",
    icon: <FaTriangleExclamation className="h-4 w-4" aria-hidden />,
  },
  {
    id: "admin-orders",
    label: "Orders",
    icon: <FaTruckFast className="h-4 w-4" aria-hidden />,
  },
  {
    id: "admin-testimonials",
    label: "Testimonials",
    icon: <FaCommentDots className="h-4 w-4" aria-hidden />,
  },
  {
    id: "admin-messaging",
    label: "Users & Messages",
    icon: <FaUserGear className="h-4 w-4" aria-hidden />,
  },
  {
    id: "admin-posts",
    label: "Blog",
    icon: <FaNewspaper className="h-4 w-4" aria-hidden />,
  },
  {
    id: "admin-subscribers",
    label: "Subscribers",
    icon: <FaUsers className="h-4 w-4" aria-hidden />,
  },
  {
    id: "admin-videos",
    label: "Live Reviews",
    icon: <FaVideo className="h-4 w-4" aria-hidden />,
  },
  {
    id: "admin-roles",
    label: "Staff & Roles",
    icon: <FaUserShield className="h-4 w-4" aria-hidden />,
  },
  {
    id: "admin-backups",
    label: "Data Backups",
    icon: <FaBoxArchive className="h-4 w-4" aria-hidden />,
  },
];

/**
 * Clinical-staff tabs available to the Doctor role. Doctors manage patients
 * (appointments, records, prescriptions, treatment plans/alerts, messages)
 * but never see store, content, subscriber, or user-administration tabs.
 */
const doctorTabs: NavItem[] = [
  {
    id: "admin-appointments",
    label: "Appointments",
    icon: <FaCalendarCheck className="h-4 w-4" aria-hidden />,
  },
  {
    id: "admin-records",
    label: "Medical Records",
    icon: <FaFolderOpen className="h-4 w-4" aria-hidden />,
  },
  {
    id: "admin-prescriptions",
    label: "Prescriptions",
    icon: <FaFilePrescription className="h-4 w-4" aria-hidden />,
  },
  {
    id: "admin-treatment-plans",
    label: "Treatment Plans",
    icon: <FaCalendarDays className="h-4 w-4" aria-hidden />,
  },
  {
    id: "admin-treatment-alerts",
    label: "Treatment Alerts",
    icon: <FaTriangleExclamation className="h-4 w-4" aria-hidden />,
  },
  {
    id: "admin-messaging",
    label: "Patients & Messages",
    icon: <FaUserGear className="h-4 w-4" aria-hidden />,
  },
];

function NavButton({
  item,
  active,
  badge,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  badge?: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "flex w-full cursor-pointer items-center gap-3 rounded-md bg-gold-400/15 px-3 py-1.5 text-left text-sm font-semibold text-gold-300"
          : "flex w-full cursor-pointer items-center gap-3 rounded-md px-3 py-1.5 text-left text-sm font-medium text-white/55 transition-colors hover:bg-white/5 hover:text-white"
      }
    >
      <span className="w-4 shrink-0">{item.icon}</span>
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
      {badge ? (
        <span className="shrink-0 rounded-full bg-gold-400 px-2 py-0.5 text-[10px] font-bold text-forest-950">
          {badge > 9 ? "9+" : badge}
        </span>
      ) : null}
    </button>
  );
}

function PageHeader({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3 px-4 sm:px-0">
      <div className="min-w-0">
        <h1 className="font-display text-xl font-bold text-ink sm:text-2xl">{title}</h1>
        <p className="mt-1 text-xs text-muted sm:text-[13px]">{subtitle}</p>
      </div>
      {children ? <div className="flex shrink-0 items-center gap-2">{children}</div> : null}
    </div>
  );
}

/** Small link used in the sidebar/drawer footers to return to the public site. */
function BackToSiteLink({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      href="/"
      className={
        compact
          ? "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/55 transition-colors hover:bg-white/5 hover:text-white"
          : "flex items-center justify-center gap-2 rounded-lg bg-white/5 px-3 py-2.5 text-sm font-semibold text-gold-300 ring-1 ring-gold-500/40 transition-colors hover:bg-white/10"
      }
    >
      <FaHouse className="h-4 w-4 shrink-0" aria-hidden />
      Back to main site
    </Link>
  );
}

function BrandLogo({ dark = true }: { dark?: boolean }) {
  return (
    <img
      src={S19_ASSETS.logos[dark ? "fullDark" : "fullLight"]}
      alt="S19 Herbal Clinic"
      className="h-9 w-auto"
    />
  );
}

export function DashboardScreen() {
  const { user, logout } = useAuth();
  const data = useDashboardData();
  const [tab, setTab] = useState<TabId>(() =>
    user?.role === "doctor" ? "admin-appointments" : "overview"
  );
  const [drawerOpen, setDrawerOpen] = useState(false);
  const scrollRef = useRef<HTMLElement | null>(null);
  const isAdmin = user?.role === "admin";
  const isDoctor = user?.role === "doctor";
  const isStaff = isAdmin || isDoctor;

  const settingsTab = patientTabs.filter((t) => t.id === "settings");
  const navSections: Array<{ label: string; items: NavItem[] }> = isDoctor
    ? [
        { label: "Clinical work", items: doctorTabs },
        { label: "My account", items: settingsTab },
      ]
    : isAdmin
      ? [
          { label: "My account", items: patientTabs },
          { label: "Clinic admin", items: adminTabs },
        ]
      : [{ label: "My account", items: patientTabs }];
  const bottomNavItems = isDoctor ? doctorTabs : patientTabs;

  // One-word labels for the compressed mobile bottom nav so items never
  // truncate on small screens.
  const shortNavLabel = (item: NavItem) =>
    item.id === "overview"
      ? "Home"
      : item.id === "appointments" || item.id === "admin-appointments"
        ? "Bookings"
        : item.id === "orders"
          ? "Orders"
          : item.id === "messages" || item.id === "admin-messaging"
            ? "Inbox"
            : item.id === "records" || item.id === "admin-records"
              ? "Records"
              : item.id === "prescriptions" || item.id === "admin-prescriptions"
                ? "Rx"
                : item.id === "treatment" || item.id === "admin-treatment-plans"
                  ? "Plan"
                  : item.id === "admin-treatment-alerts"
                    ? "Alerts"
                    : item.id === "family"
                      ? "Family"
                      : item.id === "testimonials"
                        ? "Stories"
                        : item.id === "settings"
                          ? "Settings"
                          : item.label;

  const firstName = user?.name?.trim().split(/\s+/)[0] || "there";
  const greeting = getGreeting();
  const dateLabel = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const openTab = (id: TabId) => {
    setTab(id);
    setDrawerOpen(false);
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  function renderTab() {
    switch (tab) {
      case "overview":
        return <DashboardOverview data={data} onNavigate={openTab} />;
      case "appointments":
        return (
          <>
            <PageHeader
              title="Appointments"
              subtitle="Book, reschedule or cancel consultations with the clinic"
            />
            <div className="px-4 sm:px-0">
              <AppointmentsTab />
            </div>
          </>
        );
      case "orders":
        return (
          <>
            <PageHeader title="My Orders" subtitle="Order history, totals and tracking links">
              <Link href="/shop" className={buttonLinkClasses("gold", "md")}>
                Browse catalog
              </Link>
            </PageHeader>
            <div className="px-4 sm:px-0">
              <OrdersTab />
            </div>
          </>
        );
      case "messages":
        return (
          <>
            <PageHeader title="Messages" subtitle="Updates and notes from the clinic" />
            <div className="px-4 sm:px-0">
              <MessagesTab />
            </div>
          </>
        );
      case "records":
        return (
          <>
            <PageHeader
              title="Medical Records"
              subtitle="Visits, diagnoses, lab results and scans - downloadable as PDF"
            />
            <div className="px-4 sm:px-0">
              <RecordsTab />
            </div>
          </>
        );
      case "prescriptions":
        return (
          <>
            <PageHeader
              title="Prescriptions"
              subtitle="Your current and past treatment plans with dosage instructions"
            />
            <div className="px-4 sm:px-0">
              <PrescriptionsTab />
            </div>
          </>
        );
      case "treatment":
        return (
          <>
            <PageHeader
              title="Treatment Plan"
              subtitle="Your personalized treatment timeline - when it started, when it ends and its live status"
            />
            <div className="px-4 sm:px-0">
              <TreatmentTab />
            </div>
          </>
        );
      case "family":
        return (
          <>
            <PageHeader
              title="Family"
              subtitle="Manage profiles for your children and loved ones"
            />
            <div className="px-4 sm:px-0">
              <FamilyTab />
            </div>
          </>
        );
      case "testimonials":
        return (
          <>
            <PageHeader
              title="Your Stories"
              subtitle="Testimonies you have shared with the S19 community"
            />
            <div className="px-4 sm:px-0">
              <TestimonialsTab />
            </div>
          </>
        );
      case "settings":
        return (
          <>
            <PageHeader title="Account Settings" subtitle="Profile details, photo, password and sign-out" />
            <div className="px-4 sm:px-0">
              <SettingsTab />
            </div>
          </>
        );
      case "admin-products":
        return isAdmin ? (
          <div className="px-4 sm:px-0">
            <ProductsTab />
          </div>
        ) : null;
      case "admin-orders":
        return isAdmin ? (
          <div className="px-4 sm:px-0">
            <AdminOrdersTab />
          </div>
        ) : null;
      case "admin-testimonials":
        return isAdmin ? (
          <div className="px-4 sm:px-0">
            <AdminTestimonialsTab />
          </div>
        ) : null;
      case "admin-messaging":
        return isStaff ? (
          <div className="px-4 sm:px-0">
            <MessagingTab />
          </div>
        ) : null;
      case "admin-posts":
        return isAdmin ? (
          <div className="px-4 sm:px-0">
            <PostsTab />
          </div>
        ) : null;
      case "admin-subscribers":
        return isAdmin ? (
          <div className="px-4 sm:px-0">
            <SubscribersTab />
          </div>
        ) : null;
      case "admin-videos":
        return isAdmin ? (
          <div className="px-4 sm:px-0">
            <AdminVideosTab />
          </div>
        ) : null;
      case "admin-doctors":
        return isAdmin ? (
          <>
            <PageHeader title="Doctors" subtitle="Manage practitioners and their weekly availability" />
            <div className="px-4 sm:px-0">
              <DoctorsTab />
            </div>
          </>
        ) : null;
      case "admin-appointments":
        return isStaff ? (
          <>
            <PageHeader title="Appointments" subtitle="Confirm, complete or cancel patient bookings" />
            <div className="px-4 sm:px-0">
              <AdminAppointmentsTab />
            </div>
          </>
        ) : null;
      case "admin-records":
        return isStaff ? (
          <>
            <PageHeader title="Medical Records" subtitle="Log visits, diagnoses, lab results and scans" />
            <div className="px-4 sm:px-0">
              <AdminMedicalRecordsTab />
            </div>
          </>
        ) : null;
      case "admin-prescriptions":
        return isStaff ? (
          <>
            <PageHeader title="Prescriptions" subtitle="Issue treatment plans with dosage instructions" />
            <div className="px-4 sm:px-0">
              <AdminPrescriptionsTab />
            </div>
          </>
        ) : null;
      case "admin-treatment-plans":
        return isStaff ? (
          <>
            <PageHeader
              title="Treatment Plans"
              subtitle="Personalized treatment timelines, progress notes, reminders & installments, glucose monitoring and final reviews"
            />
            <div className="px-4 sm:px-0">
              <TreatmentPlansTab />
            </div>
          </>
        ) : null;
      case "admin-treatment-alerts":
        return isStaff ? (
          <>
            <PageHeader
              title="Treatment Alerts"
              subtitle="Missed glucose submissions, overdue payments, missed follow-ups, treatments ending, concerning readings and new complications"
            />
            <div className="px-4 sm:px-0">
              <TreatmentAlertsTab onOpenPlans={() => openTab("admin-treatment-plans")} />
            </div>
          </>
        ) : null;
      case "admin-roles":
        return isAdmin ? (
          <>
            <PageHeader title="Staff & Roles" subtitle="Promote verified accounts to staff, or back to patient" />
            <div className="px-4 sm:px-0">
              <RolesTab />
            </div>
          </>
        ) : null;
      case "admin-backups":
        return isAdmin ? (
          <>
            <PageHeader title="Data Backups" subtitle="Daily automated and manual full-database backups, emailed to the clinic admin" />
            <div className="px-4 sm:px-0">
              <BackupsTab />
            </div>
          </>
        ) : null;
      default:
        return null;
    }
  }

  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden bg-forest-50/60 lg:flex-row">
      {/* Desktop sidebar */}
      <aside className="hidden w-72 shrink-0 flex-col bg-forest-950 lg:flex">
        <div className="px-5 pb-2 pt-4">
          <Link href="/" aria-label="S19 Herbal Clinic home">
            <BrandLogo dark />
          </Link>
        </div>

        <div className="flex items-center gap-3 border-y border-white/10 px-4 py-2.5">
          <UserAvatar
            user={user}
            className="h-11 w-11 shrink-0 border-2 border-gold-400"
            textClassName="font-display text-sm font-bold text-gold-300"
          />
          <div className="min-w-0">
            <p className="truncate font-display text-sm font-bold text-white">
              {user?.name || "Welcome"}
            </p>
            <p className="truncate text-[11px] text-white/50" title={user?.email}>
              {user?.email}
            </p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {isAdmin ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-gold-500/50 bg-gold-400/10 px-2 py-0.5 text-[10px] font-bold text-gold-300">
                  <FaShieldHalved className="h-2.5 w-2.5" aria-hidden />
                  Clinic admin
                </span>
              ) : isDoctor ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-sky-500/50 bg-sky-500/10 px-2 py-0.5 text-[10px] font-bold text-sky-300">
                  <FaUserDoctor className="h-2.5 w-2.5" aria-hidden />
                  Doctor
                </span>
              ) : null}
              {user?.emailVerified ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-forest-600 bg-forest-800/80 px-2 py-0.5 text-[10px] font-bold text-forest-100">
                  <FaCheck className="h-2.5 w-2.5 text-gold-400" aria-hidden />
                  Verified
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <nav className="min-h-0 flex-1 space-y-0.5 overflow-y-auto no-scrollbar px-3 py-3">
          {navSections.map((section) => (
            <div key={section.label}>
              <p className="px-2 pb-1 pt-1.5 text-[9px] font-bold uppercase tracking-[0.2em] text-white/30">
                {section.label}
              </p>
              {section.items.map((item) => (
                <NavButton
                  key={item.id}
                  item={item}
                  active={tab === item.id}
                  badge={
                    item.id === "messages" && data.unreadCount > 0 ? data.unreadCount : undefined
                  }
                  onClick={() => openTab(item.id)}
                />
              ))}
            </div>
          ))}
        </nav>

        <div className="space-y-1 border-t border-white/10 p-2.5">
          <BackToSiteLink compact />
          <button
            type="button"
            onClick={() => logout()}
            className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-white/55 transition-colors hover:bg-white/5 hover:text-white"
          >
            <FaArrowRightFromBracket className="h-4 w-4" aria-hidden />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="flex items-center justify-between gap-3 bg-white/80 px-3 py-3 backdrop-blur sm:px-5 lg:hidden">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
            className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-line-strong bg-white text-ink shadow-card"
          >
            <FaBars className="h-4 w-4" aria-hidden />
          </button>
          <Link href="/" className="flex items-center" aria-label="S19 Herbal Clinic home">
            <BrandLogo dark={false} />
          </Link>
          <button
            type="button"
            onClick={() => openTab("messages")}
            aria-label="Messages"
            className="relative flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-line-strong bg-white text-ink shadow-card"
          >
            <FaEnvelope className="h-4 w-4" aria-hidden />
            {data.unreadCount > 0 ? (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold-400 px-1 text-[9px] font-bold text-forest-950">
                {data.unreadCount > 9 ? "9+" : data.unreadCount}
              </span>
            ) : null}
          </button>
        </header>

        {/* Desktop top bar */}
        <header className="hidden items-center justify-between gap-4 px-8 pb-6 pt-8 lg:flex">
          <div>
            <p className="font-display text-[22px] font-bold leading-tight text-ink">
              {greeting}, {firstName}
            </p>
            <p className="mt-1 text-xs text-muted">{dateLabel}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => openTab("messages")}
              aria-label="Messages"
              className="relative flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border border-line-strong bg-white text-ink shadow-card transition-colors hover:bg-forest-50"
            >
              <FaEnvelope className="h-4 w-4" aria-hidden />
              {data.unreadCount > 0 ? (
                <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-gold-400 px-1.5 text-[10px] font-bold text-forest-950">
                  {data.unreadCount > 9 ? "9+" : data.unreadCount}
                </span>
              ) : null}
            </button>
            <button
              type="button"
              onClick={() => openTab("settings")}
              aria-label="Account settings"
              className="cursor-pointer rounded-xl transition-transform hover:scale-105"
            >
              <UserAvatar
                user={user}
                className="h-11 w-11 border-2 border-gold-400"
                textClassName="font-display text-sm font-bold text-gold-300"
              />
            </button>
          </div>
        </header>

        {/* Scrollable content */}
        <main
          ref={scrollRef}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-0 pb-24 pt-0 sm:px-5 lg:px-8 lg:pb-10 lg:pt-0"
        >
          {renderTab()}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav
        aria-label="Account menu"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-forest-100 bg-white/95 pb-[max(0.4rem,env(safe-area-inset-bottom))] pt-1.5 backdrop-blur lg:hidden"
      >
        <div className="no-scrollbar mx-auto flex max-w-md items-stretch gap-1 overflow-x-auto px-2">
          {bottomNavItems.map((item) => {
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => openTab(item.id)}
                className={`relative flex w-[64px] shrink-0 cursor-pointer flex-col items-center gap-1 rounded-lg px-1 py-1.5 sm:w-[72px] ${
                  active ? "bg-forest-50" : ""
                }`}
              >
                <span className={`relative ${active ? "text-forest-950" : "text-muted"}`}>
                  {item.id === "messages" && data.unreadCount > 0 ? (
                    <span
                      className="absolute -right-1.5 -top-1 h-1.5 w-1.5 rounded-full bg-gold-500"
                      aria-hidden
                    />
                  ) : null}
                  {item.icon}
                </span>
                <span
                  className={`truncate text-[9px] font-bold ${
                    active ? "text-forest-950" : "text-muted"
                  }`}
                >
                  {shortNavLabel(item)}
                </span>
                <span
                  className={`h-1 w-1 rounded-full ${active ? "bg-gold-500" : "bg-transparent"}`}
                  aria-hidden
                />
              </button>
            );
          })}
        </div>
      </nav>

      {/* Mobile drawer */}
      <AnimatePresence>
        {drawerOpen ? (
          <div className="fixed inset-0 z-[70] lg:hidden" role="dialog" aria-modal="true">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-forest-950/60 backdrop-blur-sm"
              onClick={() => setDrawerOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.25, ease: "easeOut" }}
              className="absolute inset-y-0 left-0 flex w-[300px] max-w-[85vw] flex-col overflow-y-auto bg-forest-950 shadow-lift"
            >
              <div className="flex items-center justify-between px-5 pt-6">
                <Link href="/" aria-label="S19 Herbal Clinic home">
                  <BrandLogo dark />
                </Link>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  aria-label="Close menu"
                  className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-white/15 text-white/70 transition-colors hover:bg-white/10"
                >
                  <FaXmark className="h-4 w-4" aria-hidden />
                </button>
              </div>

              <div className="flex items-center gap-3 border-y border-white/10 px-5 py-4">
                <UserAvatar
                  user={user}
                  className="h-12 w-12 shrink-0 border-2 border-gold-400"
                  textClassName="font-display text-sm font-bold text-gold-300"
                />
                <div className="min-w-0">
                  <p className="truncate font-display text-sm font-bold text-white">
                    {user?.name || "Welcome"}
                  </p>
                  <p className="truncate text-[11px] text-white/50">{user?.email}</p>
                </div>
              </div>

              <nav className="flex-1 space-y-1 px-3 py-4">
                {navSections.map((section) => (
                  <div key={section.label}>
                    <p className="px-2 pb-1.5 pt-2 text-[9px] font-bold uppercase tracking-[0.2em] text-white/30">
                      {section.label}
                    </p>
                    {section.items.map((item) => (
                      <NavButton
                        key={item.id}
                        item={item}
                        active={tab === item.id}
                        badge={
                          item.id === "messages" && data.unreadCount > 0
                            ? data.unreadCount
                            : undefined
                        }
                        onClick={() => openTab(item.id)}
                      />
                    ))}
                  </div>
                ))}
              </nav>

              <div className="space-y-1 border-t border-white/10 p-3">
                <BackToSiteLink compact />
                <button
                  type="button"
                  onClick={() => logout()}
                  className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/55 transition-colors hover:bg-white/5 hover:text-white"
                >
                  <FaArrowRightFromBracket className="h-4 w-4" aria-hidden />
                  Sign out
                </button>
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}