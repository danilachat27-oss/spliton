export type ArtistPlatformSearchId =
  | "yandex"
  | "vk"
  | "spotify"
  | "apple"
  | "youtube";

export type ArtistPlatformSearchTarget = {
  id: ArtistPlatformSearchId;
  labelKey: `admin.artists.platformSearch.${ArtistPlatformSearchId}`;
  buildUrl: (query: string) => string;
};

export const ARTIST_PLATFORM_SEARCH_TARGETS: ArtistPlatformSearchTarget[] = [
  {
    id: "yandex",
    labelKey: "admin.artists.platformSearch.yandex",
    buildUrl: (query) =>
      `https://music.yandex.ru/search?text=${encodeURIComponent(query)}`,
  },
  {
    id: "vk",
    labelKey: "admin.artists.platformSearch.vk",
    buildUrl: (query) => `https://vk.com/audios?q=${encodeURIComponent(query)}`,
  },
  {
    id: "spotify",
    labelKey: "admin.artists.platformSearch.spotify",
    buildUrl: (query) =>
      `https://open.spotify.com/search/${encodeURIComponent(query)}`,
  },
  {
    id: "apple",
    labelKey: "admin.artists.platformSearch.apple",
    buildUrl: (query) =>
      `https://music.apple.com/search?term=${encodeURIComponent(query)}`,
  },
  {
    id: "youtube",
    labelKey: "admin.artists.platformSearch.youtube",
    buildUrl: (query) =>
      `https://music.youtube.com/search?q=${encodeURIComponent(query)}`,
  },
];