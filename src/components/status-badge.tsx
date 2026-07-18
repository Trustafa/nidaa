import { statusLabels, type RsvpStatus } from "@/lib/mock-data";

const styles: Record<RsvpStatus, { badge: string; dot: string }> = {
  attending: { badge: "bg-attending-bg text-attending-ink", dot: "bg-attending-dot" },
  declined: { badge: "bg-declined-bg text-declined-ink", dot: "bg-declined-dot" },
  maybe: { badge: "bg-maybe-bg text-maybe-ink", dot: "bg-maybe-dot" },
  pending: { badge: "bg-pending-bg text-pending-ink", dot: "bg-pending-dot" },
  invalid: { badge: "bg-invalid-bg text-invalid-ink", dot: "bg-invalid-dot" },
};

export function StatusBadge({ status }: { status: RsvpStatus }) {
  const s = styles[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${s.badge}`}
    >
      <span aria-hidden className={`size-1.5 rounded-full ${s.dot}`} />
      {statusLabels[status]}
    </span>
  );
}
