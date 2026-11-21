/** Minimal RFC 4180 CSV parser: quoted fields, escaped quotes, CRLF, and ; or tab delimiters. */
export function parseCsv(text: string): string[][] {
  const src = text.replace(/^﻿/, "");
  const firstLine = src.split(/\r?\n/, 1)[0] ?? "";
  const delimiter = [",", ";", "\t"].reduce((best, d) =>
    firstLine.split(d).length > firstLine.split(best).length ? d : best
  );

  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quoted) {
      if (c === '"' && src[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') {
        quoted = false;
      } else {
        field += c;
      }
    } else if (c === '"' && field === "") {
      quoted = true;
    } else if (c === delimiter) {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += c;
    }
  }
  if (field !== "" || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((f) => f.trim() !== ""));
}

const NAME_HEADER = /^(full\s*)?name$|^guest(\s*name)?$|^head(\s*of\s*(the\s*)?family)?$|^family(\s*name)?$/i;
const FIRST_HEADER = /^first(\s*name)?$/i;
const LAST_HEADER = /^(last|sur)(\s*name)?$/i;
/** How many people the invitation covers: "Seats", "Party size", "Family size", "No. of people", "Pax"… */
const SEATS_HEADER = /seats|party|family\s*size|members|people|persons|pax|guests|count|size|invited/i;
const PHONE_HEADER = /phone|mobile|whats\s*app|number|tel/i;

export type GuestRow = { name: string; phone: string; seats: string };

/**
 * Find name, phone and (optional) household-size columns by header. Without a
 * header row: name, phone, then seats as the first three columns.
 */
export function mapGuestRows(rows: string[][]) {
  if (!rows.length) return { rows: [] as GuestRow[], hasHeader: false, hasSeats: false };
  const header = rows[0].map((h) => h.trim());
  const seatsIdx = header.findIndex((h) => SEATS_HEADER.test(h) && !NAME_HEADER.test(h));
  const nameIdx = header.findIndex((h) => NAME_HEADER.test(h));
  const firstIdx = header.findIndex((h) => FIRST_HEADER.test(h));
  const lastIdx = header.findIndex((h) => LAST_HEADER.test(h));
  // "Number of people" is a size, not a phone number
  const phoneIdx = header.findIndex((h, i) => PHONE_HEADER.test(h) && i !== seatsIdx);
  const hasHeader = phoneIdx !== -1 && (nameIdx !== -1 || firstIdx !== -1);

  const body = hasHeader ? rows.slice(1) : rows;
  const seatsCol = hasHeader ? seatsIdx : body.some((r) => /^\s*\d{1,2}\s*$/.test(r[2] ?? "")) ? 2 : -1;
  return {
    hasHeader,
    hasSeats: seatsCol !== -1,
    rows: body.map((r) => {
      const name = hasHeader
        ? nameIdx !== -1
          ? r[nameIdx]
          : [r[firstIdx], lastIdx !== -1 ? r[lastIdx] : ""].join(" ")
        : r[0];
      const phone = hasHeader ? r[phoneIdx] : r[1];
      const seats = seatsCol !== -1 ? r[seatsCol] : "";
      return { name: (name ?? "").trim(), phone: (phone ?? "").trim(), seats: (seats ?? "").trim() };
    }),
  };
}
