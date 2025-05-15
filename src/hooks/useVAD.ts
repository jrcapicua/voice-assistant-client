import { useEffect, useRef, useState, useCallback } from "react";
import { MicVAD } from "@ricky0123/vad-web";

interface UseVADOptions {
  onSpeechEnd: (audio: Float32Array) => void;
  onError?: (error: string) => void;
}

export function useVAD({ onSpeechEnd, onError }: UseVADOptions) {
  const [isReady, setIsReady] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const vadRef = useRef<MicVAD | null>(null);
  const isActiveRef = useRef(false);

  // Deferred initialization: instance is only created when calling start()
  useEffect(() => {
    setIsReady(true);
    return () => {
      if (vadRef.current) vadRef.current.destroy();
      setIsListening(false);
      setIsSpeaking(false);
    };
  }, []);

  const start = useCallback(() => {
    if (!isReady) return;
    // If an instance already exists, destroy it before creating a new one
    if (vadRef.current) {
      vadRef.current.destroy();
      vadRef.current = null;
    }
    // Create a new instance of MicVAD
    MicVAD.new({
      onSpeechStart: () => setIsSpeaking(true),
      onSpeechEnd: async (audio) => {
        setIsSpeaking(false);
        if (isActiveRef.current) {
          onSpeechEnd(audio);
          // Destroy the instance after detecting the end of speech
          if (vadRef.current) {
            vadRef.current.destroy();
            vadRef.current = null;
          }
          setIsListening(false);
          isActiveRef.current = false;
        }
      },
    })
      .then((vad) => {
        vadRef.current = vad;
        isActiveRef.current = true;
        vad.start();
        setIsListening(true);
      })
      .catch((e) => {
        const errMsg = e instanceof Error ? e.message : String(e);
        setError(errMsg);
        if (onError) onError(errMsg);
      });
  }, [isReady, onSpeechEnd, onError]);

  const pause = useCallback(() => {
    if (vadRef.current && isReady) {
      isActiveRef.current = false;
      vadRef.current.pause();
      vadRef.current.destroy();
      vadRef.current = null;
      setIsListening(false);
      setIsSpeaking(false);
    }
  }, [isReady]);

  return {
    isReady,
    isListening,
    isSpeaking,
    error,
    start,
    pause,
    setError,
  };
}
