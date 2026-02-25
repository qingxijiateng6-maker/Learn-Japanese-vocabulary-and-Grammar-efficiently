# Japanese Learning Web App (A2–C1) — Requirements Specification (v1.1 Final)

## 1. Purpose
Build a responsive web application for English speakers to study Japanese **vocabulary** and **grammar** from **CEFR A2 to C1**. The app is structured by level and session, supports two vocabulary study modes, and includes grammar explanations plus practice questions. The app tracks weekly study goals and learning history, syncing progress across devices.

## 2. Target Users
- English-speaking learners of Japanese
- CEFR **A2 / B1 / B2 / C1**
- Users studying on both **PC and smartphone**

## 3. Core Constraints
- Web app (mobile + desktop responsive)
- Keep costs minimal (free tiers preferred)
- Deployment: free hosting acceptable (e.g., Vercel/Netlify)
- Content is provided as **JSON** (curated)

## 4. Authentication & Sync
### 4.1 Authentication
- Users **must sign in with Google** (OAuth).

### 4.2 Cross-device Sync
- All learning progress **must sync across PC + phone** via cloud storage.
- Local caching may be used, but cloud is the source of truth.

## 5. UI / Navigation (Information Architecture)

### 5.1 Main Menu (Home)
Main menu displays:
- Weekly study goal (user-configurable minutes or hours per week)
- **Two separate progress indicators** (Option C):
  1) **Time Progress %** = (time studied this week / weekly goal time) * 100
  2) **Content Progress %** = (content completed this week / content available this week) * 100  
     (See §8.2 for “completed” definition.)
- Navigation buttons: **Vocabulary** | **Grammar**
- A **History** section accessible from the main menu

> Requirement: Study timer must NOT be visible to the user (to avoid stress).

### 5.2 Vocabulary Flow
Home → Vocabulary → Level (A2/B1/B2/C1) → Session list (Session 1..N) → Mode select:
- Flashcard Mode
- 4-Choice Quiz Mode

#### 5.2.1 Vocabulary: Flashcard Mode
Flashcard content:
- Front: Japanese word
- Back:
  - English meaning
  - Example sentence (Japanese)
  - Example sentence translation (English)

Per-card self-grading (saved per user per word):
- Remembered
- Not sure
- Didn’t remember

Review filters (within a session):
- All cards in the session
- Only “Didn’t remember”
- “Not sure” + “Didn’t remember”

Rules:
- No spaced repetition scheduling is required.
- The app only stores grades and enables review filters.

Audio (free):
- Provide a “Play pronunciation” action using **Web Speech API `speechSynthesis` (TTS)**.

#### 5.2.2 Vocabulary: 4-Choice Quiz Mode
- Show the same example sentence used in flashcards, but with a **blank**
- User chooses the correct Japanese word from **4 options**
- Distractors must come from the **same level**
- After answering:
  - Show an explanation area containing:
    - English meaning of the whole sentence
    - The target word in the sentence emphasized in **bold**

Rule:
- The example sentence for flashcards and quiz is identical for each vocabulary item.

### 5.3 Grammar Flow
Home → Grammar → Level (A2/B1/B2/C1) → Session list (Session 1..N) → Explanation → “Go to Practice” → Practice loop

#### 5.3.1 Grammar Explanation Page
- Shows explanation content for grammar items included in the session.
- Includes examples (Japanese + English).

#### 5.3.2 Grammar Practice
- About **20** multiple-choice questions per session (not fixed, “around 20”)
- Each question is **4-choice**
- Flow: **answer 1 question → show explanation → next**
- Choices depend on the question type (particles, verb forms, sentence completions, etc.)

Scoring:
- Score % = (correct answers / total questions) * 100

Completion rule (MUST be clearly written in the app UI):
- A grammar session is considered **“Completed” only if score ≥ 80%**.
- If score < 80%, the session remains **Not Completed** (but the attempt is still recorded).

History:
- Grammar history must store attempts and scores.
- For display, grammar score shown is the **Best score** achieved for that session.

## 6. Study Time Tracking & Weekly Goal

### 6.1 Weekly Goal
- User can set a weekly study target in **minutes or hours**.

### 6.2 Time Measurement
- Timer runs automatically **while the user is on learning screens**:
  - Vocabulary flashcards
  - Vocabulary quiz
  - Grammar explanation
  - Grammar practice
- Timer is **not shown** to the user.

Idle handling (required for accuracy):
- If the browser tab/app is not active (backgrounded) OR there is no interaction for a defined idle threshold, time tracking should pause.
- The idle threshold value is an implementation detail, but behavior must be consistent and testable.

## 7. Learning History & Progress Dashboard

### 7.1 Main Menu History (minimum required)
Show:
- Per-session completion (Vocabulary + Grammar)
- Grammar score % (display **Best score**)
- Vocabulary:
  - **Accuracy %** = quiz correct rate (quiz mode only)
  - Flashcards show a separate **Remembered Rate** (e.g., remembered / total cards) if needed (recommended)

Also show per-level session progress in the following format:

Vocabulary:
- A2 X%
- B1 Y%
- B2 ...
- C1 ...

Grammar:
- A2 Z%
- B1 R%
- B2 ...
- C1 ...

> Progress for each level is based on completed sessions / total sessions in that level.

### 7.2 Streaks
- Not required.

## 8. Definitions

### 8.1 Vocabulary Session Completion
A vocabulary session is considered **Completed** when:
- The user views **all cards once** in **“All cards in the session”** mode.

Quiz mode completion is not required for completion status (quiz is optional).

### 8.2 Weekly Content Progress %
Weekly Content Progress % must reflect the amount of content completed during the current week.

