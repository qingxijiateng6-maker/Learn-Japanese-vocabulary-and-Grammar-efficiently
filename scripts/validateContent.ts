import a2GrammarJson from "../src/content/a2/grammar.json";
import a2VocabularyJson from "../src/content/a2/vocab.json";
import { parseGrammarJson, parseVocabularyJson } from "../src/content/loaders";

type Mode = "validate" | "stats";

function getModeFromArgs(argv: string[]): Mode {
  return argv.includes("--stats") ? "stats" : "validate";
}

async function main() {
  const mode = getModeFromArgs(process.argv.slice(2));

  const vocabResult = parseVocabularyJson(a2VocabularyJson);
  const grammarResult = parseGrammarJson(a2GrammarJson);

  const vocabItemCount = vocabResult.sessions.reduce(
    (count, session) => count + session.items.length,
    0,
  );
  const vocabSessionCount = vocabResult.sessions.length;
  const grammarSessionCount = grammarResult.sessions.length;
  const grammarQuestionsPerSession = grammarResult.sessions.map((session) => ({
    sessionNumber: session.sessionNumber,
    sessionTitle: session.sessionTitle,
    questionCount: session.questions.length,
    topicCount: session.topics.length,
  }));

  const warnings = [...vocabResult.warnings, ...grammarResult.warnings];
  const hasWarnings = warnings.length > 0;

  console.log("Content JSON Summary");
  console.log("====================");
  console.log(`Vocabulary items: ${vocabItemCount}`);
  console.log(`Vocabulary sessions: ${vocabSessionCount}`);
  console.log(`Grammar sessions: ${grammarSessionCount}`);

  if (grammarQuestionsPerSession.length === 0) {
    console.log("Grammar questions per session: none");
  } else {
    console.log("Grammar questions per session:");
    for (const entry of grammarQuestionsPerSession) {
      console.log(
        `- Session ${entry.sessionNumber}: ${entry.questionCount} questions across ${entry.topicCount} topic(s) | ${entry.sessionTitle}`,
      );
    }
  }

  if (warnings.length > 0) {
    console.log("");
    console.log("Warnings:");
    for (const warning of warnings) {
      console.log(`- ${warning}`);
    }
  }

  if (mode === "stats") {
    process.exit(0);
  }

  if (hasWarnings) {
    console.error("");
    console.error("Validation failed: content warnings detected.");
    process.exit(1);
  }

  console.log("");
  console.log("Validation passed.");
  process.exit(0);
}

main().catch((error) => {
  console.error("Content validation script failed.");
  console.error(error);
  process.exit(1);
});
