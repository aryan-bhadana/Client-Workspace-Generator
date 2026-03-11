interface EmptyStateProps {
  eyebrow: string;
  title: string;
  description: string;
}

export function EmptyState({
  eyebrow,
  title,
  description,
}: EmptyStateProps) {
  return (
    <section className="rounded-3xl border border-dashed border-slate-300 bg-white/70 p-10 shadow-sm backdrop-blur">
      <div className="max-w-2xl space-y-3">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
          {eyebrow}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="text-base text-muted-foreground">{description}</p>
      </div>
    </section>
  );
}
