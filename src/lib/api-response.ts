export type ApiErrorCode = "VALIDATION" | "RATE_LIMIT" | "SPAM" | "SERVER";

export function apiError(
  status: number,
  code: ApiErrorCode,
  message: string,
  fields?: Record<string, string>,
) {
  return Response.json(
    {
      ok: false,
      error: {
        code,
        message,
        ...(fields ? { fields } : {}),
      },
    },
    { status },
  );
}
