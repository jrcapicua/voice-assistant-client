"use client";
import React from "react";
import { ModeToggle } from "./ModeToggle";

import { useVAD } from "../hooks/useVAD";
import { useConversation } from "../hooks/useConversation";
import { Button } from "./ui/button";
import { ControlsBar } from "./ControlsBar";
import { MessagesList } from "./MessagesList";
import { StatusBar } from "./StatusBar";


export default function VoiceAssistant() {
  // Conversation hook
  const {
    messages,
    isAiThinking,
    processAudio,
    processText,
    clearMessages,
    error: conversationError,
    retryLast,
  } = useConversation();

  // Flag to prevent multiple audio submissions
  const isProcessingAudioRef = React.useRef(false);

  // VAD hook: when voice ends, process and pause VAD
  const vad = useVAD({
    onSpeechEnd: (audio) => {
      if (isProcessingAudioRef.current) return;
      isProcessingAudioRef.current = true;
      processAudio(audio)
        .finally(() => {
          pause();
          isProcessingAudioRef.current = false;
        });
    },
    onError: undefined,
  });
  const {
    isReady,
    isListening,
    isSpeaking,
    error: vadError,
    start,
    pause,
  } = vad;
  // setVadError is available if needed: vad.setError

  // Compose error state
  // If there is a conversation error, prioritize it over VAD error
  const error = conversationError || vadError;

  // Mic button handler
  const handleMicClick = () => {
    if (!isReady) return;
    if (isListening) {
      pause();
    } else {
      start();
    }
  };

  // Status text only if there is activity
  const getStatus = (
    isAiThinking: boolean,
    isSpeaking: boolean,
    isListening: boolean
  ): string | null => {
    if (isAiThinking) return "Thinking…";
    if (isSpeaking) return "Voice detected!";
    if (isListening) return "Listening for speech…";
    return null;
  };
  const status = getStatus(isAiThinking, isSpeaking, isListening);

  return (
    <div
      className="
        rounded-lg border-2 dark:border-gray-700
        mx-auto h-screen box-border
        flex flex-col bg-white dark:bg-gray-950
        w-screen sm:w-[500px] md:w-[600px] lg:w-[800px]
      "
    >
      <div className="absolute top-2 right-2 z-10">
        <ModeToggle />
      </div>
      <div className="flex-1 flex flex-col justify-end px-0 pt-2 pb-2 min-h-0">
        {/* Scrollable message list */}
        <div
          className="
            flex-1 overflow-y-auto bg-white dark:bg-gray-950 min-h-0
          "
        /* If you install @tailwindcss/scrollbar, replace with scrollbar-none */
        >
          <MessagesList messages={messages} />
        </div>
      </div>
      {/* Status bar */}
      <StatusBar error={error} status={status} onRetry={conversationError ? retryLast : undefined} />
      {/* Chat-style controls bar */}
      <ControlsBar
        isReady={isReady}
        isAiThinking={isAiThinking}
        isListening={isListening}
        onMicClick={handleMicClick}
        onSendText={processText}
      />
      {/* Button to clear conversation */}
      {messages.length > 0 && (
        <Button
          onClick={clearMessages}
          variant="danger"
          className="w-full rounded-none rounded-b-lg font-bold"
        >
          Clear Conversation
        </Button>
      )}
    </div>
  );
}
