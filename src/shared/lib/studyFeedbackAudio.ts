"use client";

type FeedbackKind = "correct" | "wrong";

const CORRECT_AUDIO_SRC = "/audio/correct-answer.mp3";

let audioContext: AudioContext | null = null;
let correctAudio: HTMLAudioElement | null = null;

function getCorrectAudio(): HTMLAudioElement | null {
  if (typeof window === "undefined" || typeof window.Audio === "undefined") {
    return null;
  }

  if (!correctAudio) {
    correctAudio = new window.Audio(CORRECT_AUDIO_SRC);
    correctAudio.preload = "auto";
  }

  return correctAudio;
}

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined" || typeof window.AudioContext === "undefined") {
    return null;
  }

  if (!audioContext) {
    audioContext = new window.AudioContext();
  }

  return audioContext;
}

function scheduleTone(
  context: AudioContext,
  startAt: number,
  duration: number,
  frequency: number,
  type: OscillatorType,
  gainPeak: number,
) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startAt);

  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(gainPeak, startAt + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

  oscillator.connect(gain);
  gain.connect(context.destination);

  oscillator.start(startAt);
  oscillator.stop(startAt + duration + 0.02);
}

async function playCorrectAudio(): Promise<boolean> {
  const audio = getCorrectAudio();

  if (!audio) {
    return false;
  }

  try {
    audio.pause();
    audio.currentTime = 0;
    await audio.play();
    return true;
  } catch {
    return false;
  }
}

export async function playStudyFeedbackAudio(kind: FeedbackKind): Promise<void> {
  if (kind === "correct") {
    const played = await playCorrectAudio();

    if (played) {
      return;
    }
  }

  const context = getAudioContext();

  if (!context) {
    return;
  }

  if (context.state === "suspended") {
    await context.resume();
  }

  const now = context.currentTime + 0.01;

  if (kind === "correct") {
    scheduleTone(context, now, 0.14, 880, "sine", 0.12);
    scheduleTone(context, now + 0.16, 0.22, 1320, "sine", 0.14);
    return;
  }

  scheduleTone(context, now, 0.16, 220, "square", 0.1);
  scheduleTone(context, now + 0.18, 0.22, 164, "square", 0.1);
}
