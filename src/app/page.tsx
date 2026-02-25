import { loadA2GrammarSessions, loadA2VocabularySessions } from "@/content/loaders";
import { HomeDashboard } from "@/features/home/components/HomeDashboard";

export default async function HomePage() {
  const [vocabResult, grammarResult] = await Promise.all([
    loadA2VocabularySessions(),
    loadA2GrammarSessions(),
  ]);

  const availableVocabSessionKeys = vocabResult.sessions.map(
    (session) => `A2:VOCAB:${session.sessionNumber}`,
  );
  const availableGrammarSessionKeys = grammarResult.sessions.map(
    (session) => `A2:GRAMMAR:${session.sessionNumber}`,
  );

  return (
    <HomeDashboard
      availableVocabSessionKeys={availableVocabSessionKeys}
      availableGrammarSessionKeys={availableGrammarSessionKeys}
    />
  );
}
