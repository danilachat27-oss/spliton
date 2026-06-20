/** Re-export shared reference normalization for labels (same rules as genres). */
export {
  genreMatchKey as referenceMatchKey,
  genreSlugFromName as referenceSlugFromName,
  normalizeGenreName as normalizeReferenceName,
} from './admin-genre.util';
