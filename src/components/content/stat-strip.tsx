type Stat = {
  label: string;
  value: string;
  confirmed: boolean;
};

type StatStripProps = {
  stats: readonly Stat[];
};

export function StatStrip({ stats }: StatStripProps) {
  const confirmedStats = stats.filter((stat) => stat.confirmed);

  if (confirmedStats.length === 0) return null;

  return (
    <ul
      aria-label="Company statistics"
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      {confirmedStats.map((stat) => (
        <li className="border-border rounded-xl border p-5" key={stat.label}>
          <p className="text-2xl font-semibold">{stat.value}</p>
          <p className="mt-1 text-sm opacity-75">{stat.label}</p>
        </li>
      ))}
    </ul>
  );
}
