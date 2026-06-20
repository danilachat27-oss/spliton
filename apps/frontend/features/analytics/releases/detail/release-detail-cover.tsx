"use client";

import { AlertCircle } from "@/lib/lucide";

import { useI18n } from "@/components/providers/i18n-provider";
import { RELEASE_DETAIL_ANALYTICS_ICONS } from "@/constants/analytics/release-detail-analytics-icons";
import { detailPageText } from "@/lib/i18n/analytics-detail-page-messages";
import { cn } from "@/lib/utils";
import type { ReleaseDetailCover } from "@/types/analytics/release-detail";

import { DetailAnalyticsIllustration } from "./detail-analytics-illustration";

export function ReleaseDetailCover({
  cover,
  releaseTitle,
  compact = false,
}: {
  cover?: ReleaseDetailCover;
  releaseTitle: string;
  compact?: boolean;
}) {
  const { locale } = useI18n();
  const videoSrc = cover?.videoSrc?.trim();
  const posterSrc = cover?.posterSrc?.trim();
  const caption = cover?.caption?.trim();
  const videoStatus = cover?.videoStatus ?? (videoSrc ? "READY" : "NONE");
  const videoType = cover?.videoType ?? "MP4";

  const hasVideo = videoStatus === "READY" && Boolean(videoSrc);
  const hasPoster = Boolean(posterSrc) && videoStatus !== "PROCESSING";
  const isPlaceholder = !hasVideo && !hasPoster;

  const statusCopy: Record<
    NonNullable<ReleaseDetailCover["videoStatus"]>,
    { titleKey: Parameters<typeof detailPageText>[1]; hintKey?: Parameters<typeof detailPageText>[1] }
  > = {
    NONE: {
      titleKey: "analytics.detail.cover.videoNone",
      hintKey: "analytics.detail.cover.videoNoneHint",
    },
    PROCESSING: {
      titleKey: "analytics.detail.cover.processing",
      hintKey: "analytics.detail.cover.processingHint",
    },
    READY: { titleKey: "analytics.detail.cover.videoNone" },
    FAILED: {
      titleKey: "analytics.detail.cover.failed",
      hintKey: "analytics.detail.cover.failedHint",
    },
  };

  return (
    <div className={cn("mt-4 sm:mt-5", compact && "mt-3")}>
      <div
        className={cn(
          "relative w-full rounded-xl",
          isPlaceholder
            ? cn(
                "flex min-h-[200px] items-center justify-center border border-dashed border-white/18 bg-[#0a0a0a]/40 px-5 py-8 sm:min-h-[228px] sm:px-8 sm:py-10",
                compact && "min-h-[192px] sm:min-h-[208px]",
              )
            : cn("overflow-hidden bg-[#111111]", compact ? "aspect-[2.4/1] max-h-[160px] sm:max-h-[180px]" : "aspect-video"),
        )}
      >
        {hasVideo ? (
          videoType === "HLS" ? (
            <video
              className="absolute inset-0 size-full object-cover"
              controls
              playsInline
              preload="metadata"
              poster={posterSrc || undefined}
              aria-label={`Видео-обложка релиза «${releaseTitle}»`}
            >
              <source src={videoSrc} type="application/x-mpegURL" />
            </video>
          ) : (
            <video
              className="absolute inset-0 size-full object-cover"
              controls
              playsInline
              preload="metadata"
              poster={posterSrc || undefined}
              aria-label={`Видео-обложка релиза «${releaseTitle}»`}
            >
              <source src={videoSrc} type="video/mp4" />
            </video>
          )
        ) : hasPoster ? (
          <img src={posterSrc} alt="" className="absolute inset-0 size-full object-cover" />
        ) : (
          <div className="flex max-w-md flex-col items-center text-center">
            {videoStatus === "NONE" || videoStatus === "PROCESSING" ? (
              <DetailAnalyticsIllustration
                src={
                  videoStatus === "PROCESSING"
                    ? RELEASE_DETAIL_ANALYTICS_ICONS.videoProcessing
                    : RELEASE_DETAIL_ANALYTICS_ICONS.videoNone
                }
                surface="cover"
                className={cn("mb-4 w-full", compact ? "max-w-[96px]" : "max-w-[120px] sm:max-w-[132px]")}
                sizes="132px"
              />
            ) : videoStatus === "FAILED" ? (
              <div
                className="mx-auto mb-3 flex size-10 items-center justify-center rounded-full bg-rose-500/10"
                aria-hidden
              >
                <AlertCircle className="size-5 text-rose-400" />
              </div>
            ) : null}
            <p className="text-[13px] font-medium leading-snug text-zinc-300 sm:text-sm">
              {detailPageText(locale, statusCopy[videoStatus].titleKey)}
            </p>
            {statusCopy[videoStatus].hintKey ? (
              <p className="mt-2 text-[12px] leading-relaxed text-zinc-500 sm:text-[13px]">
                {detailPageText(locale, statusCopy[videoStatus].hintKey!)}
              </p>
            ) : null}
          </div>
        )}
      </div>
      {caption ? (
        <p className="mt-2.5 max-w-[70ch] text-[12px] leading-relaxed text-zinc-600">{caption}</p>
      ) : null}
    </div>
  );
}
