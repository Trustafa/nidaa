import type { Metadata } from "next";
import { connection } from "next/server";
import { ActionButton, CopyField, OrgForm, TestMessageForm } from "@/components/settings-controls";
import { MarginMark } from "@/components/ink";
import { PageHeading } from "@/components/ui";
import { getOrg } from "@/lib/store";
import { sendingQuota } from "@/lib/quota";
import { fmtWhen, plural } from "@/lib/format";
import { envChecklist, getWhatsAppConfig, isWhatsAppConfigured } from "@/lib/whatsapp/config";
import { getPhoneNumberInfo, listSubscribedApps, listTemplates, type RemoteTemplate } from "@/lib/whatsapp/client";
import { TEMPLATES, type TemplateKey } from "@/lib/whatsapp/templates";
import { runRemindersAction, submitTemplatesAction, subscribeAppAction } from "@/app/actions";

export const metadata: Metadata = {
  title: "Settings · Nidaa",
};

type Check = { label: string; state: "done" | "todo" | "error"; detail: string; tech: string };

const stateStyles: Record<Check["state"], { dot: string; text: string; label: string }> = {
  done: { dot: "bg-attending-dot", text: "text-attending-ink", label: "Done" },
  todo: { dot: "bg-pending-dot", text: "text-ink-muted", label: "To do" },
  error: { dot: "bg-declined-dot", text: "text-declined-ink", label: "Problem" },
};

const templateStatusStyle: Record<string, string> = {
  APPROVED: "text-attending-ink",
  PENDING: "text-maybe-ink",
  REJECTED: "text-declined-ink",
  PAUSED: "text-invalid-ink",
  DISABLED: "text-declined-ink",
};

const templatePurpose: Record<TemplateKey, string> = {
  invitation: "Invitations",
  invitation_image: "Invitations with a photo",
  invitation_video: "Invitations with a video",
  chase: "Chasing guests who haven't replied",
  event_reminder: "Pre-event reminder",
};

const errMsg = (r: PromiseSettledResult<unknown>) => (r.status === "rejected" ? String((r.reason as Error)?.message ?? r.reason) : "");

