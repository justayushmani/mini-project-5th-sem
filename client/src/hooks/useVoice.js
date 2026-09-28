import { useState, useCallback, useRef } from 'react';

/**
 * useVoice — browser-native speech recognition hook.
 * Uses the Web Speech API (SpeechRecognition).
 * 
 * Compatible with Chrome, Edge, and Safari.
 * Falls back gracefully where not supported.
 * 
 * Returns:
 *   - isListening: boolean
 *   - transcript: string (accumulated text)
 *   - isSupported: boolean
 *   - error: string | null
 *   - startListening: fn
 *   - stopListening: fn
 *   - resetTranscript: fn
 */
export function useVoice({ language = 'en-IN', onResult } = {}) {
  const [isListening, setIsListening]   = useState(false);
  const [transcript, setTranscript]     = useState('');
  const [error, setError]               = useState(null);
  const recognitionRef                  = useRef(null);

  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  const isSupported = Boolean(SpeechRecognition);

  const startListening = useCallback(() => {
    if (!isSupported) {
      setError('Speech recognition is not supported in this browser.');
      return;
    }
    setError(null);
    setTranscript('');

    const recognition = new SpeechRecognition();
    recognition.lang = language;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.continuous = false; // Stop after one utterance

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event) => {
      const result = Array.from(event.results)
        .map((r) => r[0].transcript)
        .join('');
      setTranscript(result);
      if (event.results[0].isFinal && onResult) {
        onResult(result);
      }
    };

    recognition.onerror = (event) => {
      setError(`Speech error: ${event.error}`);
      setIsListening(false);
    };

    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
  }, [isSupported, language, onResult]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setError(null);
  }, []);

  return {
    isListening,
    transcript,
    isSupported,
    error,
    startListening,
    stopListening,
    resetTranscript,
  };
}
