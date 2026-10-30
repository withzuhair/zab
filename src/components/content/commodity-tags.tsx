"use client";

import { useMemo, useState } from "react";
import { PackageSearch } from "lucide-react";

type CommodityTagsProps = {
  items: readonly string[];
};

export function CommodityTags({ items }: CommodityTagsProps) {
  const [query, setQuery] = useState("");
  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return normalizedQuery
      ? items.filter((item) => item.toLowerCase().includes(normalizedQuery))
      : items;
  }, [items, query]);

  if (items.length === 0) return null;

  return (
    <div className="grid gap-4">
      <label className="grid max-w-md gap-2 text-sm font-semibold">
        Filter commodities
        <input
          className="border-input bg-background focus-visible:border-ring min-h-11 rounded-md border px-3 font-normal outline-none"
          onChange={(event) => setQuery(event.currentTarget.value)}
          type="search"
          value={query}
        />
      </label>
      {filteredItems.length > 0 ? (
        <ul
          aria-label="Commodities"
          aria-live="polite"
          className="flex flex-wrap gap-2"
        >
          {filteredItems.map((item) => (
            <li
              className="border-border bg-muted inline-flex min-h-11 items-center gap-2 rounded-full border px-4 py-2 text-sm"
              key={item}
            >
              <PackageSearch aria-hidden="true" className="size-4" />
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground" role="status">
          No matching commodities.
        </p>
      )}
    </div>
  );
}
