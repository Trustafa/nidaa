export function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex flex-col items-center select-none">
      <span
        className={`font-script text-brand-500 leading-none ${compact ? "text-3xl" : "text-4xl"}`}
      >
        Nidaa
      </span>
      {!compact && (
        <span className="mt-1.5 text-[0.625rem] font-medium uppercase tracking-[0.28em] text-gold">
          RSVP Service
        </span>
      )}
    </div>
  );
}
