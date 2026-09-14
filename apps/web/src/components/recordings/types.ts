export type RecordingEventType = 'code' | 'chat' | 'presence' | 'terminal';

export interface RecordingEvent {
  id: string;
  timestamp: number; // seconds from recording start
  type: RecordingEventType;
  detail: string;
  metadata?: {
    fileName?: string;
    senderName?: string;
    exitCode?: number;
    action?: string;
  };
}

export interface SessionRecording {
  id: string;
  roomCode: string;
  title: string;
  createdBy: string;
  createdAt: string;
  durationSeconds: number;
  eventsCount: number;
  events: RecordingEvent[];
  initialCode?: string;
  initialFileName?: string;
}
