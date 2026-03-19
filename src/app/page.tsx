import {
  loadA2GrammarSessions,
  loadA2VocabularySessions,
  loadB1GrammarSessions,
} from "@/content/loaders";
import { HomeDashboard } from "@/features/home/components/HomeDashboard";
import { buildGrammarSessionKey } from "@/domain/grammar/meta";

export default async function HomePage() {
  const [vocabResult, a2GrammarResult, b1GrammarResult] = await Promise.all([
    loadA2VocabularySessions(),
    loadA2GrammarSessions(),
    loadB1GrammarSessions(),
  ]);

  const availableVocabSessionKeys = vocabResult.sessions.map((session) => session.sessionKey);
  const availableGrammarSessionKeys = [
    ...a2GrammarResult.sessions.map((session) =>
      buildGrammarSessionKey(session.level, session.sessionNumber),
    ),
    ...b1GrammarResult.sessions.map((session) =>
      buildGrammarSessionKey(session.level, session.sessionNumber),
    ),
  ];

  return (
    <HomeDashboard
      availableVocabSessionKeys={availableVocabSessionKeys}
      availableGrammarSessionKeys={availableGrammarSessionKeys}
    />
  );
}
