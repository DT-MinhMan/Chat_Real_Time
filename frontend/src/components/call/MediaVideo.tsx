import { useEffect, useRef } from "react";

interface MediaVideoProps {
  stream: MediaStream | null;
  muted?: boolean;
  className?: string;
  onBlocked?: () => void;
}

const MediaVideo = ({ stream, muted, className, onBlocked }: MediaVideoProps) => {
  const ref = useRef<HTMLVideoElement>(null);
  const onBlockedRef = useRef(onBlocked);

  // Keep the callback ref updated without triggering effects
  useEffect(() => {
    onBlockedRef.current = onBlocked;
  }, [onBlocked]);

  useEffect(() => {
    const video = ref.current;
    if (!video || !stream) return;

    // Only assign srcObject if it has changed to prevent resetting the stream on re-renders
    if (video.srcObject !== stream) {
      video.srcObject = stream;
    }

    video.play().catch(() => onBlockedRef.current?.());

    const unlock = () => {
      video.play().catch(() => onBlockedRef.current?.());
    };

    window.addEventListener("call:unlock-media", unlock);
    return () => window.removeEventListener("call:unlock-media", unlock);
  }, [stream]);

  return (
    <video
      ref={ref}
      autoPlay
      muted={muted}
      playsInline
      className={className}
    />
  );
};

export default MediaVideo;
