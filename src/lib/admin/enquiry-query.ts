import { z } from "zod";
import { prisma } from "@/lib/db";
import { enquiryStatusSchema, serviceTypeSchema } from "@/lib/admin/validation";

const querySchema = z.object({
  q: z.string().trim().max(100).default(""),
  status: enquiryStatusSchema.optional(),
  service: serviceTypeSchema.optional(),
  sort: z.enum(["newest", "oldest"]).default("newest"),
  page: z.coerce.number().int().min(1).default(1),
});

export function parseEnquiryQuery(
  params: Record<string, string | string[] | undefined>,
) {
  const parsed = querySchema.safeParse({
    q: typeof params.q === "string" ? params.q : "",
    status: params.status,
    service: params.service,
    sort: params.sort,
    page: params.page,
  });

  if (!parsed.success) {
    throw new Error("Invalid enquiry search parameters.");
  }

  return parsed.data;
}

export function enquiryWhere(query: ReturnType<typeof parseEnquiryQuery>) {
  return {
    ...(query.status ? { status: query.status } : {}),
    ...(query.service ? { serviceType: query.service } : {}),
    ...(query.q
      ? {
          OR: [
            { fullName: { contains: query.q, mode: "insensitive" as const } },
            { email: { contains: query.q, mode: "insensitive" as const } },
            { company: { contains: query.q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };
}

export async function listEnquiries(
  query: ReturnType<typeof parseEnquiryQuery>,
  options: { paginate: boolean },
) {
  const where = enquiryWhere(query);
  const pageSize = 25;
  const [total, items] = await Promise.all([
    prisma.enquiry.count({ where }),
    prisma.enquiry.findMany({
      where,
      orderBy: { createdAt: query.sort === "oldest" ? "asc" : "desc" },
      ...(options.paginate
        ? { skip: (query.page - 1) * pageSize, take: pageSize }
        : {}),
      select: {
        id: true,
        createdAt: true,
        fullName: true,
        company: true,
        email: true,
        serviceType: true,
        status: true,
      },
    }),
  ]);

  return { items, total, pageSize };
}
