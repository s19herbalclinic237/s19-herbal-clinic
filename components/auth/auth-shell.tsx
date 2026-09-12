import { S19_ASSETS } from "@/lib/site-assets";

export function AuthShell({
  eyebrow,
  title,
  lead,
  children,
  footer,
}: {
  eyebrow: string;
  title: string;
  lead?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="py-12 md:py-20">
      <div className="mx-auto w-full max-w-md px-4">
        <div className="overflow-hidden rounded-xl border border-line bg-white shadow-lift">
          <div className="bg-forest-950 px-6 py-6 text-center">
            <img
              src={S19_ASSETS.logos.fullLight}
              alt="S19 Herbal Clinic logo"
              className="mx-auto h-10 w-auto"
            />
            <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.24em] text-gold-400">
              {eyebrow}
            </p>
            <h1 className="mt-2 text-2xl text-white">{title}</h1>
            {lead ? <p className="mt-2 text-sm text-forest-200">{lead}</p> : null}
          </div>
          <div className="p-6 md:p-8">{children ? children : null}</div>
        </div>
        {footer ? <div className="mt-6 text-center text-sm">{footer}</div> : null}
      </div>
    </div>
  );
}