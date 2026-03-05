import { escapeRegex } from "./utils.ts";

// Adverbial patterns grouped by semantic type.
// Deliberately excludes open-ended "in/on + NP" to avoid phrasal verb false matches.
// Known edge case: "all the while/before/after [gerund]" — gerund clauses may be incorrectly detected.
export const ADVERBIAL_PATTERNS: Array<RegExp> = [
  // Gerund clauses (time / condition)
  /while \w+ing(?:\s+\w+)*/i,  // while cooking, while cooking dinner
  /before \w+ing(?:\s+\w+)*/i, // before going to bed, before leaving the house
  /after \w+ing(?:\s+\w+)*/i,  // after finishing homework, after eating dinner

  // Time
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

  // Place (article-less idiomatic forms only)
  /at (?:home|work|school|church|college|university|headquarters|sea|war|peace|rest|ease)/i,

  // Manner (with + known intensifier + noun)
  // Intensifier list prevents matching accompaniment phrases like "with her friend".
  /with (?:great|much|little|extreme|deep|real|genuine|sheer|true|tremendous|remarkable|careful|gentle|firm|quiet|loud|complete|total|absolute|perfect|enormous|incredible|amazing|wonderful|terrible|awful|increasing|growing|obvious|visible|evident|apparent|mixed|renewed|great|heightened|considerable|utmost|special|particular|unusual|extraordinary|rare|surprising|unexpected) \w+/i,

  // Purpose / reason (closed list of purpose-NPs)
  /for (?:fun|pleasure|free|safety|convenience|comfort|practice|exercise|sport|entertainment|relaxation|enjoyment|health|show|profit|effect|emphasis|real|certain|sure|good)/i,
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
