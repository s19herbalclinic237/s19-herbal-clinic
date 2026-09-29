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
import { useLocale } from "@/components/i18n/locale-provider";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import type { TranslationKey } from "@/lib/i18n";
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
  labelKey: TranslationKey;
  icon: ReactNode;
}

const patientTabs: NavItem[] = [
  {
    id: "overview",
    labelKey: "dash.shell.nav.overview",
    icon: <FaTableCellsLarge className="h-4 w-4" aria-hidden />,
  },
  {
    id: "appointments",
    labelKey: "dash.shell.nav.appointments",
    icon: <FaCalendarCheck className="h-4 w-4" aria-hidden />,
  },
  {
    id: "orders",
    labelKey: "dash.shell.nav.orders",
    icon: <FaBoxOpen className="h-4 w-4" aria-hidden />,
  },
  {
    id: "messages",
    labelKey: "dash.shell.nav.messages",
    icon: <FaEnvelope className="h-4 w-4" aria-hidden />,
  },
  {
    id: "records",
    labelKey: "dash.shell.nav.records",
    icon: <FaFileMedical className="h-4 w-4" aria-hidden />,
  },
  {
    id: "prescriptions",
    labelKey: "dash.shell.nav.prescriptions",
    icon: <FaPills className="h-4 w-4" aria-hidden />,
  },
  {
    id: "treatment",
    labelKey: "dash.shell.nav.treatment",
    icon: <FaCalendarDays className="h-4 w-4" aria-hidden />,
  },
  {
    id: "family",
    labelKey: "dash.shell.nav.family",
    icon: <FaPeopleGroup className="h-4 w-4" aria-hidden />,
  },
  {
    id: "testimonials",
    labelKey: "dash.shell.nav.testimonials",
    icon: <FaCommentDots className="h-4 w-4" aria-hidden />,
  },
  {
    id: "settings",
    labelKey: "dash.shell.nav.settings",
    icon: <FaGear className="h-4 w-4" aria-hidden />,
  },
];

