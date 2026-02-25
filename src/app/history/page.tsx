import {
  loadA2GrammarSessions,
  loadA2VocabularySessions,
} from "@/content/loaders";
import { HistoryDashboard } from "@/features/history/components/HistoryDashboard";

export default async function HistoryPage() {
  const [vocabResult, grammarResult] = await Promise.all([
    loadA2VocabularySessions(),
    loadA2GrammarSessions(),
  ]);

  return (
    <HistoryDashboard
      vocabSessionsByLevel={{
        A2: vocabResult.sessions.map((session) => ({
          level: session.level.toUpperCase(),
          sessionNumber: session.sessionNumber,
          sessionKey: `${session.level.toUpperCase()}:VOCAB:${session.sessionNumber}`,
        })),
        B1: [],
        C1: [],
      }}
      grammarSessionsByLevel={{
        A2: grammarResult.sessions.map((session) => ({
          level: session.level.toUpperCase(),
          sessionNumber: session.sessionNumber,
          sessionKey: `${session.level.toUpperCase()}:GRAMMAR:${session.sessionNumber}`,
        })),
        B1: [],
        C1: [],
      }}
      warnings={[...vocabResult.warnings, ...grammarResult.warnings]}
    />
  );
}
