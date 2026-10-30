import Link from "next/link";

export default function NotFound() {
  return (
    <main
      id="main-content"
      className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center"
      tabIndex={-1}
    >
      <p className="text-muted-foreground text-sm font-semibold tracking-[0.18em] uppercase">
        404
      </p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight">
        Page not found
      </h1>
      <p className="text-muted-foreground mt-4 max-w-lg">
        The page may have moved or the address may be incorrect.
      </p>
      <Link
        className="mt-7 inline-flex min-h-11 items-center rounded-full bg-blue-700 px-5 text-sm font-semibold text-white"
        href="/"
        prefetch={false}
      >
        Return home
      </Link>
    </main>
  );
}
