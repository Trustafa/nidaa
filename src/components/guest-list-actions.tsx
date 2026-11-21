"use client";

import { useActionState, useEffect, useMemo, useState, useTransition } from "react";
import { addGuestAction, importGuestsAction, type FormState } from "@/app/actions";
import { mapGuestRows, parseCsv } from "@/lib/csv";
import { DEFAULT_COUNTRY_CODE, formatPhone, normalizePhone } from "@/lib/phone";
import { plural } from "@/lib/format";
import { Modal } from "./modal";
import { useToast } from "./toast";
import { Field, Spinner, btnPrimary, btnSecondary, btnSecondarySm, inputBase } from "./ui";

/** A household-size cell: blank means "use the event's default" */
function readSeats(cell: string, fallback: number): number | null {
  if (!cell.trim()) return fallback;
  const n = Number.parseInt(cell, 10);
  return /^\s*\d{1,2}\s*$/.test(cell) && n >= 1 && n <= 20 ? n : null;
}

export function GuestListActions({ eventId, defaultSeats }: { eventId: string; defaultSeats: number }) {
  const [open, setOpen] = useState<"import" | "add" | null>(null);
  return (
    <>
      <div className="flex gap-2">
        <button type="button" onClick={() => setOpen("import")} className={btnSecondarySm}>
          Import CSV
        </button>
        <button type="button" onClick={() => setOpen("add")} className={btnSecondarySm}>
          Add guest
        </button>
      </div>
      {open === "add" && <AddGuestModal eventId={eventId} defaultSeats={defaultSeats} onClose={() => setOpen(null)} />}
      {open === "import" && <ImportModal eventId={eventId} defaultSeats={defaultSeats} onClose={() => setOpen(null)} />}
    </>
  );
}

function ConsentCheckbox({ error }: { error?: string }) {
  return (
    <div>
      <label className="flex items-start gap-2.5 text-sm text-ink">
        <input
          type="checkbox"
          name="consent"
          required
          aria-invalid={Boolean(error)}
          className="mt-0.5 size-4 shrink-0 accent-[var(--brand-600)]"
        />
        <span>
          This guest has agreed to receive messages about this event on WhatsApp.
        </span>
      </label>
      {error && <p className="mt-1.5 text-xs text-declined-ink">{error}</p>}
    </div>
  );
}

function AddGuestModal({ eventId, defaultSeats, onClose }: { eventId: string; defaultSeats: number; onClose: () => void }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(addGuestAction.bind(null, eventId), {});
  const toast = useToast();
  const err = state.errors ?? {};

  useEffect(() => {
    if (state.ok) {
      toast(state.message ?? "Guest added.");
      onClose();
    }
  }, [state, toast, onClose]);

  return (
    <Modal
      title="Add a guest"
      description="The invitation goes to the head of the family and covers their household. They'll be included the next time you send invitations."
      onClose={onClose}
    >
      <form action={formAction} className="flex flex-col gap-4" noValidate>
        <Field label="Name (head of the family)" htmlFor="guest-name" error={err.name}>
          <input id="guest-name" name="name" autoComplete="off" autoFocus aria-invalid={Boolean(err.name)} className={inputBase} />
        </Field>
        <Field label="WhatsApp number" htmlFor="guest-phone" error={err.phone} hint="Include the country code. Numbers starting with 0 are treated as UAE.">
          <input
            id="guest-phone"
            name="phone"
            type="tel"
            inputMode="tel"
            placeholder="+971 50 123 4567"
            aria-invalid={Boolean(err.phone)}
            className={`tnum ${inputBase}`}
          />
        </Field>
        <Field
          label="People on this invitation"
          htmlFor="guest-seats"
          error={err.seats}
          hint="Including them. When they accept, they choose how many are coming, up to this number."
        >
          <input
            id="guest-seats"
            name="seats"
            type="number"
            inputMode="numeric"
            min={1}
            max={20}
            defaultValue={defaultSeats}
            aria-invalid={Boolean(err.seats)}
            className={`tnum w-24 ${inputBase}`}
          />
        </Field>
        <ConsentCheckbox error={err.consent} />
        <div className="mt-1 flex justify-end gap-2">
          <button type="button" onClick={onClose} className={btnSecondary}>
            Cancel
          </button>
          <button type="submit" disabled={pending} className={btnPrimary}>
            {pending && <Spinner />}
            Add guest
          </button>
        </div>
      </form>
    </Modal>
  );
}

