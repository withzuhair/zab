type FeatureListProps = {
  title: string;
  items: readonly string[];
};

export function FeatureList({ title, items }: FeatureListProps) {
  if (items.length === 0) return null;

  return (
    <section aria-labelledby="feature-list-heading">
      <h2 id="feature-list-heading" className="text-xl font-semibold">
        {title}
      </h2>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <li
            className="border-border bg-background rounded-xl border px-4 py-3 text-sm"
            key={item}
          >
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}
