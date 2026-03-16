import { escapeRegex } from "./utils.ts";

// Contraction map — expanded → contracted
export const CONTRACTIONS: Record<string, string> = {
  "are not": "aren't",
  "cannot": "can't",
  "could not": "couldn't",
  "did not": "didn't",
  "do not": "don't",
  "does not": "doesn't",
  "had not": "hadn't",
  "has not": "hasn't",
  "have not": "haven't",
  "is not": "isn't",
  "must not": "mustn't",
  "need not": "needn't",
  "shall not": "shan't",
  "should not": "shouldn't",
  "was not": "wasn't",
  "were not": "weren't",
  "will not": "won't",
  "would not": "wouldn't",
  "I am": "I'm",
  "I have": "I've",
  "I will": "I'll",
  "I would": "I'd",
  "you are": "you're",
  "you have": "you've",
  "you will": "you'll",
  "he is": "he's",
  "he has": "he's",
  "she is": "she's",
  "she has": "she's",
  "it is": "it's",
  "it has": "it's",
  "we are": "we're",
  "we have": "we've",
  "we will": "we'll",
  "they are": "they're",
  "they have": "they've",
  "they will": "they'll",
};

// Reverse map — contracted → expanded.
// Note: he's/she's/it's are ambiguous (is vs has); last entry in CONTRACTIONS wins.
export const EXPANSIONS: Record<string, string> = Object.fromEntries(
  Object.entries(CONTRACTIONS).map(([k, v]) => [v, k])
);

export function findAllContractionPairs(sentence: string): Array<[string, string]> {
  const found: Array<[string, string]> = [];
  for (const [expanded, contracted] of Object.entries(CONTRACTIONS)) {
    if (new RegExp(`\\b${escapeRegex(expanded)}\\b`, "i").test(sentence)) {
      found.push([expanded, contracted]);
    }
  }
  for (const [contracted, expanded] of Object.entries(EXPANSIONS)) {
    if (new RegExp(`\\b${escapeRegex(contracted)}\\b`, "i").test(sentence)) {
      if (!found.some(([e]) => e === expanded)) {
        found.push([expanded, contracted]);
      }
    }
  }
  return found;
}

export function swapAllContractions(sentence: string, from: string, to: string): string {
  const regex = new RegExp(`\\b${escapeRegex(from)}\\b`, "gi");
  return sentence.replace(regex, (match) => {
    if (match[0] === match[0].toUpperCase() && match[0] !== match[0].toLowerCase()) {
      return to.charAt(0).toUpperCase() + to.slice(1);
    }
    return to;
  });
}
