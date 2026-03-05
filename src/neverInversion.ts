export function buildNeverInversion(sentence: string): string | null {
  const match = sentence.match(/^(.+?)\s+(have|has)\s+never\s+(.+)([.!?])$/i);
  if (!match) return null;
  const [, subject, aux, rest, punct] = match;
  const lowerSubject =
    subject === "I" ? "I" : subject.charAt(0).toLowerCase() + subject.slice(1);
  return `Never ${aux} ${lowerSubject} ${rest}${punct}`;
}
