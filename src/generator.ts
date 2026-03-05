import { escapeRegex } from "./utils.ts";
import { findAllContractionPairs, swapAllContractions } from "./contractions.ts";
import { findTrailingAdverbial, moveAdverbialToStart } from "./adverbials.ts";
import { buildNeverInversion } from "./neverInversion.ts";
import { swapDefiniteArticles } from "./articles.ts";

export interface GenerateOptions {
  /** Generate variants with "in/on the [noun]" → "in/on a/an [noun]". Default: false. */
  articleVariants?: boolean;
}

export function generate(sentence: string, options: GenerateOptions = {}): string[] {
  const results = new Set<string>();
  results.add(sentence);

  const hasNever = /\bhave never\b|\bhas never\b/i.test(sentence);

  // Strip tag question before contraction processing to avoid "is not it?" etc.
  const tagMatch = sentence.match(/,\s+[\w']+\s+\w+\?$/);
  const mainClause = tagMatch ? sentence.slice(0, sentence.length - tagMatch[0].length) : sentence;
  const tagSuffix = tagMatch ? tagMatch[0] : "";

  // Swap ALL contractions in one pass (main clause only)
  if (!hasNever) {
    const pairs = findAllContractionPairs(mainClause);
    if (pairs.length > 0) {
      const swapped = pairs.reduce((s, [expanded, contracted]) => {
        const isExpanded = new RegExp(`\\b${escapeRegex(expanded)}\\b`, "i").test(s);
        return isExpanded
          ? swapAllContractions(s, expanded, contracted)
          : swapAllContractions(s, contracted, expanded);
      }, mainClause);
      if (swapped !== mainClause) results.add(swapped + tagSuffix);
    }
  }

  // Adverbial movement — apply to all current variants
  // Skip direct questions (end with "?" but have no tag): moving an adverbial to the
  // front of a question sounds unnatural ("At 10 AM, is the mail delivered?").
  const isDirectQuestion = sentence.endsWith("?") && !tagSuffix;
  const adverbial = isDirectQuestion ? null : findTrailingAdverbial(mainClause);
  if (adverbial) {
    const punct = sentence.match(/[.!?]$/)?.[0] ?? ".";
    for (const variant of Array.from(results)) {
      if (tagSuffix) {
        // Strip tag, move adverbial, re-attach tag.
        const vMain = variant.slice(0, variant.length - tagSuffix.length) + punct;
        const moved = moveAdverbialToStart(vMain, adverbial, mainClause + punct);
        results.add(moved.replace(/[.!?]$/, "") + tagSuffix);
      } else {
        results.add(moveAdverbialToStart(variant, adverbial, sentence));
      }
    }
  }

  // "never" inversion
  const neverInversion = buildNeverInversion(sentence);
  if (neverInversion) results.add(neverInversion);

  // Article variants: "in/on the [noun]" → "in/on a/an [noun]" (opt-in)
  if (options.articleVariants) {
    for (const variant of Array.from(results)) {
      const swapped = swapDefiniteArticles(variant);
      if (swapped) results.add(swapped);
    }
  }

  return Array.from(results);
}
