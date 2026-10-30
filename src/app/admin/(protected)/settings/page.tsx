import { redirect } from "next/navigation";
import { Suspense } from "react";
import { updateSettings } from "@/app/admin/actions";
import { AdminLoading } from "@/components/admin/admin-loading";
import { getActiveAdmin } from "@/lib/admin/auth";
import { prisma } from "@/lib/db";
import { confirmationFlags } from "@content/confirm-flags";
import { site } from "@content/site";
import { z } from "zod";

const statSchema = z.object({
  label: z.string(),
  value: z.string(),
  claim: z.string(),
});
const hubsSchema = z.object({ locations: z.array(z.string()) });

const statisticKeys = ["shipments", "countries", "team", "years"] as const;

export default function AdminSettingsPage() {
  return (
    <Suspense fallback={<AdminLoading />}>
      <AdminSettingsContent />
    </Suspense>
  );
}

async function AdminSettingsContent() {
  const user = await getActiveAdmin();
  if (!user) redirect("/admin/login");
  if (user.role !== "ADMIN") redirect("/admin");

  const rows = await prisma.setting.findMany({
    where: {
      key: {
        in: [
          "company.name",
          "company.address",
          "company.phone",
          "company.email",
          "hubs",
          ...statisticKeys.map((key) => `stats.${key}`),
        ],
      },
    },
  });
  const byKey = new Map(rows.map((row) => [row.key, row]));
  const getText = (key: string, fallback: string) => {
    const row = byKey.get(key);
    return row ? z.string().parse(row.value) : fallback;
  };
  const statistics = statisticKeys.map((key) => {
    const row = byKey.get(`stats.${key}`);
    const fallback = confirmationFlags.statistics[key];
    const value = row ? statSchema.parse(row.value) : fallback;
    return {
      key,
      label: value.label,
      value: value.value,
      confirmed: row?.confirmed ?? fallback.confirmed,
    };
  });
  const hubRow = byKey.get("hubs");
  const hubs = hubRow
    ? hubsSchema.parse(hubRow.value).locations
    : confirmationFlags.hubs.locations;
  const hubsConfirmed = hubRow?.confirmed ?? confirmationFlags.hubs.confirmed;

  return (
    <div className="grid gap-7">
      <header>
        <p className="text-sm font-bold tracking-widest text-blue-700 uppercase">
          Administration
        </p>
        <h1 className="mt-2 text-3xl font-extrabold">Company settings</h1>
      </header>
      <form action={updateSettings} className="grid gap-8">
        <section className="grid gap-4" aria-labelledby="contact-settings">
          <h2 className="text-xl font-bold" id="contact-settings">
            Contact details
          </h2>
          <SettingsField
            label="Company name"
            name="name"
            value={getText("company.name", site.name)}
          />
          <SettingsField
            label="Address"
            name="address"
            value={getText("company.address", site.address)}
            textarea
          />
          <SettingsField
            label="Phone"
            name="phone"
            value={getText("company.phone", site.phone)}
          />
          <SettingsField
            label="Email"
            name="email"
            type="email"
            value={getText("company.email", site.email)}
          />
        </section>

        <section
          className="grid gap-4 border-t pt-6"
          aria-labelledby="statistics"
        >
          <div>
            <h2 className="text-xl font-bold" id="statistics">
              Statistics
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Unconfirmed statistics are hidden from public pages.
            </p>
          </div>
          {statistics.map((statistic) => (
            <fieldset
              className="grid gap-3 rounded-xl border p-4 sm:grid-cols-[1fr_1fr_auto]"
              key={statistic.key}
            >
              <legend className="px-1 text-sm font-bold capitalize">
                {statistic.key}
              </legend>
              <label className="grid gap-1 text-sm font-semibold">
                Label
                <input
                  className="min-h-10 rounded-lg border px-3 font-normal"
                  defaultValue={statistic.label}
                  maxLength={100}
                  name={`stats.${statistic.key}.label`}
                  required
                />
              </label>
              <label className="grid gap-1 text-sm font-semibold">
                Value
                <input
                  className="min-h-10 rounded-lg border px-3 font-normal"
                  defaultValue={statistic.value}
                  maxLength={50}
                  name={`stats.${statistic.key}.value`}
                />
              </label>
              <label className="flex min-h-10 items-center gap-2 self-end text-sm font-semibold">
                <input
                  defaultChecked={statistic.confirmed}
                  name={`stats.${statistic.key}.confirmed`}
                  type="checkbox"
                />
                Confirmed
              </label>
            </fieldset>
          ))}
        </section>

        <section className="grid gap-3 border-t pt-6" aria-labelledby="hubs">
          <h2 className="text-xl font-bold" id="hubs">
            Hub locations
          </h2>
          <label className="grid gap-1 text-sm font-semibold">
            Locations (one per line)
            <textarea
              className="min-h-32 rounded-lg border p-3 font-normal"
              defaultValue={hubs.join("\n")}
              name="hubs"
            />
          </label>
          <label className="flex min-h-10 items-center gap-2 text-sm font-semibold">
            <input
              defaultChecked={hubsConfirmed}
              name="hubsConfirmed"
              type="checkbox"
            />
            Confirm locations for public display
          </label>
        </section>

        <button
          className="min-h-11 w-fit rounded-lg bg-blue-700 px-5 font-bold text-white hover:bg-blue-800"
          type="submit"
        >
          Save settings
        </button>
      </form>
    </div>
  );
}

function SettingsField({
  label,
  name,
  value,
  type = "text",
  textarea = false,
}: {
  label: string;
  name: string;
  value: string;
  type?: string;
  textarea?: boolean;
}) {
  return (
    <label className="grid gap-1 text-sm font-semibold">
      {label}
      {textarea ? (
        <textarea
          className="min-h-24 rounded-lg border p-3 font-normal"
          defaultValue={value}
          name={name}
          required
        />
      ) : (
        <input
          className="min-h-11 rounded-lg border px-3 font-normal"
          defaultValue={value}
          name={name}
          required
          type={type}
        />
      )}
    </label>
  );
}
