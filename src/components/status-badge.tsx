import { statusLabels, type RsvpStatus } from "@/lib/types";
import { MarginMark } from "./ink";

const inks: Record<RsvpStatus, string> = {
  attending: "text-attending-ink",
  declined: "text-declined-ink",
  maybe: "text-maybe-ink",
  pending: "text-pending-ink",
  invalid: "text-invalid-ink",
};

/** A status written the way a host would: a pen mark and a word, no pill */
export function StatusBadge({ status, mark = true }: { status: RsvpStatus; mark?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap text-sm font-semibold ${inks[status]}`}>
      {mark && status !== "pending" && <MarginMark status={status} className="size-4" />}
      {statusLabels[status]}
    </span>
  );
}
