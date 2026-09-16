import type { ReactNode } from "react";

const IMAGE_LINE = /^!\[([^\]]*)\]\(([^)]+)\)$/;
const HEADING = /^(#{1,6})\s+(.+)$/;
const BULLET_ITEM = /^[-*]\s+/;
const ORDERED_ITEM = /^\d+[.)]\s+/;
const DIVIDER = /^[*_\-]{3,}\s*$/;

const INLINE =
  /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;

function inline(text: string, keyBase: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let token: RegExpExecArray | null;
  let i = 0;

  while ((token = INLINE.exec(text)) !== null) {
    if (token.index > lastIndex) {
      nodes.push(text.slice(lastIndex, token.index));
    }
    const raw = token[0];
    const key = `${keyBase}-${i++}`;
    if (raw.startsWith("**") && raw.endsWith("**")) {
      nodes.push(
        <strong key={key} className="font-semibold text-ink">
          {raw.slice(2, -2)}
        </strong>
      );
    } else if (raw.startsWith("*") && raw.endsWith("*")) {
      nodes.push(
        <em key={key} className="italic text-ink/90">
          {raw.slice(1, -1)}
        </em>
      );
    } else if (raw.startsWith("`") && raw.endsWith("`")) {
      nodes.push(
        <code key={key} className="rounded bg-cream px-1.5 py-0.5 font-mono text-[0.9em] text-forest-900">
          {raw.slice(1, -1)}
        </code>
      );
    } else {
      const match = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(raw);
      if (match) {
        nodes.push(
          <a
            key={key}
            href={match[2]}
            className="font-medium text-forest-700 underline decoration-gold-400 decoration-2 underline-offset-2 transition-colors hover:text-forest-900"
          >
            {match[1]}
          </a>
        );
      } else {
        nodes.push(raw);
      }
    }
    lastIndex = token.index + raw.length;
  }
  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }
  return nodes;
}

export function readingTime(body: string): number {
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export function ArticleBody({ body }: { body: string }) {
  const blocks = body
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);

  return (
    <div className="space-y-5">
      {blocks.map((block, index) => {
        const key = `block-${index}`;

        const image = IMAGE_LINE.exec(block);
        if (image) {
          return (
            <figure key={key} className="my-2 overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
              <img src={image[2]} alt={image[1] || ""} className="w-full object-cover" loading="lazy" />
              {image[1] ? (
                <figcaption className="border-t border-line bg-cream/70 px-4 py-2.5 text-center text-xs text-muted">
                  {image[1]}
                </figcaption>
              ) : null}
            </figure>
          );
        }

        const heading = HEADING.exec(block);
        if (heading && block.split("\n").every((line) => HEADING.test(line))) {
          const level = heading[1].length;
          const content = inline(heading[2], `${key}-h`);
          if (level === 1) {
            return (
              <h2 key={key} className="pt-2 font-display text-2xl font-bold leading-tight text-ink">
                {content}
              </h2>
            );
          }
          if (level === 2) {
            return (
              <h3
                key={key}
                className="flex items-baseline gap-2.5 pt-1 font-display text-xl font-semibold leading-snug text-forest-900"
              >
                <span className="h-5 w-1 shrink-0 translate-y-0.5 rounded-full bg-gold-400" aria-hidden />
                {content}
              </h3>
            );
          }
          return (
            <h4 key={key} className="pt-1 font-display text-lg font-semibold leading-snug text-ink">
              {content}
            </h4>
          );
        }

        if (DIVIDER.test(block)) {
          return <hr key={key} className="my-4 border-line" />;
        }

        const lines = block.split("\n");
        const allBullets = lines.every((line) => BULLET_ITEM.test(line.trim()));
        if (allBullets) {
          return (
            <ul key={key} className="space-y-2.5">
              {lines.map((line, li) => {
                const content = line.trim().replace(BULLET_ITEM, "");
                return (
                  <li key={`${key}-${li}`} className="flex gap-2.5 text-[15px] leading-relaxed text-ink/90">
                    <span className="mt-[0.62em] h-1.5 w-1.5 shrink-0 rounded-full bg-gold-500" aria-hidden />
                    <span>{inline(content, `${key}-${li}`)}</span>
                  </li>
                );
              })}
            </ul>
          );
        }

        const allOrdered = lines.every((line) => ORDERED_ITEM.test(line.trim()));
        if (allOrdered) {
          return (
            <ol key={key} className="space-y-2.5">
              {lines.map((line, li) => {
                const content = line.trim().replace(ORDERED_ITEM, "");
                return (
                  <li key={`${key}-${li}`} className="flex gap-3 text-[15px] leading-relaxed text-ink/90">
                    <span className="font-display text-sm font-semibold text-gold-600" aria-hidden>
                      {li + 1}.
                    </span>
                    <span>{inline(content, `${key}-${li}`)}</span>
                  </li>
                );
              })}
            </ol>
          );
        }

        return (
          <p key={key} className="whitespace-pre-line font-body text-[15px] leading-7 text-ink/90">
            {inline(block, key)}
          </p>
        );
      })}
    </div>
  );
}