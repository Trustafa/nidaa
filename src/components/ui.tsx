// Shared control styles so buttons and fields look the same on every screen.

export const btnPrimary =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-[0.9375rem] font-semibold text-white shadow-[0_1px_2px_oklch(0.3_0.1_265/0.25)] transition-[background-color,transform] duration-150 hover:bg-brand-700 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60";

export const btnSecondary =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-control bg-bg px-4 py-2 text-[0.9375rem] font-semibold text-ink transition-colors duration-150 hover:border-brand-300 hover:text-brand-700 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60";

export const btnSecondarySm =
  "inline-flex min-h-9 items-center justify-center gap-2 rounded-md border border-control bg-bg px-3 py-1.5 text-sm font-semibold text-ink transition-colors duration-150 hover:border-brand-300 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-60";

export const btnDanger =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-md px-3.5 py-2 text-[0.9375rem] font-semibold text-declined-ink transition-colors duration-150 hover:bg-declined-bg disabled:cursor-not-allowed disabled:opacity-60";

export const inputBase =
  "w-full rounded-md border border-control bg-bg px-3 py-2 text-[0.9375rem] text-ink placeholder:text-ink-faint transition-colors duration-150 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 aria-[invalid=true]:border-declined-dot";

export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-sm font-semibold text-ink">
        {label}
      </label>
      <div className="mt-1.5">{children}</div>
      {error ? (
        <p id={`${htmlFor}-error`} className="mt-1.5 text-xs text-declined-ink">
          {error}
        </p>
      ) : hint ? (
        <p id={`${htmlFor}-hint`} className="mt-1.5 text-xs text-ink-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function Spinner() {
  return (
    <span
      aria-hidden
      className="size-3.5 animate-spin rounded-full border-[1.5px] border-current border-r-transparent"
    />
  );
}

/** A heading written on the page: plain, set in ink, with room above it */
export function PageHeading({ children, id, aside }: { children: React.ReactNode; id?: string; aside?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 border-b border-ink/80 pb-2">
      <h2 id={id} className="text-lg font-bold tracking-[-0.01em] text-ink">
        {children}
      </h2>
      {aside}
    </div>
  );
}
