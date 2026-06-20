"use client";

import * as React from "react";
import { Dialog } from "@base-ui/react/dialog";
import { Check, X } from "@/lib/lucide";
import { SplitonLoader } from "@/components/ui/spliton-loader";
import Link from "next/link";

import { useAuth } from "@/components/providers/auth-provider";
import { useI18n } from "@/components/providers/i18n-provider";
import { StyledSelectField } from "@/components/ui/styled-select";
import { ROUTES } from "@/constants/routes";
import { useApiErrorMessage } from "@/hooks/use-api-error-message";
import { tf } from "@/lib/i18n/financial-messages";
import { cn } from "@/lib/utils";
import { createUserSupportTicket, getUserSupportDataSource } from "@/services/user/userSupport.service";

const okxFieldClass =
  "h-11 w-full rounded-lg border-0 bg-[#F5F5F5] px-3 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:bg-white focus:shadow-[0_6px_28px_-12px_rgba(0,0,0,0.08)]";

const okxTextareaClass =
  "min-h-24 w-full rounded-lg border-0 bg-[#F5F5F5] px-3 py-2.5 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:bg-white focus:shadow-[0_6px_28px_-12px_rgba(0,0,0,0.08)]";

const PROJECT_TYPE_VALUES = ["single", "ep", "album", "catalog"] as const;

function projectTypeLabel(value: string, t: (key: string, fallback?: string) => string) {
  return t(`artist.application.projectType.${value}`, value);
}

