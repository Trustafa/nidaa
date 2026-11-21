export function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex flex-col items-start select-none">
      <span className={`font-script leading-none text-rose ${compact ? "text-[2rem]" : "text-[2.75rem]"}`}>Nidaa</span>
      {!compact && (
        <span className="mt-1 pl-1 text-[0.625rem] font-semibold uppercase tracking-[0.28em] text-gold">
          RSVP Service
        </span>
      )}
    </div>
  );
}
