import { assertEquals, assertArrayIncludes } from "@std/assert";
import { generate } from "../mod.ts";

// ── Helpers ──

function excludes(variants: string[], unexpected: string, msg?: string): void {
  if (variants.includes(unexpected)) {
    throw new Error(msg ?? `Expected variants NOT to include: "${unexpected}"\nGot: ${JSON.stringify(variants)}`);
  }
}

// ── Always includes original ──

Deno.test("always includes the original sentence", () => {
  const sentence = "She works for a large bank.";
  assertArrayIncludes(generate(sentence), [sentence]);
});

// ── Contraction swapping ──

Deno.test("contracts expanded negation: do not → don't", () => {
  assertArrayIncludes(generate("I do not drink coffee."), ["I don't drink coffee."]);
});

Deno.test("expands contracted negation: don't → do not", () => {
  assertArrayIncludes(generate("I don't drink coffee."), ["I do not drink coffee."]);
});

Deno.test("contracts I am → I'm", () => {
  assertArrayIncludes(generate("I am tired."), ["I'm tired."]);
});

Deno.test("expands I'm → I am", () => {
  assertArrayIncludes(generate("I'm tired."), ["I am tired."]);
});

Deno.test("contracts irregular: will not → won't", () => {
  assertArrayIncludes(generate("I will not help you."), ["I won't help you."]);
});

Deno.test("contracts he is → he's", () => {
  assertArrayIncludes(generate("He is staying with friends this week."), ["He's staying with friends this week."]);
});

Deno.test("contracts they are → they're", () => {
  assertArrayIncludes(generate("They are always late."), ["They're always late."]);
});

Deno.test("contracts I will → I'll", () => {
  assertArrayIncludes(generate("I will call you tonight."), ["I'll call you tonight."]);
});

Deno.test("contracts we will → we'll", () => {
  assertArrayIncludes(generate("We will have finished the task by noon."), ["We'll have finished the task by noon."]);
});

Deno.test("contracts have not → haven't", () => {
  assertArrayIncludes(generate("I have not visited Paris yet."), ["I haven't visited Paris yet."]);
});

// ── Adverbial movement ──

Deno.test("moves 'every morning' to front", () => {
  assertArrayIncludes(generate("I drink coffee every morning."), ["Every morning, I drink coffee."]);
});

Deno.test("moves 'yesterday' to front and lowercases subject", () => {
  assertArrayIncludes(generate("We finished the project yesterday."), ["Yesterday, we finished the project."]);
});

Deno.test("moves 'tonight' to front", () => {
  assertArrayIncludes(generate("I will call you tonight."), ["Tonight, I will call you."]);
});

Deno.test("moves 'now' to front", () => {
  assertArrayIncludes(generate("I am writing a report now."), ["Now, I am writing a report."]);
});

Deno.test("moves 'by noon' to front", () => {
  assertArrayIncludes(generate("We will have finished the task by noon."), ["By noon, we will have finished the task."]);
});

Deno.test("moves 'at 8 PM' to front", () => {
  assertArrayIncludes(generate("The train leaves at 8 PM."), ["At 8 PM, the train leaves."]);
});

Deno.test("moves 'this week' to front", () => {
  assertArrayIncludes(generate("He is staying with friends this week."), ["This week, he is staying with friends."]);
});

Deno.test("moves 'yet' to front", () => {
  assertArrayIncludes(generate("I have not visited Paris yet."), ["Yet, I have not visited Paris."]);
});

Deno.test("preserves 'I' capitalisation after adverbial move", () => {
  assertArrayIncludes(generate("I drink coffee every morning."), ["Every morning, I drink coffee."]);
});

Deno.test("preserves '!' after adverbial move", () => {
  assertArrayIncludes(generate("You are always losing your keys!"), []);
  // keys! has no trailing adverbial — ensure no crash on exclamation mark
  assertArrayIncludes(generate("I will call you tonight!"), ["Tonight, I will call you!"]);
});

Deno.test("does not move 'in the east' (not whitelisted)", () => {
  assertEquals(generate("The sun rises in the east."), ["The sun rises in the east."]);
});

Deno.test("does not move adverbial from sentence start", () => {
  assertEquals(generate("Now I understand."), ["Now I understand."]);
});

// ── Never inversion ──

Deno.test("inverts 'I have never'", () => {
  assertArrayIncludes(generate("I have never visited Paris."), ["Never have I visited Paris."]);
});

Deno.test("inverts 'She has never'", () => {
  assertArrayIncludes(generate("She has never been there."), ["Never has she been there."]);
});

Deno.test("inverts 'They have never'", () => {
  assertArrayIncludes(generate("They have never seen this."), ["Never have they seen this."]);
});