export type IssuerApplicationModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function IssuerApplicationModal({ open, onOpenChange }: IssuerApplicationModalProps) {
  const { user, authorizedFetch } = useAuth();
  const { t } = useI18n();
  const { messageFor } = useApiErrorMessage();
  const live = getUserSupportDataSource() === "live";

  const [projectType, setProjectType] = React.useState<string>("single");
  const [releaseName, setReleaseName] = React.useState("");
  const [catalogLink, setCatalogLink] = React.useState("");
  const [rightsNote, setRightsNote] = React.useState("");
  const [contact, setContact] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [submitted, setSubmitted] = React.useState(false);

  const projectTypeOptions = React.useMemo(
    () => PROJECT_TYPE_VALUES.map((value) => ({ value, label: t(`artist.application.projectType.${value}`) })),
    [t],
  );

  const submittedSteps = React.useMemo(
    () => [
      { n: "01", label: t("artist.application.step.apply"), done: true },
      { n: "02", label: t("artist.application.step.review"), done: false, active: true },
      { n: "03", label: t("artist.application.step.access"), done: false },
    ],
    [t],
  );

  React.useEffect(() => {
    if (!open) return;
    setError(null);
    setSubmitted(false);
    setSubmitting(false);
  }, [open]);

  const resetForm = () => {
    setProjectType("single");
    setReleaseName("");
    setCatalogLink("");
    setRightsNote("");
    setContact("");
    setError(null);
    setSubmitted(false);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) resetForm();
    onOpenChange(next);
  };

  const submit = async () => {
    const trimmedName = releaseName.trim();
    const trimmedRights = rightsNote.trim();
    if (!trimmedName) {
      setError(t("artist.application.validation.releaseNameRequired"));
      return;
    }
    if (trimmedRights.length < 10) {
      setError(t("artist.application.validation.rightsTooShort"));
      return;
    }

    setSubmitting(true);
    setError(null);

    const message = [
      t("artist.application.ticket.intro"),
      "",
      tf(t("artist.application.ticket.projectType"), { type: projectTypeLabel(projectType, t) }),
      tf(t("artist.application.ticket.name"), { name: trimmedName }),
      catalogLink.trim() ? tf(t("artist.application.ticket.link"), { link: catalogLink.trim() }) : null,
      "",
      t("artist.application.ticket.rightsHeader"),
      trimmedRights,
      contact.trim() ? tf(t("artist.application.ticket.contact"), { contact: contact.trim() }) : null,
    ]
      .filter(Boolean)
      .join("\n");

    try {
      if (live) {
        await createUserSupportTicket(authorizedFetch, {
          category: "account",
          subject: tf(t("artist.application.ticket.subject"), { name: trimmedName }),
          message,
        });
      }
      setSubmitted(true);
    } catch (e) {
      setError(messageFor(e) || t("artist.application.error.submit"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange} modal>
      <Dialog.Portal>
        <Dialog.Backdrop
          className={cn(
            "fixed inset-0 z-[200] bg-black/50 backdrop-blur-[2px]",
            "transition-opacity duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0",
          )}
        />
        <Dialog.Popup
          className={cn(
            "fixed left-1/2 top-1/2 z-[201] flex max-h-[min(92dvh,720px)] w-[min(100vw-1.5rem,480px)] -translate-x-1/2 -translate-y-1/2 flex-col",
            "overflow-hidden rounded-2xl bg-white shadow-[0_24px_80px_-24px_rgba(0,0,0,0.35)]",
            "transition-[opacity,transform] duration-200",
            "data-ending-style:scale-[0.98] data-ending-style:opacity-0",
            "data-starting-style:scale-[0.98] data-starting-style:opacity-0",
          )}
        >
          <div className="flex shrink-0 items-start justify-between gap-3 px-5 pb-3 pt-5 sm:px-6 sm:pt-6">
            <div className="min-w-0 pr-8">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
                {t("artist.application.eyebrow")}
              </p>
              <Dialog.Title className="mt-1 text-lg font-semibold tracking-tight text-neutral-900">
                {submitted ? t("artist.application.title.submitted") : t("artist.application.title.submit")}
              </Dialog.Title>
              <Dialog.Description className="mt-1.5 text-sm leading-relaxed text-neutral-600">
                {submitted
                  ? t("artist.application.description.submitted")
                  : t("artist.application.description.submit")}
              </Dialog.Description>
            </div>
            <Dialog.Close
              aria-label={t("artist.application.closeAria")}
              className="absolute right-4 top-4 inline-flex size-9 items-center justify-center rounded-full text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900"
            >
              <X className="size-4" />
            </Dialog.Close>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 sm:px-6">
            {!user ? (
              <p className="pb-2 text-sm text-neutral-600">{t("artist.application.signInPrompt")}</p>
            ) : submitted ? (
              <div className="space-y-4 pb-2">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-[#F5F5F5]">
                  <Check className="size-6 text-neutral-900" strokeWidth={2.5} />
                </div>
                <div className="grid grid-cols-3 gap-2 rounded-xl bg-[#F5F5F5] p-3">
                  {submittedSteps.map((step) => (
                    <div key={step.n} className="text-center">
                      <span
                        className={cn(
                          "inline-flex size-7 items-center justify-center rounded-full text-[10px] font-bold",
                          step.done && "bg-neutral-900 text-[#B7F500]",
                          step.active && "bg-[#B7F500] text-black",
                          !step.done && !step.active && "bg-white text-neutral-400",
                        )}
                      >
                        {step.done ? <Check className="size-3.5" strokeWidth={3} /> : step.n.slice(-1)}
                      </span>
                      <p className="mt-1 text-[10px] font-medium text-neutral-600">{step.label}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs leading-relaxed text-neutral-500">
                  {t("artist.application.statusHintBefore")}{" "}
                  <Link href={ROUTES.dashboardSupport} className="font-medium text-neutral-900 underline-offset-2 hover:underline">
                    {t("artist.application.statusHintLink")}
                  </Link>
                  {t("artist.application.statusHintAfter")}
                </p>
              </div>
            ) : (
              <form
                id="issuer-application-form"
                className="space-y-4 pb-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  void submit();
                }}
              >
                <StyledSelectField
                  label={t("artist.application.field.projectType")}
                  id="issuer-project-type"
                  variant="okx"
                  value={projectType}
                  options={projectTypeOptions}
                  onChange={setProjectType}
                />

                <div>
                  <label htmlFor="issuer-release-name" className="mb-1.5 block text-xs font-medium text-neutral-700">
                    {t("artist.application.field.releaseName")}
                  </label>
                  <input
                    id="issuer-release-name"
                    value={releaseName}
                    onChange={(e) => setReleaseName(e.target.value)}
                    placeholder={t("artist.application.placeholder.releaseName")}
                    className={okxFieldClass}
                    autoComplete="off"
                  />
                </div>

                <div>
                  <label htmlFor="issuer-catalog-link" className="mb-1.5 block text-xs font-medium text-neutral-700">
                    {t("artist.application.field.catalogLink")}{" "}
                    <span className="font-normal text-neutral-400">{t("artist.application.optional")}</span>
                  </label>
                  <input
                    id="issuer-catalog-link"
                    value={catalogLink}
                    onChange={(e) => setCatalogLink(e.target.value)}
                    placeholder={t("artist.application.placeholder.catalogLink")}
                    className={okxFieldClass}
                    autoComplete="off"
                  />
                </div>

                <div>
                  <label htmlFor="issuer-rights-note" className="mb-1.5 block text-xs font-medium text-neutral-700">
                    {t("artist.application.field.rights")}
                  </label>
                  <textarea
                    id="issuer-rights-note"
                    value={rightsNote}
                    onChange={(e) => setRightsNote(e.target.value)}
                    placeholder={t("artist.application.placeholder.rights")}
                    className={okxTextareaClass}
                  />
                </div>

                <div>
                  <label htmlFor="issuer-contact" className="mb-1.5 block text-xs font-medium text-neutral-700">
                    {t("artist.application.field.contact")}{" "}
                    <span className="font-normal text-neutral-400">{t("artist.application.optional")}</span>
                  </label>
                  <input
                    id="issuer-contact"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder={t("artist.application.placeholder.contact")}
                    className={okxFieldClass}
                    autoComplete="off"
                  />
                </div>
              </form>
            )}
          </div>

          <footer className="shrink-0 px-5 pb-5 pt-3 sm:px-6 sm:pb-6">
            {!user ? (
              <Link
                href={ROUTES.login}
                className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-black text-sm font-semibold text-white transition hover:bg-[#1a1a1a]"
              >
                {t("auth.login.submit")}
              </Link>
            ) : submitted ? (
              <button
                type="button"
                onClick={() => handleOpenChange(false)}
                className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-black text-sm font-semibold text-white transition hover:bg-[#1a1a1a]"
              >
                {t("artist.application.close")}
              </button>
            ) : (
              <div className="space-y-2">
                {error ? <p className="text-sm text-red-700">{error}</p> : null}
                <div className="flex flex-col gap-2 sm:flex-row">
                  <button
                    type="submit"
                    form="issuer-application-form"
                    disabled={submitting}
                    className="inline-flex h-10 flex-1 items-center justify-center rounded-lg bg-black text-sm font-semibold text-white transition hover:bg-[#1a1a1a] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <SplitonLoader size="xxs" variant="dark" className="shrink-0" />
                        {t("artist.application.submitting")}
                      </>
                    ) : (
                      t("artist.application.submit")
                    )}
                  </button>
                  <Dialog.Close
                    type="button"
                    className="inline-flex h-10 flex-1 items-center justify-center rounded-lg bg-[#F5F5F5] text-sm font-semibold text-neutral-900 transition hover:bg-[#EBEBEB]"
                  >
                    {t("artist.application.cancel")}
                  </Dialog.Close>
                </div>
                {!live ? (
                  <p className="text-xs leading-relaxed text-neutral-500">{t("artist.application.demoNote")}</p>
                ) : null}
              </div>
            )}
          </footer>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
