import { getActiveAdmin } from "@/lib/admin/auth";
import { listEnquiries, parseEnquiryQuery } from "@/lib/admin/enquiry-query";

function csvCell(value: string) {
  const safeValue = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safeValue.replaceAll('"', '""')}"`;
}

export async function GET(request: Request) {
  const user = await getActiveAdmin();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const query = parseEnquiryQuery({
    q: url.searchParams.get("q") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
    service: url.searchParams.get("service") ?? undefined,
    sort: url.searchParams.get("sort") ?? undefined,
  });
  const { items } = await listEnquiries(query, { paginate: false });
  const header = ["Received", "Name", "Company", "Email", "Service", "Status"];
  const rows = items.map((item) => [
    item.createdAt.toISOString(),
    item.fullName,
    item.company ?? "",
    item.email,
    item.serviceType,
    item.status,
  ]);
  const csv = [header, ...rows]
    .map((row) => row.map((value) => csvCell(String(value))).join(","))
    .join("\r\n");

  return new Response(`\uFEFF${csv}`, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="zab-enquiries.csv"',
      "cache-control": "no-store",
    },
  });
}
