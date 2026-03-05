// Swaps "in/on the [noun]" → "in/on a/an [noun]" throughout the sentence.
// Covers the narrow case where a prepositional phrase of place uses a definite
// article that is not strictly required (e.g. "in the drawer" → "in a drawer").
// Time nouns (morning, evening, etc.) are excluded — "in the morning" is idiomatic.
// Returns null if no substitution was made.

const EXCLUDED_NOUNS = new Set([
  "morning", "afternoon", "evening", "night",
  "winter", "spring", "summer", "autumn", "fall",
  "weekend", "week", "month", "year", "day",
  "hour", "minute", "second",
]);

export function swapDefiniteArticles(sentence: string): string | null {
  const result = sentence.replace(
    /\b(in|on) the (\w+)/gi,
    (match, prep, noun) => {
      if (EXCLUDED_NOUNS.has(noun.toLowerCase())) return match;
      const article = /^[aeiou]/i.test(noun) ? "an" : "a";
      return `${prep} ${article} ${noun}`;
    }
  );
  return result !== sentence ? result : null;
}
