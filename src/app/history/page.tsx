import {
  loadA2GrammarSessions,
  loadA2VocabularySessions,
  loadB1GrammarSessions,
} from "@/content/loaders";
import { HistoryDashboard } from "@/features/history/components/HistoryDashboard";
import { buildGrammarSessionKey } from "@/domain/grammar/meta";

export default async function HistoryPage() {
  const [vocabResult, a2GrammarResult, b1GrammarResult] = await Promise.all([
    loadA2VocabularySessions(),
    loadA2GrammarSessions(),
    loadB1GrammarSessions(),
  ]);

  return (
    <HistoryDashboard
      vocabSessionsByLevel={{
        A2: vocabResult.sessions.map((session) => ({
          level: session.level.toUpperCase(),
          partOfSpeech: session.partOfSpeech,
          sessionNumber: session.sessionNumber,
          sessionKey: session.sessionKey,
        })),
        B1: [],
        B2: [],
        C1: [],
      }}
      grammarSessionsByLevel={{
        A2: a2GrammarResult.sessions.map((session) => ({
          level: session.level.toUpperCase(),
          sessionNumber: session.sessionNumber,
          sessionKey: buildGrammarSessionKey(session.level, session.sessionNumber),
        })),
        B1: b1GrammarResult.sessions.map((session) => ({
          level: session.level.toUpperCase(),
          sessionNumber: session.sessionNumber,
          sessionKey: buildGrammarSessionKey(session.level, session.sessionNumber),
        })),
        B2: [],
        C1: [],
      }}
      warnings={[
        ...vocabResult.warnings,
        ...a2GrammarResult.warnings,
        ...b1GrammarResult.warnings,
      ]}
    />
  );
}
