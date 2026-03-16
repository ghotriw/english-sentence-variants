import { escapeRegex } from "./utils.ts";
import { EXPANSIONS, findAllContractionPairs, swapAllContractions } from "./contractions.ts";
import { findTrailingAdverbial, moveAdverbialToStart } from "./adverbials.ts";
import { buildNeverInversion } from "./neverInversion.ts";

export function generate(sentence: string): string[] {
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
      const isInvertedQuestion = sentence.endsWith("?") && !tagSuffix;
      const swapped = pairs.reduce((s, [expanded, contracted]) => {
        const isExpanded = new RegExp(`\\b${escapeRegex(expanded)}\\b`, "i").test(s);
        // Skip expanding a contraction that starts an inverted question —
        // handled separately below with word reorder.
        if (!isExpanded && isInvertedQuestion &&
            new RegExp(`^${escapeRegex(contracted)}\\b`, "i").test(s)) {
          return s;
        }
        return isExpanded
          ? swapAllContractions(s, expanded, contracted)
          : swapAllContractions(s, contracted, expanded);
      }, mainClause);
      if (swapped !== mainClause) results.add(swapped + tagSuffix);
    }

    // Inverted questions: "Won't you go?" → "Will you not go?"
    // Only safe when a pronoun immediately follows the contraction.
    if (sentence.endsWith("?") && !tagSuffix) {
      const pronouns = "I|you|he|she|it|we|they";
      const invertedMatch = mainClause.match(
        new RegExp(`^([\\w']+)\\s+(${pronouns})\\b\\s*(.*)$`, "i")
      );
      if (invertedMatch) {
        const [, contrWord, pronoun, rest] = invertedMatch;
        const expanded = EXPANSIONS[contrWord.toLowerCase()];
        if (expanded) {
          const aux = expanded === "cannot"
            ? "can"
            : expanded.replace(/ not$/, "");
          const casedAux = contrWord[0] === contrWord[0].toUpperCase()
            ? aux.charAt(0).toUpperCase() + aux.slice(1)
            : aux;
          const reordered = `${casedAux} ${pronoun.toLowerCase()} not ${rest}`;
          results.add(reordered);
        }
      }
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

  return Array.from(results);
}