Deno.test("skips contraction when 'have never' present", () => {
  const variants = generate("I have never visited Paris.");
  excludes(variants, "I've never visited Paris.", "'have never' should block contraction");
});

Deno.test("skips contraction when 'has never' present", () => {
  const variants = generate("She has never been there.");
  excludes(variants, "She's never been there.", "'has never' should block contraction");
});

// ── Combined transformations ──

Deno.test("contraction + adverbial: I am ... now", () => {
  assertArrayIncludes(generate("I am writing a report now."), [
    "I'm writing a report now.",
    "I am writing a report now.",
    "Now, I am writing a report.",
    "Now, I'm writing a report.",
  ]);
});

Deno.test("contraction + adverbial: will not ... tonight", () => {
  assertArrayIncludes(generate("I will not call you tonight."), [
    "I won't call you tonight.",
    "I will not call you tonight.",
    "Tonight, I will not call you.",
    "Tonight, I won't call you.",
  ]);
});

Deno.test("contraction + adverbial: he is ... this week", () => {
  assertArrayIncludes(generate("He is staying with friends this week."), [
    "He's staying with friends this week.",
    "He is staying with friends this week.",
    "This week, he is staying with friends.",
    "This week, he's staying with friends.",
  ]);
});

Deno.test("contraction + adverbial: will ... by noon", () => {
  assertArrayIncludes(generate("We will have finished the task by noon."), [
    "We'll have finished the task by noon.",
    "We will have finished the task by noon.",
    "By noon, we will have finished the task.",
    "By noon, we'll have finished the task.",
  ]);
});

Deno.test("contraction + adverbial: have not ... yet", () => {
  assertArrayIncludes(generate("I have not visited Paris yet."), [
    "I haven't visited Paris yet.",
    "I have not visited Paris yet.",
    "Yet, I have not visited Paris.",
    "Yet, I haven't visited Paris.",
  ]);
});

// ── Tag questions ──

Deno.test("does not expand contraction inside tag question", () => {
  excludes(
    generate("The mail is delivered at 10 AM, isn't it?"),
    "The mail is delivered at 10 AM, is not it?",
    "tag question contraction must not be expanded"
  );
});

Deno.test("expands contraction in main clause when tag is positive", () => {
  assertArrayIncludes(
    generate("She doesn't work hard, does she?"),
    ["She does not work hard, does she?"]
  );
});

Deno.test("moves adverbial to front in sentence with tag question", () => {
  assertArrayIncludes(
    generate("Your sister cooks dinner on Tuesdays, doesn't she?"),
    ["On Tuesdays, your sister cooks dinner, doesn't she?"]
  );
});

Deno.test("moves 'every Saturday morning' to front", () => {
  assertArrayIncludes(
    generate("He cleans his room every Saturday morning."),
    ["Every Saturday morning, he cleans his room."]
  );
});

Deno.test("moves 'every Saturday morning' to front with tag question", () => {
  assertArrayIncludes(
    generate("He cleans his room every Saturday morning, doesn't he?"),
    ["Every Saturday morning, he cleans his room, doesn't he?"]
  );
});

Deno.test("adverbial + contraction in main clause with tag question", () => {
  assertArrayIncludes(
    generate("She doesn't cook dinner on Tuesdays, does she?"),
    [
      "She does not cook dinner on Tuesdays, does she?",
      "On Tuesdays, she doesn't cook dinner, does she?",
      "On Tuesdays, she does not cook dinner, does she?",
    ]
  );
});

// ── While-gerund adverbial clauses ──

Deno.test("moves 'while cooking' to front", () => {
  assertArrayIncludes(
    generate("He listens to the radio while cooking."),
    ["While cooking, he listens to the radio."]
  );
});

Deno.test("moves 'while cooking dinner' to front", () => {
  assertArrayIncludes(
    generate("He listens to the radio while cooking dinner."),
    ["While cooking dinner, he listens to the radio."]
  );
});

Deno.test("moves 'while listening to music' to front", () => {
  assertArrayIncludes(
    generate("She studies while listening to music."),
    ["While listening to music, she studies."]
  );
});

Deno.test("moves 'while cooking dinner' to front with tag question", () => {
  assertArrayIncludes(
    generate("He listens to the radio while cooking dinner, doesn't he?"),
    ["While cooking dinner, he listens to the radio, doesn't he?"]
  );
});

// ── No-op sentences ──

Deno.test("no variants for sentence with no contractions, adverbials, or never", () => {
  assertEquals(generate("The sun rises in the east."), ["The sun rises in the east."]);
});

Deno.test("no variants for imperative with no whitelisted adverbial", () => {
  assertEquals(generate("Mix the flour with the eggs."), ["Mix the flour with the eggs."]);
});
