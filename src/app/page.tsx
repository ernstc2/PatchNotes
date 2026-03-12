import { ThemeToggle } from "@/components/theme-toggle"
import { DbStatus } from "@/components/db-status"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
      <main className="flex w-full max-w-lg flex-col items-center gap-8 text-center">
        {/* Header row with theme toggle */}
        <div className="flex w-full items-center justify-end">
          <ThemeToggle />
        </div>

        {/* Branding */}
        <div className="flex flex-col items-center gap-4">
          <h1 className="text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            PatchNotes
          </h1>
          <p className="text-xl text-zinc-500 dark:text-zinc-400">
            A changelog for your government
          </p>
          <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-400">
            v1.0-dev
          </span>
        </div>

        {/* Description */}
        <p className="max-w-sm text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
          Everyday people can quickly understand what their government actually
          changed today — no political spin, just clear structured facts.
        </p>

        {/* DB Status */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
            Database
          </span>
          <DbStatus />
        </div>
      </main>
    </div>
  )
}