const adminTabs: NavItem[] = [
  {
    id: "admin-products",
    labelKey: "dash.shell.nav.adminProducts",
    icon: <FaTags className="h-4 w-4" aria-hidden />,
  },
  {
    id: "admin-doctors",
    labelKey: "dash.shell.nav.adminDoctors",
    icon: <FaUserDoctor className="h-4 w-4" aria-hidden />,
  },
  {
    id: "admin-appointments",
    labelKey: "dash.shell.nav.adminAppointments",
    icon: <FaCalendarCheck className="h-4 w-4" aria-hidden />,
  },
  {
    id: "admin-records",
    labelKey: "dash.shell.nav.adminRecords",
    icon: <FaFolderOpen className="h-4 w-4" aria-hidden />,
  },
  {
    id: "admin-prescriptions",
    labelKey: "dash.shell.nav.adminPrescriptions",
    icon: <FaFilePrescription className="h-4 w-4" aria-hidden />,
  },
  {
    id: "admin-treatment-plans",
    labelKey: "dash.shell.nav.adminTreatmentPlans",
    icon: <FaCalendarDays className="h-4 w-4" aria-hidden />,
  },
  {
    id: "admin-treatment-alerts",
    labelKey: "dash.shell.nav.adminTreatmentAlerts",
    icon: <FaTriangleExclamation className="h-4 w-4" aria-hidden />,
  },
  {
    id: "admin-orders",
    labelKey: "dash.shell.nav.adminOrders",
    icon: <FaTruckFast className="h-4 w-4" aria-hidden />,
  },
  {
    id: "admin-testimonials",
    labelKey: "dash.shell.nav.adminTestimonials",
    icon: <FaCommentDots className="h-4 w-4" aria-hidden />,
  },
  {
    id: "admin-messaging",
    labelKey: "dash.shell.nav.adminMessaging",
    icon: <FaUserGear className="h-4 w-4" aria-hidden />,
  },
  {
    id: "admin-posts",
    labelKey: "dash.shell.nav.adminPosts",
    icon: <FaNewspaper className="h-4 w-4" aria-hidden />,
  },
  {
    id: "admin-subscribers",
    labelKey: "dash.shell.nav.adminSubscribers",
    icon: <FaUsers className="h-4 w-4" aria-hidden />,
  },
  {
    id: "admin-videos",
    labelKey: "dash.shell.nav.adminVideos",
    icon: <FaVideo className="h-4 w-4" aria-hidden />,
  },
  {
    id: "admin-roles",
    labelKey: "dash.shell.nav.adminRoles",
    icon: <FaUserShield className="h-4 w-4" aria-hidden />,
  },
  {
    id: "admin-backups",
    labelKey: "dash.shell.nav.adminBackups",
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
    labelKey: "dash.shell.nav.doctorAppointments",
    icon: <FaCalendarCheck className="h-4 w-4" aria-hidden />,
  },
  {
    id: "admin-records",
    labelKey: "dash.shell.nav.doctorRecords",
    icon: <FaFolderOpen className="h-4 w-4" aria-hidden />,
  },
  {
    id: "admin-prescriptions",
    labelKey: "dash.shell.nav.doctorPrescriptions",
    icon: <FaFilePrescription className="h-4 w-4" aria-hidden />,
  },
  {
    id: "admin-treatment-plans",
    labelKey: "dash.shell.nav.doctorTreatmentPlans",
    icon: <FaCalendarDays className="h-4 w-4" aria-hidden />,
  },
  {
    id: "admin-treatment-alerts",
    labelKey: "dash.shell.nav.doctorTreatmentAlerts",
    icon: <FaTriangleExclamation className="h-4 w-4" aria-hidden />,
  },
  {
    id: "admin-messaging",
    labelKey: "dash.shell.nav.doctorMessaging",
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
  const { t } = useLocale();
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
      <span className="min-w-0 flex-1 truncate">{t(item.labelKey)}</span>
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
  const { t } = useLocale();
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
      {t("dash.shell.backToSite")}
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
  const { t } = useLocale();
  const data = useDashboardData();
  const [tab, setTab] = useState<TabId>(() =>
    user?.role === "doctor" ? "admin-appointments" : "overview"
  );
  const [drawerOpen, setDrawerOpen] = useState(false);
  const scrollRef = useRef<HTMLElement | null>(null);
  const isAdmin = user?.role === "admin";
  const isDoctor = user?.role === "doctor";
  const isStaff = isAdmin || isDoctor;

  const settingsTab = patientTabs.filter((tabItem) => tabItem.id === "settings");
  const navSections: Array<{ labelKey: TranslationKey; items: NavItem[] }> = isDoctor
    ? [
        { labelKey: "dash.shell.section.clinicalWork", items: doctorTabs },
        { labelKey: "dash.shell.section.myAccount", items: settingsTab },
      ]
    : isAdmin
      ? [
          { labelKey: "dash.shell.section.myAccount", items: patientTabs },
          { labelKey: "dash.shell.section.clinicAdmin", items: adminTabs },
        ]
      : [{ labelKey: "dash.shell.section.myAccount", items: patientTabs }];
  const bottomNavItems = isDoctor ? doctorTabs : patientTabs;

  // One-word labels for the compressed mobile bottom nav so items never
  // truncate on small screens.
  const shortNavLabel = (item: NavItem): string => {
    const key: TranslationKey =
      item.id === "overview"
        ? "dash.shell.short.home"
        : item.id === "appointments" || item.id === "admin-appointments"
          ? "dash.shell.short.bookings"
          : item.id === "orders"
            ? "dash.shell.short.orders"
            : item.id === "messages" || item.id === "admin-messaging"
              ? "dash.shell.short.inbox"
              : item.id === "records" || item.id === "admin-records"
                ? "dash.shell.short.records"
                : item.id === "prescriptions" || item.id === "admin-prescriptions"
                  ? "dash.shell.short.rx"
                  : item.id === "treatment" || item.id === "admin-treatment-plans"
                    ? "dash.shell.short.plan"
                    : item.id === "admin-treatment-alerts"
                      ? "dash.shell.short.alerts"
                      : item.id === "family"
                        ? "dash.shell.short.family"
                        : item.id === "testimonials"
                          ? "dash.shell.short.stories"
                          : item.id === "settings"
                            ? "dash.shell.short.settings"
                            : item.labelKey;
    return t(key);
  };

  const firstName = user?.name?.trim().split(/\s+/)[0] || "";
  const greeting = getGreeting();
  const greetingKey: TranslationKey =
    greeting === "morning"
      ? "dash.shell.greeting.morning"
      : greeting === "afternoon"
        ? "dash.shell.greeting.afternoon"
        : "dash.shell.greeting.evening";
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
              title={t("dash.shell.h.appointments.title")}
              subtitle={t("dash.shell.h.appointments.sub")}
            />
            <div className="px-4 sm:px-0">
              <AppointmentsTab />
            </div>
          </>
        );
      case "orders":
        return (
          <>
            <PageHeader
              title={t("dash.shell.h.orders.title")}
              subtitle={t("dash.shell.h.orders.sub")}
            >
              <Link href="/shop" className={buttonLinkClasses("gold", "md")}>
                {t("dash.shell.h.orders.browse")}
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
            <PageHeader
              title={t("dash.shell.h.messages.title")}
              subtitle={t("dash.shell.h.messages.sub")}
            />
            <div className="px-4 sm:px-0">
              <MessagesTab />
            </div>
          </>
        );
      case "records":
        return (
          <>
            <PageHeader
              title={t("dash.shell.h.records.title")}
              subtitle={t("dash.shell.h.records.sub")}
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
              title={t("dash.shell.h.prescriptions.title")}
              subtitle={t("dash.shell.h.prescriptions.sub")}
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
              title={t("dash.shell.h.treatment.title")}
              subtitle={t("dash.shell.h.treatment.sub")}
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
              title={t("dash.shell.h.family.title")}
              subtitle={t("dash.shell.h.family.sub")}
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
              title={t("dash.shell.h.testimonials.title")}
              subtitle={t("dash.shell.h.testimonials.sub")}
            />
            <div className="px-4 sm:px-0">
              <TestimonialsTab />
            </div>
          </>
        );
      case "settings":
        return (
          <>
            <PageHeader
              title={t("dash.shell.h.settings.title")}
              subtitle={t("dash.shell.h.settings.sub")}
            />
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
            <PageHeader
              title={t("dash.shell.h.adminDoctors.title")}
              subtitle={t("dash.shell.h.adminDoctors.sub")}
            />
            <div className="px-4 sm:px-0">
              <DoctorsTab />
            </div>
          </>
        ) : null;
      case "admin-appointments":
        return isStaff ? (
          <>
            <PageHeader
              title={t("dash.shell.h.adminAppointments.title")}
              subtitle={t("dash.shell.h.adminAppointments.sub")}
            />
            <div className="px-4 sm:px-0">
              <AdminAppointmentsTab />
            </div>
          </>
        ) : null;
      case "admin-records":
        return isStaff ? (
          <>
            <PageHeader
              title={t("dash.shell.h.adminRecords.title")}
              subtitle={t("dash.shell.h.adminRecords.sub")}
            />
            <div className="px-4 sm:px-0">
              <AdminMedicalRecordsTab />
            </div>
          </>
        ) : null;
      case "admin-prescriptions":
        return isStaff ? (
          <>
            <PageHeader
              title={t("dash.shell.h.adminPrescriptions.title")}
              subtitle={t("dash.shell.h.adminPrescriptions.sub")}
            />
            <div className="px-4 sm:px-0">
              <AdminPrescriptionsTab />
            </div>
          </>
        ) : null;
      case "admin-treatment-plans":
        return isStaff ? (
          <>
            <PageHeader
              title={t("dash.shell.h.adminTreatmentPlans.title")}
              subtitle={t("dash.shell.h.adminTreatmentPlans.sub")}
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
              title={t("dash.shell.h.adminTreatmentAlerts.title")}
              subtitle={t("dash.shell.h.adminTreatmentAlerts.sub")}
            />
            <div className="px-4 sm:px-0">
              <TreatmentAlertsTab onOpenPlans={() => openTab("admin-treatment-plans")} />
            </div>
          </>
        ) : null;
      case "admin-roles":
        return isAdmin ? (
          <>
            <PageHeader
              title={t("dash.shell.h.adminRoles.title")}
              subtitle={t("dash.shell.h.adminRoles.sub")}
            />
            <div className="px-4 sm:px-0">
              <RolesTab />
            </div>
          </>
        ) : null;
      case "admin-backups":
        return isAdmin ? (
          <>
            <PageHeader
              title={t("dash.shell.h.adminBackups.title")}
              subtitle={t("dash.shell.h.adminBackups.sub")}
            />
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
              {user?.name || t("dash.shell.welcome")}
            </p>
            <p className="truncate text-[11px] text-white/50" title={user?.email}>
              {user?.email}
            </p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {isAdmin ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-gold-500/50 bg-gold-400/10 px-2 py-0.5 text-[10px] font-bold text-gold-300">
                  <FaShieldHalved className="h-2.5 w-2.5" aria-hidden />
                  {t("dash.shell.badge.clinicAdmin")}
                </span>
              ) : isDoctor ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-sky-500/50 bg-sky-500/10 px-2 py-0.5 text-[10px] font-bold text-sky-300">
                  <FaUserDoctor className="h-2.5 w-2.5" aria-hidden />
                  {t("dash.shell.badge.staff")}
                </span>
              ) : null}
              {user?.emailVerified ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-forest-600 bg-forest-800/80 px-2 py-0.5 text-[10px] font-bold text-forest-100">
                  <FaCheck className="h-2.5 w-2.5 text-gold-400" aria-hidden />
                  {t("dash.shell.badge.verified")}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <nav className="min-h-0 flex-1 space-y-0.5 overflow-y-auto no-scrollbar px-3 py-3">
          {navSections.map((section) => (
            <div key={section.labelKey}>
              <p className="px-2 pb-1 pt-1.5 text-[9px] font-bold uppercase tracking-[0.2em] text-white/30">
                {t(section.labelKey)}
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
          <div className="flex justify-center pb-1">
            <LanguageSwitcher />
          </div>
          <BackToSiteLink compact />
          <button
            type="button"
            onClick={() => logout()}
            className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-white/55 transition-colors hover:bg-white/5 hover:text-white"
          >
            <FaArrowRightFromBracket className="h-4 w-4" aria-hidden />
            {t("dash.shell.signOut")}
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
            aria-label={t("aria.openMenu")}
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
            aria-label={t("dash.shell.ariaMessages")}
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
              {t(greetingKey)}
              {firstName ? `, ${firstName}` : ""}
            </p>
            <p className="mt-1 text-xs text-muted">{dateLabel}</p>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <button
              type="button"
              onClick={() => openTab("messages")}
              aria-label={t("dash.shell.ariaMessages")}
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
              aria-label={t("dash.shell.ariaSettings")}
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
        aria-label={t("nav.account")}
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
                  aria-label={t("aria.closeMenu")}
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
                    {user?.name || t("dash.shell.welcome")}
                  </p>
                  <p className="truncate text-[11px] text-white/50">{user?.email}</p>
                </div>
              </div>

              <nav className="flex-1 space-y-1 px-3 py-4">
                {navSections.map((section) => (
                  <div key={section.labelKey}>
                    <p className="px-2 pb-1.5 pt-2 text-[9px] font-bold uppercase tracking-[0.2em] text-white/30">
                      {t(section.labelKey)}
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
                <div className="flex justify-center pb-1">
                  <LanguageSwitcher />
                </div>
                <BackToSiteLink compact />
                <button
                  type="button"
                  onClick={() => logout()}
                  className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/55 transition-colors hover:bg-white/5 hover:text-white"
                >
                  <FaArrowRightFromBracket className="h-4 w-4" aria-hidden />
                  {t("dash.shell.signOut")}
                </button>
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}