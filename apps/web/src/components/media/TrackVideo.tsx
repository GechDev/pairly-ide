'use client';

import React, { useEffect, useRef } from 'react';

export interface TrackVideoProps {
  track?: MediaStreamTrack | null;
  stream?: MediaStream | null;
  mirrored?: boolean;
  muted?: boolean;
  className?: string;
  onCanPlay?: () => void;
}

/**
 * Renders a WebRTC video track or media stream onto an HTML5 video element.
 * Directly inspired by CodeX track-video architecture.
 */
export function TrackVideo({
  track,
  stream,
  mirrored = false,
  muted = true,
  className = '',
  onCanPlay,
}: TrackVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (stream) {
      video.srcObject = stream;
    } else if (track) {
      video.srcObject = new MediaStream([track]);
    } else {
      video.srcObject = null;
    }

    return () => {
      if (video) {
        video.srcObject = null;
      }
    };
  }, [track, stream]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted={muted}
      onCanPlay={onCanPlay}
      className={`w-full h-full object-cover select-none pointer-events-none ${
        mirrored ? 'scale-x-[-1]' : ''
      } ${className}`}
    />
  );
}
