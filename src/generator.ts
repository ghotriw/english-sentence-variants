import { escapeRegex } from "./utils.ts";
import { findAllContractionPairs, swapAllContractions } from "./contractions.ts";
import { findTrailingAdverbial, moveAdverbialToStart } from "./adverbials.ts";
import { buildNeverInversion } from "./neverInversion.ts";

export function generate(sentence: string): string[] {
  const results = new Set<string>();
  results.add(sentence);

  const hasNever = /\bhave never\b|\bhas never\b/i.test(sentence);

  // Swap ALL contractions in one pass
  if (!hasNever) {
    const pairs = findAllContractionPairs(sentence);
    if (pairs.length > 0) {
      const swapped = pairs.reduce((s, [expanded, contracted]) => {
        const isExpanded = new RegExp(`\\b${escapeRegex(expanded)}\\b`, "i").test(s);
        return isExpanded
          ? swapAllContractions(s, expanded, contracted)
          : swapAllContractions(s, contracted, expanded);
      }, sentence);
      if (swapped !== sentence) results.add(swapped);
    }
  }

  // Adverbial movement — apply to all current variants
  const adverbial = findTrailingAdverbial(sentence);
  if (adverbial) {
    for (const variant of Array.from(results)) {
      results.add(moveAdverbialToStart(variant, adverbial, sentence));
    }
  }

  // "never" inversion
  const neverInversion = buildNeverInversion(sentence);
  if (neverInversion) results.add(neverInversion);

  return Array.from(results);
}