export default async function SettingsPage() {
  await connection();
  const org = getOrg();
  const config = getWhatsAppConfig();
  const configured = isWhatsAppConfigured(config);
  const env = envChecklist(config);
  const quota = sendingQuota();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const webhookUrl = `${appUrl.replace(/\/$/, "")}/api/whatsapp/webhook`;

  const [phoneRes, templatesRes, subsRes] = configured
    ? await Promise.allSettled([
        getPhoneNumberInfo(),
        config.businessAccountId ? listTemplates() : Promise.reject(new Error("WHATSAPP_BUSINESS_ACCOUNT_ID is not set")),
        config.businessAccountId ? listSubscribedApps() : Promise.reject(new Error("WHATSAPP_BUSINESS_ACCOUNT_ID is not set")),
      ])
    : [];

  const phone = phoneRes?.status === "fulfilled" ? phoneRes.value : null;
  const remoteTemplates: RemoteTemplate[] = templatesRes?.status === "fulfilled" ? templatesRes.value : [];
  const subscribed = subsRes?.status === "fulfilled" ? subsRes.value.length > 0 : false;

  const required = (Object.entries(TEMPLATES) as [TemplateKey, (typeof TEMPLATES)[TemplateKey]][]).map(([key, t]) => ({
    ...t,
    purpose: templatePurpose[key],
    remote: remoteTemplates.find((r) => r.name === t.name && r.language === config.templateLanguage),
  }));
  const approved = required.filter((t) => t.remote?.status === "APPROVED").length;
  const missing = required.filter((t) => !t.remote).length;
  const isPublicUrl = !/localhost|127\.0\.0\.1/.test(webhookUrl) && webhookUrl.startsWith("https://");

  const credsSet = env.filter((e) => e.required).every((e) => e.set);
  const checks: Check[] = [
    {
      label: "WhatsApp keys",
      state: credsSet ? "done" : "todo",
      detail: credsSet
        ? "Nidaa has what it needs to send from your WhatsApp number."
        : "Not added yet. Whoever looks after your Nidaa account adds these once.",
      tech: `${env.filter((e) => e.required && e.set).length} of ${env.filter((e) => e.required).length} required environment variables are set (listed below).`,
    },
    {
      label: "Your WhatsApp number",
      state: !configured ? "todo" : phone ? "done" : "error",
      detail: phone
        ? `Sending as ${phone.verified_name ?? "your business"} from ${phone.display_phone_number ?? "your number"}.`
        : configured
          ? "Nidaa couldn't reach your WhatsApp number. Whoever set it up should take a look."
          : "Not connected yet. Your guests will see messages coming from this number.",
      tech: configured && !phone ? errMsg(phoneRes!) : "Needs WHATSAPP_PHONE_NUMBER_ID and a permanent WHATSAPP_ACCESS_TOKEN.",
    },
    {
      label: "Hearing back from guests",
      state: !configured || !config.businessAccountId ? "todo" : subsRes?.status === "rejected" ? "error" : subscribed && isPublicUrl ? "done" : "todo",
      detail:
        configured && subscribed && isPublicUrl
          ? "Replies reach Nidaa the moment guests tap a button."
          : "Not set up yet. Until it is, guests' replies won't show up here.",
      tech: !configured
        ? "Needs a public HTTPS URL for the webhook; use a tunnel such as ngrok while developing."
        : subsRes?.status === "rejected"
          ? errMsg(subsRes)
          : !subscribed
            ? "The app isn't subscribed to this WhatsApp account's webhooks yet (use Subscribe app)."
            : !isPublicUrl
              ? "NEXT_PUBLIC_APP_URL isn't a public HTTPS URL, so Meta can't reach this server."
              : "Subscribed. Make sure the callback URL below is saved in the Meta App Dashboard.",
    },
    {
      label: "Message wording",
      state: !configured ? "todo" : templatesRes?.status === "rejected" ? "error" : approved === required.length ? "done" : "todo",
      detail:
        approved === required.length && configured
          ? "WhatsApp has approved how your invitations and reminders are worded."
          : "Your invitation and reminder wording needs WhatsApp's approval before it can be sent.",
      tech:
        templatesRes?.status === "rejected"
          ? errMsg(templatesRes)
          : `${approved} of ${required.length} templates approved${missing ? `, ${missing} not submitted` : ""}.`,
    },
  ];

  const checkMark = { done: "attending", todo: "pending", error: "declined" } as const;

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-5 py-8 md:px-12 md:py-12">
      <header>
        <h1 className="text-[2rem] leading-tight font-bold tracking-[-0.025em] md:text-[2.5rem]">Settings</h1>
        <p className="mt-2 text-base text-ink-muted md:text-lg">Your details, and how Nidaa reaches your guests.</p>
      </header>

      <section aria-labelledby="org-heading" className="mt-10">
        <PageHeading id="org-heading">About you</PageHeading>
        <div className="mt-5">
          <OrgForm org={org} />
        </div>
      </section>

      <section aria-labelledby="wa-heading" className="mt-14">
        <PageHeading
          id="wa-heading"
          aside={
            <span
              className={`inline-flex items-center gap-1 text-sm font-semibold ${
                phone ? "text-attending-ink" : configured ? "text-declined-ink" : "text-maybe-ink"
              }`}
            >
              <MarginMark status={phone ? "attending" : configured ? "declined" : "invalid"} className="size-4" />
              {phone ? "Connected" : configured ? "Can't reach WhatsApp" : "Practice mode"}
            </span>
          }
        >
          WhatsApp
        </PageHeading>
        <p className="mt-3 max-w-[65ch] text-[0.9375rem] text-ink-muted">
          {configured
            ? "Nidaa sends through the WhatsApp Cloud API using the credentials set on this server."
            : "Until WhatsApp is connected, nothing reaches your guests. Invitations and replies are practice runs, so you can try everything first. Connecting is a one-time job for whoever looks after your Nidaa account; the steps are below for them."}
        </p>

        <ol className="ruled-margin mt-5 border-t border-line [--margin-x:2.75rem]">
          {checks.map((c) => (
            <li key={c.label} className="grid grid-cols-[var(--margin-x)_1fr_auto] items-start gap-y-2 border-b border-line py-3.5">
              <span className="flex justify-end pr-2.5 pt-0.5">
                {c.state === "todo" ? (
                  <span className="mt-2 h-0.5 w-3 rounded-sm bg-pending-dot" aria-hidden />
                ) : (
                  <MarginMark status={checkMark[c.state]} className="size-5" />
                )}
              </span>
              <div className="min-w-0 pl-4">
                <p className="font-semibold">
                  {c.label}{" "}
                  <span className={`ml-1 text-sm font-normal ${stateStyles[c.state].text}`}>{stateStyles[c.state].label}</span>
                </p>
                <p className="mt-0.5 text-sm break-words text-ink-muted">{c.detail}</p>
                <details className="mt-1 text-[0.8125rem] text-ink-faint">
                  <summary className="cursor-pointer select-none hover:text-ink-muted">For whoever sets this up</summary>
                  <p className="mt-1 break-words">{c.tech}</p>
                </details>
              </div>
              {c.label === "Hearing back from guests" && configured && config.businessAccountId && !subscribed && (
                <ActionButton action={subscribeAppAction}>Subscribe app</ActionButton>
              )}
            </li>
          ))}
        </ol>

        <div className="tnum mt-6 text-[0.9375rem]">
          <p className="font-semibold">Daily sending allowance</p>
          <p className="mt-1 text-ink-muted">
            {quota.limit === null
              ? `No daily cap set. ${plural(quota.used, "person", "people")} messaged in the last 24 hours.`
              : `${quota.used} of ${quota.limit} people messaged in the last 24 hours. WhatsApp counts this on a rolling 24 hours; replies from guests don't count.`}
            {quota.queued > 0 &&
              ` ${plural(quota.queued, "message")} waiting in the queue${quota.nextSlotAt ? `, going out from ${fmtWhen(quota.nextSlotAt)}` : ""}.`}
          </p>
          {quota.limit === 250 && (
            <p className="mt-1 text-sm text-ink-muted">
              250 is Meta&apos;s limit until your business is verified. Once it is, set WHATSAPP_DAILY_LIMIT to your new limit.
            </p>
          )}
        </div>

        <details className="group mt-8" open={configured}>
          <summary className="cursor-pointer text-[0.9375rem] font-semibold text-brand-600 select-none hover:underline">
            Setup details, for whoever connects WhatsApp
          </summary>
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <CopyField label="Webhook callback URL" value={webhookUrl} />
          <div>
            <p className="text-sm font-semibold">Verify token and app secret</p>
            <p className="mt-1.5 text-sm text-ink-muted">
              {config.verifyToken && config.appSecret
                ? "Both set. Enter the same verify token in the Meta App Dashboard."
                : "Set WHATSAPP_WEBHOOK_VERIFY_TOKEN and WHATSAPP_APP_SECRET."}
            </p>
          </div>
        </div>

        <h3 className="mt-10 font-bold">Environment</h3>
        <ul className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-2">
          {env.map((e) => (
            <li key={e.key} className="flex items-center gap-2 text-sm">
              {e.set ? (
                <MarginMark status="attending" className="size-4" />
              ) : e.required ? (
                <MarginMark status="declined" className="size-4" />
              ) : (
                <span aria-hidden className="inline-block w-4" />
              )}
              <code className="font-mono text-[0.8125rem]">{e.key}</code>
              <span className="text-ink-muted">{e.set ? "set" : e.required ? "missing" : "default"}</span>
            </li>
          ))}
        </ul>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-bold">Message templates</h3>
          {configured && missing > 0 && <ActionButton action={submitTemplatesAction}>{`Submit ${missing} for review`}</ActionButton>}
        </div>
        <p className="mt-1 max-w-[65ch] text-sm text-ink-muted">
          WhatsApp only lets a business start a conversation with an approved template. Meta sets the final category
          when it reviews them; invitations are usually classed as marketing.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-[0.9375rem]">
            <thead>
              <tr className="border-b border-ink/80 text-left text-[0.8125rem] text-ink-muted">
                <th scope="col" className="py-2 pr-4 font-semibold">Template</th>
                <th scope="col" className="py-2 pr-4 font-semibold">Used for</th>
                <th scope="col" className="py-2 pr-4 font-semibold">Category</th>
                <th scope="col" className="py-2 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {required.map((t) => (
                <tr key={t.name} className="border-b border-line">
                  <td className="py-3 pr-4 font-mono text-[0.8125rem]">{t.name}</td>
                  <td className="py-3 pr-4 text-ink-muted">{t.purpose}</td>
                  <td className="py-3 pr-4 text-sm text-ink-muted">{(t.remote?.category ?? t.category).toLowerCase()}</td>
                  <td className="py-3">
                    {t.remote ? (
                      <span
                        title={t.remote.rejected_reason && t.remote.rejected_reason !== "NONE" ? t.remote.rejected_reason : undefined}
                        className={`text-sm font-semibold ${templateStatusStyle[t.remote.status] ?? "text-pending-ink"}`}
                      >
                        {t.remote.status.charAt(0) + t.remote.status.slice(1).toLowerCase()}
                      </span>
                    ) : (
                      <span className="text-sm text-ink-muted">{configured ? "Not submitted" : "—"}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-10">
          <TestMessageForm disabled={!configured} />
        </div>
        </details>
      </section>

      <section aria-labelledby="reminders-heading" className="mt-14">
        <PageHeading id="reminders-heading">Reminders</PageHeading>
        <p className="mt-3 max-w-[65ch] text-[0.9375rem] text-ink-muted">
          Every hour Nidaa checks each event: guests who haven&apos;t replied get a gentle nudge, and guests who are
          coming get a reminder before the day, following each event&apos;s settings. A scheduler calls{" "}
          <code className="font-mono text-[0.8125rem]">/api/cron/reminders</code> to do this.
        </p>
        <div className="mt-4">
          <ActionButton action={runRemindersAction}>Check reminders now</ActionButton>
        </div>
      </section>
    </main>
  );
}
