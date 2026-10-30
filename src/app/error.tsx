"use client";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main
      id="main-content"
      className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center"
      tabIndex={-1}
    >
      <h1 className="text-3xl font-semibold tracking-tight">
        Something went wrong
      </h1>
      <p className="text-muted-foreground mt-4 max-w-lg">
        Please try again. If the problem continues, return to the home page and
        try again later.
      </p>
      <button
        className="mt-7 inline-flex min-h-11 items-center rounded-full bg-blue-700 px-5 text-sm font-semibold text-white"
        onClick={reset}
        type="button"
      >
        Try again
      </button>
    </main>
  );
}
