"use client";

import { useStudySettings } from "@/shared/settings/studySettings";

export function StudySettingsPanel() {
  const { settings, setFuriganaEnabled, setShowEnglishMeaning } = useStudySettings();

  return (
    <section className="page-card">
      <div className="stack-row">
        <h2 className="page-title">Study Display Settings</h2>
        <span className="muted-note">Saved locally</span>
      </div>
      <div className="toggle-list" role="group" aria-label="Study display settings">
        <label className="toggle-item">
          <span>
            Furigana on examples
            <span className="muted-inline"> (JP example sentences only)</span>
          </span>
          <input
            type="checkbox"
            checked={settings.furiganaEnabled}
            onChange={(event) => setFuriganaEnabled(event.target.checked)}
          />
        </label>
        <label className="toggle-item">
          <span>
            Show English meaning
            <span className="muted-inline"> (flashcard back only)</span>
          </span>
          <input
            type="checkbox"
            checked={settings.showEnglishMeaning}
            onChange={(event) => setShowEnglishMeaning(event.target.checked)}
          />
        </label>
      </div>
    </section>
  );
}
