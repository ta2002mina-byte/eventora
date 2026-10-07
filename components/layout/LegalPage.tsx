/** Renders admin-edited plain text: blank line = new paragraph, "## " = heading. */
export function LegalPage({ title, body }: { title: string; body: string }) {
  const blocks = body.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="font-display text-3xl text-charcoal sm:text-4xl">{title}</h1>
      <div className="mt-8 space-y-4">
        {blocks.map((block, i) =>
          block.startsWith("## ") ? (
            <h2 key={i} className="pt-4 font-display text-xl text-charcoal">{block.slice(3)}</h2>
          ) : (
            <p key={i} className="whitespace-pre-line text-sm leading-relaxed text-charcoal-600">{block}</p>
          )
        )}
      </div>
    </div>
  );
}
