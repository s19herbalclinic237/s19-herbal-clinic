/**
 * Renders a JSON-LD structured-data block.
 *
 * Wraps the `dangerouslySetInnerHTML` that structured data requires, and handles
 * the two things that are easy to get wrong when inlining JSON into HTML:
 *
 * 1. **Escaping `<`.** A `<` inside a `<script>` body closes the script for the
 *    HTML parser, so a stray `<` in any string turns a description into markup
 *    injection. Every `<` is replaced with its `\u003c` escape, which is valid
 *    JSON and cannot terminate the element.
 * 2. **Null data.** A caller with nothing to declare (for example a page with no
 *    photographs) should not emit an empty script tag, so `null` renders
 *    nothing at all.
 */
export function JsonLd({ data }: { data: unknown }) {
  if (data === null || data === undefined) return null;
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