Minimum definition:
- Count vocabulary session completions and grammar session completions that occur within the current week.
- Content Progress % is calculated from:
  - numerator: number of sessions completed this week (vocab + grammar)
  - denominator: number of sessions available to complete (vocab + grammar)  
  (If denominator definition is complex, the UI may instead show “X sessions completed this week” alongside %.)

## 9. Language & Display Options
- App UI language: **English**
- Toggles:
  - Furigana on/off applies to **example sentences only**
  - English meaning show/hide applies to **flashcard back only**

## 10. Content Management & Structure
- Vocabulary and grammar content must be loadable from **JSON**.
- App should be designed so content can be added/expanded later without changing core UI logic.
- Number of sessions per level and number of vocab items per session are not fixed initially.

Future-proofing requirement:
- Support adding **multiple example sentences per word/grammar point later** (design the data model and UI to accommodate expansion, even if v1 uses one sentence).

## 11. Functional Requirements (FR)

### 11.1 Accounts & Sync
- FR-1: User can sign in via Google OAuth.
- FR-2: User progress syncs across devices (PC/phone).

### 11.2 Weekly Goals & Tracking
- FR-3: User can set weekly study goal (minutes/hours).
- FR-4: App tracks study time automatically on learning screens without displaying a timer.
- FR-5: Main menu shows two separate progress indicators: Time Progress % and Content Progress %.

### 11.3 Vocabulary
- FR-6: User can choose level and session.
- FR-7: Flashcards show word front; back shows meaning + JP example + EN translation.
- FR-8: Flashcards support 3-state grading saved per user per word.
- FR-9: User can filter flashcards by review mode:
  - All cards
  - Didn’t remember only
  - Not sure + Didn’t remember
- FR-10: Quiz mode provides 4-choice fill-in-the-blank questions using the same example sentence as flashcards.
- FR-11: Quiz distractors come from the same level.
- FR-12: Quiz explanation shows full EN meaning and highlights the target word in **bold**.
- FR-13: Provide pronunciation playback using Web Speech API **speechSynthesis** (TTS).
- FR-14: Vocabulary session completion is achieved by viewing all cards once in “All cards in the session”.

### 11.4 Grammar
- FR-15: User can open grammar explanation per session.
- FR-16: Practice mode provides ~20 4-choice questions.
- FR-17: Each question shows explanation immediately after answering.
- FR-18: Score % is computed and stored per attempt.
- FR-19: Grammar session completion requires **Best score ≥ 80%** (must be clearly displayed in the app).
- FR-20: History displays grammar score as **Best score**.

### 11.5 History & Level Progress
- FR-21: Main menu history shows per-session completion, grammar best score %, vocab accuracy % (quiz mode), and per-level progress % for vocab and grammar.

## 12. Data Requirements (Schemas)

### 12.1 Vocabulary JSON (v1 minimum)
- id: string
- level: "A2" | "B1" | "B2" | "C1"
- sessionNumber: number
- wordJP: string
- readingKana: string
- meaningEN: string
- exampleJP: string
- exampleEN: string

Future-compatible extension:
- examples: [{ jp: string, en: string }] (support multiple later)

### 12.2 Grammar JSON (v1 minimum)
- id: string
- level: "A2" | "B1" | "B2" | "C1"
- sessionNumber: number
- titleEN: string
- explanationMarkdownEN: string
- examples: [{ jp: string, en: string }]
- questions: [
  {
    id: string,
    promptEN: string,
    promptJP?: string,
    choices: string[4],
    correctIndex: 0|1|2|3,
    explanationEN: string
  }
]

Future-compatible extension:
- multiple examples per grammar point (or per session section)

### 12.3 User Progress (cloud)
- userId (from Google identity)
- weeklyGoalMinutes
- weeklyTimeLog: [{ dateISO, seconds }]
- vocabGrades: { vocabItemId: "remembered" | "not_sure" | "didnt_remember" }
- vocabSessionCompletion: { sessionId: { completedAtISO } }
- vocabQuizAttempts (for accuracy): [{ sessionId, dateISO, correctCount, totalCount, accuracyPercent }]
- grammarAttempts: [{ sessionId, dateISO, correctCount, totalCount, scorePercent }]
- grammarBestScoreBySession: { sessionId: bestScorePercent }
- grammarSessionCompletion: { sessionId: { completed: boolean, completedAtISO? } } (completed iff bestScore >= 80)

## 13. Non-Functional Requirements (NFR)
- NFR-1: Mobile-first responsive design; works well on small screens.
- NFR-2: Fast navigation and low latency on common devices.
- NFR-3: Basic accessibility (keyboard navigation, readable sizes, contrast).
- NFR-4: Privacy: store only what is needed for progress tracking.

## 14. MVP Acceptance Criteria (testable)
1) **Google Login & Sync**
- After signing in on Device A, progress updates are visible on Device B after refresh.

2) **Time Tracking (Invisible Timer)**
- While user is on a learning screen, time increases in weekly time log.
- Time does not increase while the app/tab is backgrounded or idle beyond the threshold.
- No timer UI is shown.

3) **Main Menu Progress**
- Time Progress % displays correctly versus weekly goal.
- Content Progress % displays based on sessions completed in the current week.

4) **Vocabulary Completion**
- Completing “All cards in the session” once marks that vocabulary session as Completed.

5) **Grammar Completion (80% Rule)**
- A grammar session is Completed only when the user achieves **≥ 80%**.
- This rule is shown clearly in the UI (e.g., “Completion requires 80%+”).
- History shows the **Best score**.

6) **History**
- Shows session completion, grammar best score %, vocab quiz accuracy %, and per-level progress % for both vocabulary and grammar.

7) **Toggles**
- Furigana toggle affects example sentences only.
- English meaning hide/show affects flashcard back only.