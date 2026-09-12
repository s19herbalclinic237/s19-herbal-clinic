import { Container } from "@/components/ui/container";
import { Kicker } from "@/components/ui/heading";

export function PageHero({
  eyebrow,
  title,
  lead,
  image,
  alt = "",
  compact,
  children,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  lead?: string;
  image: string;
  alt?: string;
  compact?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <section className="relative flex items-center overflow-hidden bg-forest-950">
      <img
        src={image}
        alt={alt}
        className="absolute inset-0 h-full w-full object-cover"
        loading="eager"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-forest-950/95 via-forest-950/80 to-forest-950/35" />
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-forest-950/90 via-forest-950/40 to-transparent" />

      <Container
        className={`relative z-10 w-full ${compact ? "py-14 md:py-20" : "py-20 md:py-28"}`}
      >
        {eyebrow ? <Kicker dark>{eyebrow}</Kicker> : null}
        <h1 className="mt-5 max-w-3xl text-balance text-white drop-shadow-sm">{title}</h1>
        {lead ? (
          <p className="mt-6 max-w-2xl text-base text-forest-100/90 md:text-lg">{lead}</p>
        ) : null}
        {children ? <div className="mt-9">{children}</div> : null}
      </Container>
    </section>
  );
}