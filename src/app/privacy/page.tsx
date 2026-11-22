import type { Metadata } from "next";
import Link from "next/link";
import { Wordmark } from "@/components/wordmark";

/*
 * Public privacy policy. Meta needs this URL (App settings → Basic → Privacy
 * Policy URL) before the app can go Live, and it must load without signing in,
 * so keep this route outside any auth middleware.
 *
 * Set NIDAA_LEGAL_NAME and NIDAA_PRIVACY_EMAIL in the environment; the
 * bracketed fallbacks are placeholders that must not ship.
 */

const business = process.env.NIDAA_LEGAL_NAME || "[Your business name]";
const contact = process.env.NIDAA_PRIVACY_EMAIL || "[privacy@yourdomain.com]";
const effective = "22 November 2026";

export const metadata: Metadata = {
  title: "Privacy policy · Nidaa",
  description: "How Nidaa handles the details of guests invited to events over WhatsApp.",
};

function Section({ id, title, children }: { id?: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-8 border-t border-line pt-8">
      <h2 className="text-xl font-bold tracking-[-0.015em] text-ink">{title}</h2>
      <div className="mt-3 flex flex-col gap-3 text-base leading-7 text-ink-muted [&_li]:pl-1 [&_strong]:font-semibold [&_strong]:text-ink [&_ul]:list-disc [&_ul]:pl-5">
        {children}
      </div>
    </section>
  );
}

export default function PrivacyPage() {
  const mail = (
    <a href={`mailto:${contact}`} className="font-semibold text-brand-600 underline">
      {contact}
    </a>
  );

  return (
    <div className="flex min-h-dvh flex-1 flex-col bg-bg">
      <header className="bg-cover px-5 py-5 md:px-12">
        <div className="mx-auto max-w-3xl">
          <Link href="/" aria-label="Nidaa home" className="inline-block">
            <Wordmark compact />
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-10 md:px-12 md:py-14">
        <h1 className="text-[2rem] leading-tight font-bold tracking-[-0.025em] text-ink md:text-[2.5rem]">Privacy policy</h1>
        <p className="mt-2 text-base text-ink-muted">{`Effective ${effective}`}</p>

        <div className="mt-8 flex flex-col gap-3 text-lg leading-8 text-ink">
          <p>
            {`Nidaa is an RSVP service run by ${business}. Hosts use it to invite guests to weddings, parties and other events on WhatsApp and to collect their replies. This policy explains what we hold about guests, why, and what you can ask us to do with it.`}
          </p>
        </div>

        <div className="mt-10 flex flex-col gap-10">
          <Section title="Who is responsible">
            <p>
              {`${business} operates Nidaa and is responsible for the information described here. The host of each event decides who is invited and gives us the guest list. Questions about this policy go to `}
              {mail}.
            </p>
          </Section>

          <Section title="What we hold about guests">
            <ul>
              <li>
                <strong>From the host:</strong> your name, your WhatsApp number, and how many people your invitation covers.
              </li>
              <li>
                <strong>From you:</strong> your reply (coming, can&apos;t make it, or maybe), how many of your family are
                coming, and any message you send us on WhatsApp.
              </li>
              <li>
                <strong>From WhatsApp:</strong> whether each message was sent, delivered and read, and when.
              </li>
            </ul>
            <p>
              We don&apos;t ask for payment details, ID documents, your location or your contacts, and we don&apos;t use
              cookies or tracking on guests.
            </p>
          </Section>

          <Section title="Why we use it">
            <ul>
              <li>To send you the invitation, reminders about replying, and a reminder before the event.</li>
              <li>To record your reply and show the host who is coming and how many seats to set.</li>
              <li>To answer you if you message us about the event.</li>
            </ul>
            <p>
              We only message numbers the host has confirmed agreed to hear about the event on WhatsApp. We never use
              your details for advertising, never sell them, and never message you about anything other than the event
              you were invited to.
            </p>
          </Section>

          <Section title="Who can see it">
            <ul>
              <li>
                <strong>The event&apos;s host</strong> sees your name, number, reply and messages for their event.
              </li>
              <li>
                <strong>WhatsApp (Meta Platforms)</strong> carries the messages, as our messaging provider under the
                WhatsApp Business terms. Meta&apos;s own handling is covered by the{" "}
                <a href="https://www.whatsapp.com/legal/privacy-policy" className="font-semibold text-brand-600 underline">
                  WhatsApp Privacy Policy
                </a>
                .
              </li>
              <li>
                <strong>Our hosting provider</strong> stores the data on our behalf and can&apos;t use it for anything
                else.
              </li>
            </ul>
            <p>We share it with nobody else unless the law requires us to.</p>
          </Section>

          <Section title="How long we keep it">
            <p>
              We keep a guest list for as long as the host needs it for their event, and delete it no later than 90 days
              after the event date. A host can delete an event, and every guest on it, at any time.
            </p>
          </Section>

          <Section id="delete" title="Stopping messages and deleting your information">
            <ul>
              <li>
                <strong>To stop messages:</strong> reply STOP in the WhatsApp chat, or block the number. We won&apos;t
                message you again about that event.
              </li>
              <li>
                <strong>To see, correct or delete your information:</strong> email {mail} from any address, telling us
                the WhatsApp number you were invited on. We&apos;ll confirm it&apos;s yours by WhatsApp, then do it
                within 30 days and let you know when it&apos;s done.
              </li>
            </ul>
            <p>You can also ask the host who invited you to remove you from their list.</p>
          </Section>

          <Section title="Keeping it safe">
            <p>
              Data is sent over encrypted connections and stored on access-controlled servers. Only the host and the
              people who run Nidaa can see a guest list.
            </p>
          </Section>

          <Section title="Children">
            <p>
              We only message the adult an invitation is addressed to. A family invitation counts how many are coming;
              we don&apos;t collect the names or details of anyone else in the family.
            </p>
          </Section>

          <Section title="Changes">
            <p>
              If we change this policy we&apos;ll update the date at the top. If a change affects how we use details we
              already hold, we&apos;ll tell hosts before it takes effect.
            </p>
          </Section>
        </div>
      </main>

      <footer className="border-t border-line px-5 py-6 text-sm text-ink-muted md:px-12">
        <p className="mx-auto max-w-3xl">{`© ${business}. Questions: `}{mail}</p>
      </footer>
    </div>
  );
}