function ImportModal({ eventId, defaultSeats, onClose }: { eventId: string; defaultSeats: number; onClose: () => void }) {
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [countryCode, setCountryCode] = useState(DEFAULT_COUNTRY_CODE);
  const [consent, setConsent] = useState(false);
  const [showConsentError, setShowConsentError] = useState(false);
  const [pending, startTransition] = useTransition();
  const toast = useToast();

  const { parsed, hasSeats } = useMemo(() => {
    const { rows, hasSeats } = mapGuestRows(parseCsv(text));
    const seen = new Set<string>();
    return {
      hasSeats,
      parsed: rows.map((r) => {
        const normalized = r.name ? normalizePhone(r.phone, countryCode.replace(/\D/g, "")) : null;
        const duplicate = normalized !== null && seen.has(normalized);
        if (normalized) seen.add(normalized);
        const seatCount = readSeats(r.seats, defaultSeats);
        return {
          ...r,
          normalized: duplicate ? null : normalized,
          duplicate,
          seatCount,
          ok: !duplicate && normalized !== null && seatCount !== null,
        };
      }),
    };
  }, [text, countryCode, defaultSeats]);
  const valid = parsed.filter((r) => r.ok);
  const people = valid.reduce((n, r) => n + (r.seatCount ?? 0), 0);
  const invalid = parsed.length - valid.length;

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setText(await file.text());
  }

  function submit() {
    if (!consent) {
      setShowConsentError(true);
      return;
    }
    startTransition(async () => {
      const r = await importGuestsAction(
        eventId,
        valid.map(({ name, phone, seats }) => ({ name, phone, seats })),
        countryCode
      );
      const extra = [r.duplicates && `${r.duplicates} already on the list`, r.invalid && `${r.invalid} invalid`]
        .filter(Boolean)
        .join(", ");
      toast(`${plural(r.added, "guest")} imported${extra ? ` (${extra} skipped)` : ""}.`);
      onClose();
    });
  }

  return (
    <Modal
      wide
      title="Import guests from CSV"
      description="Use a file with a name column and a phone column. Export from Excel or Google Sheets as CSV."
      onClose={() => !pending && onClose()}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <span className="block text-sm font-medium">CSV file</span>
            <label className={`mt-1.5 w-full cursor-pointer ${btnSecondary}`}>
              <input type="file" accept=".csv,text/csv,text/plain" onChange={onFile} className="sr-only" />
              {fileName ?? "Choose a file…"}
            </label>
          </div>
          <Field label="Default country code" htmlFor="cc" hint="For numbers without one">
            <div className="flex items-center gap-1">
              <span className="text-sm text-ink-muted">+</span>
              <input
                id="cc"
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value.replace(/\D/g, "").slice(0, 3))}
                inputMode="numeric"
                className={`tnum w-20 ${inputBase}`}
              />
            </div>
          </Field>
        </div>

        <div className="text-sm">
          <label htmlFor="csv-paste" className="text-ink-muted">
            Or paste rows
          </label>
          <textarea
            id="csv-paste"
            value={fileName ? "" : text}
            onChange={(e) => {
              setFileName(null);
              setText(e.target.value);
            }}
            rows={4}
            placeholder={"name,phone,people\nKhalid Al Mansoori,+971 50 123 4567,5\nAyesha Khan,050 765 4321,2"}
            className={`tnum mt-1.5 font-mono text-xs ${inputBase}`}
          />
        </div>

        {parsed.length > 0 && (
          <div>
            <p className="tnum text-sm">
              <span className="font-medium">{`${plural(valid.length, "invitation")} ready to import, covering ${plural(people, "person", "people")}`}</span>
              {invalid > 0 && (
                <span className="text-invalid-ink">{` · ${invalid} will be skipped (missing name, invalid or repeated number, or a size that isn't 1–20)`}</span>
              )}
            </p>
            <p className="mt-0.5 text-sm text-ink-muted">
              {hasSeats
                ? `Family sizes come from your file; blank cells use ${defaultSeats}.`
                : `No family-size column found, so each invitation is for ${plural(defaultSeats, "person", "people")}. Add a column like “People” or “Family size” to set each one.`}
            </p>
            <div className="mt-2 max-h-56 overflow-y-auto border-y border-ink/80">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-bg shadow-[0_1px_0_var(--line)]">
                  <tr className="text-left text-xs text-ink-muted">
                    <th scope="col" className="px-3 py-2 font-medium">Name</th>
                    <th scope="col" className="px-3 py-2 font-medium">WhatsApp number</th>
                    <th scope="col" className="px-3 py-2 text-right font-medium">People</th>
                  </tr>
                </thead>
                <tbody>
                  {parsed.slice(0, 200).map((r, i) => (
                    <tr key={i} className="border-t border-line">
                      <td className="px-3 py-1.5">{r.name || <span className="text-invalid-ink">Missing name</span>}</td>
                      <td className="tnum px-3 py-1.5">
                        {r.normalized ? (
                          formatPhone(r.normalized)
                        ) : r.duplicate ? (
                          <span className="text-ink-muted">Duplicate of a row above</span>
                        ) : (
                          <span className="text-invalid-ink">{r.phone ? `Invalid: ${r.phone}` : "Missing"}</span>
                        )}
                      </td>
                      <td className="tnum px-3 py-1.5 text-right">
                        {r.seatCount === null ? <span className="text-invalid-ink">{`“${r.seats}”`}</span> : r.seatCount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {parsed.length > 200 && <p className="tnum mt-1.5 text-xs text-ink-muted">{`Showing the first 200 of ${parsed.length} rows.`}</p>}
          </div>
        )}

        <div>
          <label className="flex items-start gap-2.5 text-sm text-ink">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => {
                setConsent(e.target.checked);
                setShowConsentError(false);
              }}
              className="mt-0.5 size-4 shrink-0 accent-[var(--brand-600)]"
            />
            <span>These guests have agreed to receive messages about this event on WhatsApp.</span>
          </label>
          {showConsentError && (
            <p className="mt-1.5 text-xs text-declined-ink">Confirm your guests agreed to hear from you on WhatsApp.</p>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} disabled={pending} className={btnSecondary}>
            Cancel
          </button>
          <button type="button" onClick={submit} disabled={pending || valid.length === 0} className={`tnum ${btnPrimary}`}>
            {pending && <Spinner />}
            {valid.length ? `Import ${plural(valid.length, "guest")}` : "Import guests"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
