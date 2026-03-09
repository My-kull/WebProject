import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import predefinedPromptText from "../../scripts/prompts/qwen3_predefined_prompt.txt?raw";

const fallbackPrompt =
  "Welcome to the tutorial. Move with W A S D and stay mobile. Aim with your mouse and fire with Space or by clicking. Use Q near the blacksmith to request or refresh a quest.";

const parsedPromptParagraphs = String(predefinedPromptText || "")
  .split(/\n\s*\n/g)
  .map((line) => line.replace(/\s+/g, " ").trim())
  .filter(Boolean);

const TutorialPanel = ({ active = true, onComplete = null, className = "" }) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechError, setSpeechError] = useState("");
  const [voicesReady, setVoicesReady] = useState(false);
  const [usingRecordedAudio, setUsingRecordedAudio] = useState(false);
  const audioRef = useRef(null);
  const ttsTimerRef = useRef(null);
  const ttsCanceledRef = useRef(false);
  const promptParagraphs = useMemo(
    () => (parsedPromptParagraphs.length ? parsedPromptParagraphs : [fallbackPrompt]),
    []
  );
  const prompt = useMemo(() => promptParagraphs.join("\n\n"), [promptParagraphs]);
  const fullAudioSrc = "/audio/tutorial/full-prompt.mp3";

  const stopSpeech = useCallback(() => {
    ttsCanceledRef.current = true;
    if (ttsTimerRef.current) {
      clearTimeout(ttsTimerRef.current);
      ttsTimerRef.current = null;
    }
    window.speechSynthesis?.cancel?.();
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    setIsSpeaking(false);
    setUsingRecordedAudio(false);
  }, []);

  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    const updateVoices = () => setVoicesReady(true);
    updateVoices();
    window.speechSynthesis.addEventListener?.("voiceschanged", updateVoices);
    return () => {
      window.speechSynthesis.removeEventListener?.("voiceschanged", updateVoices);
    };
  }, []);

  const chooseVoice = useCallback(() => {
    const voices = window.speechSynthesis?.getVoices?.() ?? [];
    if (voices.length === 0) return null;

    const preferred = [
      /Google US English/i,
      /Microsoft Aria Online/i,
      /Microsoft Jenny Online/i,
      /Samantha/i,
      /Daniel/i,
      /Karen/i,
      /Moira/i,
    ];

    for (const pattern of preferred) {
      const match = voices.find((v) => pattern.test(v.name));
      if (match) return match;
    }

    const english = voices.find((v) => /^en(-|_)/i.test(v.lang));
    return english || voices[0];
  }, []);

  const normalizeForSpeech = useCallback((text) => {
    return String(text)
      .replace(/\bW\s*A\s*S\s*D\b/gi, "W, A, S, D")
      .replace(/\bWASD\b/g, "W, A, S, D")
      .replace(/\bAI\b/g, "A I")
      .replace(/\bQ\b/g, "Q")
      .replace(/\s+/g, " ")
      .trim();
  }, []);

  const speakWithTTS = useCallback(() => {
    if (!("speechSynthesis" in window)) {
      setSpeechError("Text-to-speech is not supported in this browser.");
      return;
    }

    const voice = chooseVoice();
    const chunks = [];
    for (const paragraph of promptParagraphs) {
      const sentences = paragraph
        .split(/(?<=[.!?])\s+/)
        .map((s) => s.trim())
        .filter(Boolean);

      if (sentences.length === 0) continue;
      sentences.forEach((sentence, idx) => {
        chunks.push({
          sentence: normalizeForSpeech(sentence),
          pauseMs: idx === sentences.length - 1 ? 520 : 210,
        });
      });
    }

    if (chunks.length === 0) return;
    setSpeechError("");
    window.speechSynthesis.cancel();
    ttsCanceledRef.current = false;

    setUsingRecordedAudio(false);
    setIsSpeaking(true);
    const speakAt = (index) => {
      if (ttsCanceledRef.current) return;
      if (index >= chunks.length) {
        setIsSpeaking(false);
        return;
      }

      const { sentence, pauseMs } = chunks[index];
      const utterance = new SpeechSynthesisUtterance(sentence);
      if (voice) utterance.voice = voice;
      utterance.lang = voice?.lang || "en-US";
      utterance.rate = 0.86;
      utterance.pitch = 1.0;
      utterance.volume = 1;
      utterance.onend = () => {
        ttsTimerRef.current = setTimeout(() => speakAt(index + 1), pauseMs);
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        setSpeechError("Speech playback failed. Use Replay Prompt to try again.");
      };
      window.speechSynthesis.speak(utterance);
    };

    speakAt(0);
  }, [chooseVoice, normalizeForSpeech, promptParagraphs]);

  const speakPrompt = useCallback(() => {
    setSpeechError("");
    stopSpeech();
    const audio = audioRef.current;
    const audioSrc = fullAudioSrc;

    if (audio && audioSrc) {
      setUsingRecordedAudio(true);
      setIsSpeaking(true);
      audio.src = audioSrc;
      const playPromise = audio.play();
      if (playPromise?.catch) {
        playPromise.catch(() => {
          setUsingRecordedAudio(false);
          speakWithTTS();
        });
      }
      return;
    }

    speakWithTTS();
  }, [fullAudioSrc, speakWithTTS, stopSpeech]);

  useEffect(() => {
    if (!active) return;
    speakPrompt();

    return () => {
      stopSpeech();
    };
  }, [active, speakPrompt, stopSpeech, voicesReady]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onEnded = () => {
      setIsSpeaking(false);
      setUsingRecordedAudio(false);
    };
    const onError = () => {
      setUsingRecordedAudio(false);
      speakWithTTS();
    };

    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);
    return () => {
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
    };
  }, [speakWithTTS]);

  return (
    <div
      className={`bg-slate-200 dark:bg-slate-700 border-2 border-emerald-400 rounded-lg p-4 transition-colors ${className}`.trim()}
    >
      <h3 className="text-emerald-700 dark:text-emerald-300 font-bold text-lg mb-3">
        Tutorial
      </h3>

      <div className="rounded-md bg-black px-3 py-4 min-h-[88px] border border-slate-500 mb-4">
        <p className="text-white text-sm leading-relaxed whitespace-pre-line">{prompt}</p>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <button
          type="button"
          className="rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-3 py-1.5"
          onClick={speakPrompt}
        >
          Replay Narration
        </button>
        <span className="text-[11px] text-slate-600 dark:text-slate-300">
          {isSpeaking
            ? usingRecordedAudio
              ? "Voice actor playback..."
              : "A.I speaking..."
            : "A.I idle"}
        </span>
      </div>

      {typeof onComplete === "function" ? (
        <button
          type="button"
          className="w-full rounded bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-semibold px-4 py-2 mb-4"
          onClick={onComplete}
        >
          Start Game
        </button>
      ) : null}

      {speechError ? (
        <p className="text-[11px] text-red-600 dark:text-red-300 mb-4">{speechError}</p>
      ) : null}

      <div className="h-36 flex items-center justify-center">
        <audio ref={audioRef} preload="none" className="hidden" />
        <div className="relative h-28 w-44 rotate-90 rounded-md border-2 border-amber-700 bg-amber-600 shadow-[inset_0_0_0_3px_rgba(255,255,255,0.15)]">
          <span className="absolute left-2 bottom-2 rotate-[-34deg] text-xs font-extrabold uppercase tracking-[0.15em] text-amber-100">
            copywrighted
          </span>
        </div>
      </div>
    </div>
  );
};

export default TutorialPanel;
