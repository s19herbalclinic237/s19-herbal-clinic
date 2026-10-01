"use client";

import type { ReactNode } from "react";

/**
 * Tables are the right shape for a dashboard on a laptop and the wrong shape on
 * a phone. Four to seven columns inside a ~340px viewport do not get narrower,
 * they get crushed: the header labels wrap mid-word, values clip, and the eye
 * has nowhere to land. Horizontal scrolling hides columns instead of helping.
 *
 * So every table here renders twice from one column definition:
 *
 *   md and up  - the real <table>, inside an overflow-x container so a wide
 *                grid still scrolls rather than crushing columns.
 *   below md   - one card per row, stacked label/value lines, no horizontal
 *                scrolling and no clipping.
 *
 * Both trees are rendered and one is hidden with `display: none`, which keeps
 * it out of the accessibility tree and out of the tab order, and means no
 * JavaScript is needed to pick a layout.
 *
 * A column is the single source of truth for both views:
 *   - `header` + `render` drive the desktop cell.
 *   - `label` + `render` drive the mobile line. Omit `label` for a column
 *     that is desktop-only, or set `desktopOnly` for one that is mobile-only.
 *   - The first non-`desktopOnly` column with no `label` becomes the tile's
 *     heading, so it should be the row's primary identity.
 */

export interface ResponsiveColumn<Row> {
  header: ReactNode;
  render: (row: Row, index: number) => ReactNode;
  /** Shown above the value in the mobile tile. Omit for a desktop-only column. */
  label?: ReactNode;
  /** Force this column to never appear in the mobile tile. */
  desktopOnly?: boolean;
  /** Extra classes on the <th>. Use for width hints like `w-8`. */
  headClassName?: string;
  /** Extra classes on the <td>. Use for alignment or nowrap. */
  cellClassName?: string;
}

export interface ResponsiveTableProps<Row> {
  columns: ResponsiveColumn<Row>[];
  rows: Row[];
  rowKey: (row: Row, index: number) => string;
  /**
   * Full control over the mobile card. When omitted a card is built from the
   * columns: the first unlabelled column as the heading, then every labelled
   * column as a label/value line.
   */
  renderTile?: (row: Row, index: number) => ReactNode;
  /**
   * `min-w-*` for the desktop table, as a Tailwind class. Keep this: it is what
   * stops columns crushing on a tablet. On phones the tile list takes over, so
   * the value never applies.
   */
  minWidthClassName?: string;
  /** Wrapper for the desktop card. Pass `""` to nest inside an existing card. */
  containerClassName?: string;
  tableClassName?: string;
  headRowClassName?: string;
  rowClassName?: string;
  /** Vertical alignment for every <td>. Use `top` where cells hold blocks. */
  align?: "top" | "middle";
  /**
   * Shown in place of the rows when `rows` is empty. Kept inside the card so an
   * empty table reads as one box rather than a bare caption under an empty
   * surface, and rendered in both views so a phone does not show a blank frame.
   */
  emptyState?: ReactNode;
}

function TileShell({ children }: { children: ReactNode }) {
  return (
    <li className="rounded-xl border border-forest-100 bg-white p-3.5 shadow-card">
      <div className="space-y-1.5">{children}</div>
    </li>
  );
}

export function ResponsiveTable<Row>({
  columns,
  rows,
  rowKey,
  renderTile,
  minWidthClassName,
  containerClassName = "overflow-hidden rounded-2xl border border-line bg-white shadow-card",
  tableClassName = "w-full text-left text-sm",
  headRowClassName = "border-b border-forest-100 text-[11px] font-bold uppercase tracking-wide text-muted",
  rowClassName = "border-b border-forest-50 last:border-0",
  align = "top",
  emptyState,
}: ResponsiveTableProps<Row>) {
  const alignClass = align === "top" ? "align-top" : "align-middle";

  // The first column that appears on mobile and carries no label reads as the
  // row's identity, so it becomes the tile heading rather than a label/value
  // line. Everything else with a label becomes a line.
  const headingColumn = columns.find((c) => !c.desktopOnly && c.label === undefined);
  const tileLines = columns.filter(
    (c) => !c.desktopOnly && c !== headingColumn && c.label !== undefined
  );

  return (
    <>
      {/* With no rows the caller renders its own empty state, but that state is
          written to sit inside this card. Keep the wrapper and drop only the
          table so the border and surface still read as one box. */}
      <div className={`hidden md:block ${containerClassName}`}>
        {rows.length === 0 ? (
          emptyState ?? null
        ) : (
          <div className="overflow-x-auto">
            <table className={`${tableClassName} ${minWidthClassName ?? ""}`}>
              <thead>
                <tr className={headRowClassName}>
                  {columns.map((c, i) => (
                    <th key={i} className={c.headClassName ?? "px-4 py-3"}>
                      {c.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={rowKey(row, i)} className={rowClassName}>
                    {columns.map((c, ci) => (
                      <td
                        key={ci}
                        className={`${alignClass} ${c.cellClassName ?? "px-4 py-3"}`}
                      >
                        {c.render(row, i)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="md:hidden">
        {rows.length === 0 ? (
          <div className="rounded-2xl border border-line bg-white shadow-card">{emptyState}</div>
        ) : (
          <ul className="space-y-2.5">
            {rows.map((row, i) => (
              <TileShell key={rowKey(row, i)}>
                {renderTile ? (
                  renderTile(row, i)
                ) : (
                  <>
                    {headingColumn ? (
                      <div className="text-sm font-semibold text-ink">{headingColumn.render(row, i)}</div>
                    ) : null}
                    {tileLines.map((c, ci) => (
                      <div key={ci} className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wide text-muted">
                          {c.label}
                        </span>
                        <span className="min-w-0 flex-1 text-sm text-muted">{c.render(row, i)}</span>
                      </div>
                    ))}
                  </>
                )}
              </TileShell>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

export default ResponsiveTable;