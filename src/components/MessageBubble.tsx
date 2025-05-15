import React, { useRef, useState } from "react";
import { Play, Pause } from "lucide-react";

interface MessageBubbleProps {
  id: string;
  role: "user" | "assistant";
  type: "text" | "audio";
  content: string; // text or transcript
  audioBlob?: Blob;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  role,
  type,
  content,
  audioBlob,
}) => {
  const isUser = role === "user";
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(100);
  const [showModal, setShowModal] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState<number>(0);

  // Update audio URL when blob changes
  React.useEffect(() => {
    if (audioBlob) {
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setAudioUrl(null);
    }
  }, [audioBlob]);

  // Play audio
  const handlePlay = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    setProgress(0);
    audioRef.current.play();
    setIsPlaying(true);
  };

  // When audio is ready, save duration
  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleStop = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      setProgress(0);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setProgress(100);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current && audioRef.current.duration > 0) {
      const prog = (audioRef.current.currentTime / audioRef.current.duration) * 100;
      setProgress(isNaN(prog) ? 0 : prog);
    }
  };

  // Transcription modal
  const handleBubbleClick = () => {
    if (type === "audio") setShowModal(true);
  };

  const handleCloseModal = () => setShowModal(false);

  // Duration format
  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <>
      <div
        className={[
          "max-w-[75%] px-4 py-2 rounded-2xl text-sm focus:outline-none transition-colors",
          type === "audio" ? "cursor-pointer" : "cursor-default",
          isUser
            ? "bg-green-500 text-white self-end text-right"
            : "bg-gray-100 text-gray-900 self-start text-left dark:bg-gray-800 dark:text-gray-100",
        ].join(" ")}
        tabIndex={0}
        aria-label={isUser ? "Mensaje de usuario" : "Mensaje de AI"}
        onClick={handleBubbleClick}
      >
        <span className="block font-semibold mb-1 text-xs opacity-80">
          {isUser ? "You" : "Assistant"}
        </span>
        {type === "text" && <span>{content}</span>}
        {type === "audio" && (
          <div className="flex flex-row items-center gap-2 w-full">
            {/* Duration on the left */}
            <span className="text-xs font-mono opacity-80 select-none min-w-[40px]">
              {duration > 0 ? formatDuration(duration) : "00:00"}
            </span>
            {/* Progress bar in the center */}
            <div
              className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full shadow-inner mx-2"
              style={{ minWidth: 40 }}
            >
              <div
                className={`h-1.5 rounded-full transition-all duration-200 ${
                  isUser ? "bg-green-700" : "bg-green-500"
                }`}
                style={{
                  width:
                    isPlaying && progress === 0
                      ? "2px"
                      : `${progress}%`,
                  opacity: progress > 0 || isPlaying ? 1 : 0.3,
                }}
              />
            </div>
            {/* Play button on the right */}
            <button
              className="w-8 h-8 rounded-full bg-white border border-gray-300 flex items-center justify-center shadow transition hover:bg-gray-100 active:bg-gray-200"
              onClick={isPlaying ? handleStop : handlePlay}
              aria-label={isPlaying ? "Stop audio" : "Play audio"}
              disabled={!audioBlob}
              style={{ outline: "none" }}
            >
              {isPlaying ? (
                <Pause size={20} color="#16a34a" />
              ) : (
                <Play size={20} color="#16a34a" />
              )}
            </button>
            {/* Hidden audio */}
            {audioUrl && (
              <audio
                ref={audioRef}
                src={audioUrl}
                onEnded={handleAudioEnded}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                style={{ display: "none" }}
              />
            )}
          </div>
        )}
      </div>
      {showModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 px-8"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={handleCloseModal}
        >
          <div
            className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-2">
              <span className="font-bold">
                {isUser ? "You" : "Assistant"}:
              </span>{" "}
              <span className="text-gray-900 dark:text-gray-100">{content}</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
