export type LabelPlatformSearchId = "google" | "spotify" | "discogs" | "yandex";

export type LabelPlatformSearchTarget = {
  id: LabelPlatformSearchId;
  labelKey: `admin.labels.platformSearch.${LabelPlatformSearchId}`;
  buildUrl: (query: string) => string;
};

export const LABEL_PLATFORM_SEARCH_TARGETS: LabelPlatformSearchTarget[] = [
  {
    id: "google",
    labelKey: "admin.labels.platformSearch.google",
    buildUrl: (query) =>
      `https://www.google.com/search?q=${encodeURIComponent(`${query} record label`)}`,
  },
  {
    id: "spotify",
    labelKey: "admin.labels.platformSearch.spotify",
    buildUrl: (query) =>
      `https://open.spotify.com/search/${encodeURIComponent(query)}/labels`,
  },
  {
    id: "discogs",
    labelKey: "admin.labels.platformSearch.discogs",
    buildUrl: (query) =>
      `https://www.discogs.com/search/?q=${encodeURIComponent(query)}&type=label`,
  },
  {
    id: "yandex",
    labelKey: "admin.labels.platformSearch.yandex",
    buildUrl: (query) =>
      `https://yandex.ru/search/?text=${encodeURIComponent(`${query} лейбл`)}`,
  },
];