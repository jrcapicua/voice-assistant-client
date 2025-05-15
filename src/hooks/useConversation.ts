import { useState, useCallback, useEffect, useRef } from "react";

export interface Message {
  id: string;
  role: "user" | "assistant";
  type: "text" | "audio";
  content: string; // text or transcript
  audioId?: string; // id in IndexedDB if audio
  timestamp: number;
}

export function useConversation() {
  // Load messages from IndexedDB on start
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesRef = useRef(messages);

  // Error state and last failed request
  const [error, setError] = useState<string | null>(null);
  const [lastFailed, setLastFailed] = useState<{ type: "audio" | "text"; payload: File | Float32Array | string } | null>(null);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);
  useEffect(() => {
    import("../lib/audioDB").then(({ getAllMessages }) => {
      getAllMessages().then((msgs) => {
        setMessages(
          msgs
            .filter((m) => m && m.id)
            .sort((a, b) => a.timestamp - b.timestamp)
        );
      });
    });
  }, []);
  const [isAiThinking, setIsAiThinking] = useState(false);

  // Save each new message in IndexedDB
  useEffect(() => {
    if (messages.length > 0) {
      import("../lib/audioDB").then(({ saveMessage }) => {
        // Save all messages that do not have audioId (new ones)
        const unsaved = messages.filter((m) => !m.audioId);
        unsaved.forEach((msg) => {
          saveMessage(msg);
        });
      });
    }
  }, [messages]);

  const processConversation = useCallback(
    async (audioFile: File) => {
      try {
        setError(null);
        const formData = new FormData();
        formData.append("audio", audioFile);
        if (messagesRef.current.length > 0) {
          formData.append("messageHistory", JSON.stringify(messagesRef.current));
        }
        formData.append("ttsEnabled", "true");
        setIsAiThinking(true);

        const apiUrl = import.meta.env.VITE_API_VOICE_URL;
        if (!apiUrl) throw new Error("VITE_API_VOICE_URL is not set in the environment");
        // Uses VITE_API_VOICE_URL from .env for backend endpoint
        const response = await fetch(apiUrl, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Processing failed");
        }

        setIsAiThinking(false);

        const contentType = response.headers.get("Content-Type");
        if (contentType?.includes("audio")) {
          const userTranscript = decodeURIComponent(response.headers.get("X-Transcript") || "");
          const aiResponseText = decodeURIComponent(response.headers.get("X-Response") || "");
          const userId = crypto.randomUUID();
          const aiId = crypto.randomUUID();
          const userTimestamp = Date.now();
          // Save both user and response audio in the same store
          const audioBlob = await response.blob();
          const { saveMessage } = await import("../lib/audioDB");
          // Always convert to pure Blob for maximum compatibility
          const userBlob = new Blob([audioFile], { type: audioFile.type });
          const userMsg: Message & { audioBlob: Blob } = {
            id: userId,
            role: "user",
            type: "audio",
            content: userTranscript,
            audioBlob: userBlob,
            timestamp: userTimestamp,
          };
          await saveMessage(userMsg);
          // AI timestamp after receiving the response
          const aiTimestamp = Date.now();
          const aiMsg: Message & { audioBlob: Blob } = {
            id: aiId,
            role: "assistant",
            type: "audio",
            content: aiResponseText,
            audioBlob,
            timestamp: aiTimestamp > userTimestamp ? aiTimestamp : userTimestamp + 1,
          };
          await saveMessage(aiMsg);
          setMessages((prev) => [...prev, userMsg, aiMsg]);
          // Do not auto-play the AI voice message
        } else {
          const jsonResponse = await response.json();
          const userId = crypto.randomUUID();
          const aiId = crypto.randomUUID();
          const now = Date.now();
          setMessages((prev) => [
            ...prev,
            {
              id: userId,
              role: "user",
              type: "audio",
              content: jsonResponse.transcript,
              timestamp: now,
            },
            {
              id: aiId,
              role: "assistant",
              type: "text",
              content: jsonResponse.response,
              timestamp: now,
            },
          ]);
        }
      } catch (err: unknown) {
        setIsAiThinking(false);
        setError(
          typeof err === "object" && err !== null && "message" in err
            ? (err as { message?: string }).message || "Ocurrió un error procesando el audio."
            : "Ocurrió un error procesando el audio."
        );
        setLastFailed({ type: "audio", payload: audioFile });
      }
    },
    []
  );

  const processAudio = useCallback(
    async (audioData: Float32Array) => {
      try {
        setError(null);
        // Utility extracted to lib/utils
        const { float32ArrayToWav } = await import("../lib/float32ArrayToWav");
        const wavBlob = float32ArrayToWav(audioData);
        const audioFile = new File([wavBlob], "speech.wav", { type: "audio/wav" });
        await processConversation(audioFile);
      } catch (err: unknown) {
        setError(
          typeof err === "object" && err !== null && "message" in err
            ? (err as { message?: string }).message || "Ocurrió un error procesando el audio."
            : "Ocurrió un error procesando el audio."
        );
        setLastFailed({ type: "audio", payload: audioData });
      }
    },
    [processConversation]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    import("../lib/audioDB").then(({ clearAllMessages }) => {
      clearAllMessages();
    });
  }, []);

  // New: text message processing
  const processText = useCallback(
    async (text: string) => {
      try {
        setError(null);
        setIsAiThinking(true);
        const userId = crypto.randomUUID();
        const aiId = crypto.randomUUID();
        const now = Date.now();
        // Add user message
        setMessages((prev) => [
          ...prev,
          {
            id: userId,
            role: "user",
            type: "text",
            content: text,
            timestamp: now,
          },
        ]);
        // Prepare history for the backend
        const history = [
          ...messagesRef.current,
          {
            id: userId,
            role: "user",
            type: "text",
            content: text,
            timestamp: now,
          },
        ].map(({ role, content }) => ({ role, content }));
        const formData = new FormData();
        formData.append("messageHistory", JSON.stringify(history));
        formData.append("ttsEnabled", "false");
        const apiUrl = import.meta.env.VITE_API_VOICE_URL;
        if (!apiUrl) throw new Error("VITE_API_VOICE_URL is not set in the environment");
        // Uses VITE_API_VOICE_URL from .env for backend endpoint
        const response = await fetch(apiUrl, {
          method: "POST",
          body: formData,
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Processing failed");
        }
        setIsAiThinking(false);
        const contentType = response.headers.get("Content-Type");
        if (contentType?.includes("audio")) {
          const aiResponseText = decodeURIComponent(response.headers.get("X-Response") || "");
          const audioBlob = await response.blob();
          const { saveMessage } = await import("../lib/audioDB");
          const aiMsg: Message & { audioBlob: Blob } = {
            id: aiId,
            role: "assistant",
            type: "audio",
            content: aiResponseText,
            audioBlob,
            timestamp: Date.now(),
          };
          await saveMessage(aiMsg);
          setMessages((prev) => [
            ...prev,
            aiMsg,
          ]);
          // Do not auto-play the AI voice message
        } else {
          const jsonResponse = await response.json();
          setMessages((prev) => [
            ...prev,
            {
              id: aiId,
              role: "assistant",
              type: "text",
              content: jsonResponse.response,
              timestamp: Date.now(),
            },
          ]);
        }
      } catch (err: unknown) {
        setIsAiThinking(false);
        // Remove the last user text message (the one that failed) from state and IndexedDB
        setMessages((prev) => {
          const idx = [...prev].reverse().findIndex(
            (m) => m.role === "user" && m.type === "text" && m.content === text
          );
          if (idx === -1) return prev;
          const realIdx = prev.length - 1 - idx;
          const msgToDelete = prev[realIdx];
          if (msgToDelete?.id) {
            import("../lib/audioDB").then(({ deleteMessage }) => {
              deleteMessage(msgToDelete.id);
            });
          }
          return prev.filter((_, i) => i !== realIdx);
        });
        setError(
          typeof err === "object" && err !== null && "message" in err
            ? (err as { message?: string }).message || "Ocurrió un error procesando el texto."
            : "Ocurrió un error procesando el texto."
        );
        setLastFailed({ type: "text", payload: text });
      }
    },
    []
  );

  // Clear error
  const clearError = useCallback(() => setError(null), []);

  // Retry last failed request
  const retryLast = useCallback(() => {
    if (!lastFailed) return;
    if (lastFailed.type === "audio") {
      // Can be Float32Array or File
      if (lastFailed.payload instanceof Float32Array) {
        processAudio(lastFailed.payload);
      } else if (lastFailed.payload instanceof File) {
        processConversation(lastFailed.payload);
      }
      // If payload is not a valid type, do nothing
    }
    if (lastFailed.type === "text") {
      if (typeof lastFailed.payload === "string") {
        processText(lastFailed.payload);
      }
      // If payload is not a string, do nothing
    }
    setError(null);
    setLastFailed(null);
  }, [lastFailed, processAudio, processConversation, processText]);

  return {
    messages,
    isAiThinking,
    processAudio,
    processText,
    clearMessages,
    error,
    clearError,
    retryLast,
  };
}
