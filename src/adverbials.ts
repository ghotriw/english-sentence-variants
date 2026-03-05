import { escapeRegex } from "./utils.ts";

// Only pure time/frequency adverbials and select adverbial clause patterns.
// Deliberately excludes open-ended "in/on + NP" to avoid phrasal verb false matches.
// Known edge case: "all the while [gerund]" — "while [gerund]" would be incorrectly detected.
export const ADVERBIAL_PATTERNS: Array<RegExp> = [
  /while \w+ing(?:\s+\w+)*/i,                               // while cooking, while cooking dinner, while listening to music
  /at this time tomorrow/i,
  /right now/i,
  /so far/i,
  /after all/i,
  /for long/i,
  /by noon/i,
  /by then/i,
  /by now/i,
  /every (?:(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday) (?:morning|afternoon|evening|night)|morning|afternoon|evening|night|day|week|month|year|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|weekend|semester|term|season|decade|century|summer|winter|spring|autumn|fall|hour|minute|second)/i,
  /this (?:morning|afternoon|evening|night|week|month|year|semester|term|season|decade|century)/i,
  /last (?:morning|afternoon|evening|night|day|week|month|year|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|weekend|semester|term|season|decade|century|summer|winter|spring|autumn|fall|hour|minute|second)/i,
  /next (?:morning|afternoon|evening|night|day|week|month|year|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|weekend|semester|term|season|decade|century|summer|winter|spring|autumn|fall|hour|minute|second)/i,
  /on [A-Z]\w+/,                                              // on Mondays, on Saturday (capitalised day names only)
  /at \d[\d: APMapm]*/,                                       // at 8 PM, at 7:30
  /at (?:noon|midnight|dawn|dusk|sunrise|sunset)/i,
  /in (?:the )?(?:morning|afternoon|evening|night|winter|spring|summer|autumn|fall)/i,
  /in \d{4}/i,
  /\bbefore\b/i,
  /\byet\b/i,
  /\btoday\b/i,
  /\btonight\b/i,
  /\blately\b/i,
  /\brecently\b/i,
  /\balready\b/i,
  /\bnow\b/i,
  /\btomorrow\b/i,
  /\byesterday\b/i,
];

export function findTrailingAdverbial(sentence: string): string | null {
  const body = sentence.replace(/[.!?]$/, "");
  for (const pattern of ADVERBIAL_PATTERNS) {
    const anchored = new RegExp(
      `(?:,? )(${pattern.source})$`,
      pattern.flags.includes("i") ? "i" : ""
    );
    const match = body.match(anchored);
    if (match) return match[1];
  }
  return null;
}

export function moveAdverbialToStart(sentence: string, phrase: string, originalSentence?: string): string {
  const punct = sentence.match(/[.!?]$/)?.[0] ?? ".";
  const body = sentence.replace(/[.!?]$/, "");

  const withoutPhrase = body
    .replace(new RegExp(`,? ${escapeRegex(phrase)}$`, "i"), "")
    .trim();

  const capitalisedPhrase = phrase.charAt(0).toUpperCase() + phrase.slice(1);

  const firstChar = withoutPhrase.charAt(0);
  const secondChar = withoutPhrase.charAt(1);
  const isStandaloneI = firstChar === "I" && (secondChar === " " || secondChar === "'");
  // Detect proper nouns: word appears capitalised INSIDE the original sentence (not at position 0)
  const firstWordClean = withoutPhrase.split(" ")[0].replace(/[^a-zA-Z]/g, "");
  const src = originalSentence ?? sentence;
  const midSentenceMatch = src.slice(1).match(new RegExp("\\b(" + firstWordClean + ")\\b"));
  const isProperNoun = !!midSentenceMatch &&
    midSentenceMatch[1].charAt(0) === midSentenceMatch[1].charAt(0).toUpperCase() &&
    midSentenceMatch[1].charAt(0) !== midSentenceMatch[1].charAt(0).toLowerCase();
  const adjustedRest = (isStandaloneI || isProperNoun)
    ? withoutPhrase
    : firstChar.toLowerCase() + withoutPhrase.slice(1);

  return `${capitalisedPhrase}, ${adjustedRest}${punct}`;
}
