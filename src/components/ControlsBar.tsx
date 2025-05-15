import React, { useState, useRef } from "react";
import { Button } from "./ui/button";
import { Send, Mic, MicOff } from "lucide-react";

interface ControlsBarProps {
  isReady: boolean;
  isAiThinking: boolean;
  isListening: boolean;
  onMicClick: () => void;
  onSendText?: (text: string) => void;
}

export const ControlsBar: React.FC<ControlsBarProps> = ({
  isReady,
  isAiThinking,
  isListening,
  onMicClick,
  onSendText,
}) => {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSend = () => {
    if (input.trim() && onSendText) {
      onSendText(input.trim());
      setInput("");
      inputRef.current?.focus();
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && input.trim()) {
      handleSend();
    }
  };

  // The microphone button is only active if the input is empty
  // The send button is only active if there is text
  return (
    <div className="w-full px-4 py-3 bg-gray-100 border-t border-gray-200 flex items-center gap-2 dark:bg-gray-900 dark:border-gray-800">
      <input
        ref={inputRef}
        type="text"
        className="flex-1 rounded-xl px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 shadow-sm focus:outline-none"
        placeholder="Type a message"
        value={input}
        onChange={handleInputChange}
        onKeyDown={handleInputKeyDown}
        disabled={!isReady || isAiThinking}
        aria-label="Message input"
      />
      {input.trim() ? (
        <Button
          onClick={handleSend}
          disabled={!isReady || isAiThinking}
          variant="success"
          className="rounded-full w-12 h-12 flex items-center justify-center"
          aria-label="Send message"
        >
          <Send size={28} color="#fff" />
        </Button>
      ) : (
        <Button
          onClick={onMicClick}
          disabled={!isReady || isAiThinking}
          variant={isListening ? "danger" : "success"}
          className="rounded-full w-12 h-12 flex items-center justify-center"
          aria-label={isListening ? "Stop recording" : "Start recording"}
        >
          {isListening ? (
            <MicOff size={28} color="#fff" />
          ) : (
            <Mic size={28} color="#fff" />
          )}
        </Button>
      )}
    </div>
  );
};
