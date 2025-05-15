import { useEffect, useRef, useState } from "react";
import type { UIEvent } from "react";
import { MessageBubble } from "./MessageBubble";
import type { Message } from "../hooks/useConversation";
import { ArrowDown } from "lucide-react";

// Type guard for audioBlob
function hasAudioBlob(msg: Message): msg is Message & { audioBlob: Blob } {
  return "audioBlob" in msg;
}

interface MessagesListProps {
  messages: Message[];
}

export function MessagesList({ messages }: MessagesListProps) {
  const endOfMessagesRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (endOfMessagesRef.current) {
      endOfMessagesRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Check if user is at the bottom
  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const threshold = 40; // px from bottom to consider "at bottom"
    const atBottom =
      target.scrollHeight - target.scrollTop - target.clientHeight < threshold;
    setShowScrollToBottom(!atBottom);
  };

  // When user clicks the button, scroll to bottom
  const scrollToBottom = () => {
    if (endOfMessagesRef.current) {
      endOfMessagesRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  if (messages.length === 0) {
    return <div className="text-center text-gray-400 mt-10">No messages yet</div>;
  }

  return (
    <div className="relative" style={{ height: "100%" }}>
      <div
        ref={containerRef}
        className="flex flex-col gap-3 px-4 overflow-y-auto"
        style={{ maxHeight: "100%", height: "100%" }}
        onScroll={handleScroll}
      >
        {[...messages]
          .sort((a, b) => a.timestamp - b.timestamp)
          .map((message) => (
            <MessageBubble
              key={message.id}
              id={message.id}
              role={message.role}
              type={message.type}
              content={message.content}
              audioBlob={hasAudioBlob(message) ? message.audioBlob : undefined}
            />
          ))}
        <div ref={endOfMessagesRef} />
      </div>
      {showScrollToBottom && (
        <button
          onClick={scrollToBottom}
          className="absolute right-6 bottom-6 bg-white dark:bg-gray-800 shadow-lg rounded-full p-2 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label="Scroll to latest message"
          type="button"
        >
          <ArrowDown className="w-6 h-6 text-gray-700 dark:text-gray-200" />
        </button>
      )}
    </div>
  );
}
