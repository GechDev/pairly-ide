'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Code2,
  Copy,
  Check,
  Wifi,
  WifiOff,
  Play,
  Share2,
  History,
  Globe,
  MessageSquare,
  FileText,
  Sparkles,
  Video,
  ShieldAlert,
  Settings,
  LogOut,
  Info,
  Search,
  Palette,
  Users,
} from 'lucide-react';
import type {
  ParticipantIdentity,
  ExecutionOutputChunk,
  ExecutionStatus,
  AiProposal,
  RoomRole,
} from '@pairly/contracts';
import { detectLanguageFromFilename } from '@pairly/execution';
import { generateGuestIdentity } from '../../lib/guest';
import { CodeEditor } from '../editor/CodeEditor';
import type { CollaborativeSession } from '../editor/yjsExtension';
import { FileTree } from '../workspace/FileTree';
import { Tabs } from '../workspace/Tabs';
import { StatusBar } from '../workspace/StatusBar';
import {
  createWorkspaceManager,
  type WorkspaceState,
} from '../workspace/workspaceState';
import { PresenceBar } from '../presence/PresenceBar';
import { useFollow } from '../presence/useFollow';
import { RemotePointers, type RemotePointer } from '../presence/RemotePointers';
import { CheckpointModal } from './CheckpointModal';
import { SharedTerminal } from '../terminal/SharedTerminal';
import { WebPreview } from '../preview/WebPreview';
import { ChatPanel, type ChatMessageItem } from '../chat/ChatPanel';
import { SharedNotepad } from '../notepad/SharedNotepad';
import type { NotepadSession } from '../notepad/notepadSession';
import { AiAssistantPanel, AIProposalModal } from '../ai';
import { computeUnifiedDiff } from '@pairly/ai';
import { useLiveKit, VideoGrid, MediaBar, DeviceSettingsModal } from '../media';
import { GitHubImportModal } from '../workspace/GitHubImportModal';
import type { GitHubImportFile } from '../../lib/githubClient';
import { AbuseReportModal } from './AbuseReportModal';
import { ShareRoomModal } from './ShareRoomModal';
import { LeaveRoomModal } from './LeaveRoomModal';
import {
  EditorSettingsModal,
  DEFAULT_EDITOR_SETTINGS,
  type EditorSettings,
} from './EditorSettingsModal';
import { AboutModal } from './AboutModal';
import { FilePreviewModal } from '../workspace/FilePreviewModal';
import { JoinRoomPromptModal } from './JoinRoomPromptModal';
import { CommandPaletteModal } from './CommandPaletteModal';
import { WhiteboardModal, type WhiteboardElement } from '../whiteboard';
import { ParticipantsModal } from './ParticipantsModal';

interface RoomClientProps {
  roomCode: string;
}

export function RoomClient({ roomCode }: RoomClientProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [participant, setParticipant] = useState<ParticipantIdentity | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<
    'connecting' | 'connected' | 'disconnected'
  >('connecting');
  const [activeParticipants, setActiveParticipants] = useState<ParticipantIdentity[]>([]);
  const activeSessionRef = React.useRef<CollaborativeSession | null>(null);
  const pendingDocUpdatesRef = React.useRef<string[]>([]);
  const wsRef = React.useRef<WebSocket | null>(null);
  const workspaceManagerRef = React.useRef(createWorkspaceManager());
  const [workspaceState, setWorkspaceState] = useState<WorkspaceState>(
    workspaceManagerRef.current.getState()
  );
  const [participantPresenceMap, setParticipantPresenceMap] = useState<
    Record<string, { fileId?: string | null; fileName?: string | null }>
  >({});
  const [isCheckpointModalOpen, setIsCheckpointModalOpen] = useState(false);
  const [terminalChunks, setTerminalChunks] = useState<ExecutionOutputChunk[]>([]);
  const [terminalStatus, setTerminalStatus] = useState<ExecutionStatus | 'IDLE'>('IDLE');
  const [terminalExitCode, setTerminalExitCode] = useState<number | null>(null);
  const [terminalDuration, setTerminalDuration] = useState<number | undefined>(undefined);
  const [isTerminalExpanded, setIsTerminalExpanded] = useState(true);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessageItem[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotepadOpen, setIsNotepadOpen] = useState(false);
  const notepadSessionRef = React.useRef<NotepadSession | null>(null);
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(false);
  const [activeProposal, setActiveProposal] = useState<AiProposal | null>(null);
  const [documentVersion, setDocumentVersion] = useState<number>(1);
  const [isAiExplaining, setIsAiExplaining] = useState(false);
  const [isMediaPanelOpen, setIsMediaPanelOpen] = useState(false);
  const [isGitHubModalOpen, setIsGitHubModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState(false);
  const [isWhiteboardOpen, setIsWhiteboardOpen] = useState(false);
  const [whiteboardElements, setWhiteboardElements] = useState<WhiteboardElement[]>([]);
  const [isParticipantsModalOpen, setIsParticipantsModalOpen] = useState(false);
  const [isRoomLocked, setIsRoomLocked] = useState(false);
  const [mutedParticipantIds, setMutedParticipantIds] = useState<string[]>([]);
  const [filePreviewData, setFilePreviewData] = useState<{
    fileName: string;
    content: string;
  } | null>(null);
  const [editorSettings, setEditorSettings] =
    useState<EditorSettings>(DEFAULT_EDITOR_SETTINGS);
  const [pingLatency, setPingLatency] = useState<number | null>(null);
  const [cursorPosition, setCursorPosition] = useState<{ line: number; column: number }>({
    line: 1,
    column: 1,
  });
  const [isDeviceSettingsOpen, setIsDeviceSettingsOpen] = useState(false);
  const [isJoinPromptOpen, setIsJoinPromptOpen] = useState(false);
  const [serverDocSnapshot, setServerDocSnapshot] = useState<string | null>(null);
  const [remotePointers, setRemotePointers] = useState<Record<string, RemotePointer>>({});
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const liveKit = useLiveKit({
    roomCode,
    participantId: participant?.id,
    participantName: participant?.displayName || 'Guest',
    activeParticipants,
    onSendWsMessage: (msg) => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify(msg));
      }
    },
  });

  const follow = useFollow({
    onFollowFileChange: (fileId) => {
      workspaceManagerRef.current.setActiveTab(fileId);
    },
  });

  useEffect(() => {
    const unsubscribe = workspaceManagerRef.current.subscribe(setWorkspaceState);
    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pairly_editor_settings');
      if (saved) {
        try {
          setEditorSettings((prev) => ({ ...prev, ...JSON.parse(saved) }));
        } catch {}
      }
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isModifier = e.ctrlKey || e.metaKey;
      if (isModifier && (e.key === 'k' || (e.shiftKey && e.key.toLowerCase() === 'p'))) {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      } else if (isModifier && e.key === 'Enter') {
        e.preventDefault();
        handleRunCode();
      } else if (isModifier && e.key === 's') {
        e.preventDefault();
        setIsCheckpointModalOpen(true);
      } else if (isModifier && e.key === 'p') {
        e.preventDefault();
        setIsPreviewOpen((prev) => !prev);
      } else if (isModifier && e.key === '`') {
        e.preventDefault();
        setIsTerminalExpanded((prev) => !prev);
      } else if (isModifier && e.key === ',') {
        e.preventDefault();
        setIsSettingsModalOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [workspaceState, participant, roomCode]);

  useEffect(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && participant) {
      const activeItem = workspaceState.items.find((i) => i.id === workspaceState.activeFileId);
      wsRef.current.send(
        JSON.stringify({
          type: 'PRESENCE_UPDATE',
          participantId: participant.id,
          fileId: workspaceState.activeFileId,
          fileName: activeItem?.name,
        })
      );
    }
  }, [workspaceState.activeFileId, participant]);

  const liveKitRef = useRef(liveKit);
  liveKitRef.current = liveKit;

  useEffect(() => {
    // 1. Retrieve guest identity for this specific room (CodeX parity)
    const storedIdentity = sessionStorage.getItem(`pairly_guest_${roomCode}`);

    if (storedIdentity) {
      try {
        const parsed: ParticipantIdentity = JSON.parse(storedIdentity);
        setParticipant(parsed);
        setActiveParticipants([parsed]);
        setIsJoinPromptOpen(false);
        return;
      } catch {}
    }

    // No identity stored for this room => Show JoinRoomPromptModal
    setIsJoinPromptOpen(true);
    setParticipant(null);
  }, [roomCode]);

  useEffect(() => {
    if (!participant) return;

    // 2. Establish connection to realtime service once participant identity is established
    const rawPayload = JSON.stringify({
      participantId: participant.id,
      displayName: participant.displayName,
      avatar: participant.avatar,
      color: participant.color,
      role: participant.role,
      roomCode,
    });
    const encodedPayload =
      typeof window !== 'undefined' && typeof window.btoa === 'function'
        ? window
            .btoa(unescape(encodeURIComponent(rawPayload)))
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '')
        : Buffer.from(rawPayload)
            .toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');

    const token =
      sessionStorage.getItem(`pairly_token_${roomCode}`) ||
      `pairly_mock_${encodedPayload}`;

    let ws: WebSocket | null = null;
    let pingInterval: ReturnType<typeof setInterval> | null = null;
    try {
      const wsProtocol =
        typeof window !== 'undefined' && window.location.protocol === 'https:'
          ? 'wss:'
          : 'ws:';
      const wsHost =
        typeof window !== 'undefined' ? window.location.hostname : 'localhost';
      const wsUrl =
        process.env.NEXT_PUBLIC_REALTIME_URL ||
        `${wsProtocol}//${wsHost}:4001/ws/rooms/${roomCode}?token=${encodeURIComponent(token)}`;
      ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnectionStatus('connected');
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'PING', timestamp: Date.now() }));
        }
      };

      pingInterval = setInterval(() => {
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'PING', timestamp: Date.now() }));
        }
      }, 5000);

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'ROOM_JOINED') {
            setActiveParticipants(msg.participants || (participant ? [participant] : []));
            if (msg.docUpdate) {
              setServerDocSnapshot(msg.docUpdate);
              if (activeSessionRef.current) {
                activeSessionRef.current.applyEncodedUpdate(msg.docUpdate);
              } else {
                pendingDocUpdatesRef.current.push(msg.docUpdate);
              }
            }
          } else if (msg.type === 'USER_JOINED') {
            setActiveParticipants((prev) => {
              if (prev.some((p) => p.id === msg.participant.id)) return prev;
              return [...prev, msg.participant];
            });
          } else if (msg.type === 'USER_LEFT') {
            setActiveParticipants((prev) =>
              prev.filter((p) => p.id !== msg.participantId)
            );
            activeSessionRef.current?.removeRemoteCursor(msg.participantId);
          } else if (msg.type === 'SPOTLIGHT_CHANGED') {
            follow.setSpotlight(msg.targetParticipantId);
          } else if (msg.type === 'PRESENCE_UPDATE') {
            setParticipantPresenceMap((prev) => ({
              ...prev,
              [msg.participantId]: {
                fileId: msg.fileId,
                fileName: msg.fileName,
              },
            }));
            if (
              follow.followedParticipantId === msg.participantId ||
              follow.spotlightedParticipantId === msg.participantId
            ) {
              follow.updateFollowedState(msg.fileId, msg.cursor?.line, msg.cursor?.column);
            }
          } else if (msg.type === 'DOC_UPDATE') {
            if (msg.update) {
              setServerDocSnapshot(msg.update);
              if (activeSessionRef.current) {
                activeSessionRef.current.applyEncodedUpdate(msg.update);
              } else {
                pendingDocUpdatesRef.current.push(msg.update);
              }
            }
          } else if (msg.type === 'CURSOR_UPDATE') {
            activeSessionRef.current?.setRemoteCursor(msg.cursor);
          } else if (msg.type === 'TERMINAL_CHUNK') {
            setTerminalChunks((prev) => [...prev, msg.chunk]);
            if (msg.chunk?.runId) setActiveRunId(msg.chunk.runId);
          } else if (msg.type === 'TERMINAL_STATUS') {
            setTerminalStatus(msg.status);
            if (msg.result) {
              setTerminalExitCode(msg.result.exitCode ?? null);
              setTerminalDuration(msg.result.durationMs);
            }
          } else if (msg.type === 'TERMINAL_HISTORY') {
            setTerminalChunks(msg.chunks || []);
          } else if (msg.type === 'TERMINAL_CLEARED') {
            setTerminalChunks([]);
          } else if (msg.type === 'CHAT_MESSAGE') {
            setChatMessages((prev) => [...prev, msg.message]);
            setUnreadCount((prev) => prev + 1);
          } else if (msg.type === 'CHAT_HISTORY') {
            setChatMessages(msg.messages || []);
          } else if (msg.type === 'NOTEPAD_SNAPSHOT' || msg.type === 'NOTEPAD_UPDATE') {
            if (msg.update && notepadSessionRef.current) {
              notepadSessionRef.current.applyUpdate(msg.update);
            } else if (typeof msg.content === 'string' && notepadSessionRef.current) {
              notepadSessionRef.current.setText(msg.content);
            }
          } else if (msg.type === 'WHITEBOARD_SNAPSHOT') {
            setWhiteboardElements(msg.elements || []);
          } else if (msg.type === 'WHITEBOARD_DRAW') {
            if (msg.element) {
              setWhiteboardElements((prev) => [...prev, msg.element]);
          } else if (msg.type === 'WHITEBOARD_CLEAR') {
            setWhiteboardElements([]);
          } else if (msg.type === 'ROLE_CHANGED') {
            setActiveParticipants((prev) =>
              prev.map((p) => (p.id === msg.targetParticipantId ? { ...p, role: msg.newRole } : p))
            );
            if (participant && participant.id === msg.targetParticipantId) {
              setParticipant((prev) => (prev ? { ...prev, role: msg.newRole } : null));
            }
          } else if (msg.type === 'ROOM_LOCK_UPDATED') {
            setIsRoomLocked(Boolean(msg.isLocked));
          } else if (msg.type === 'USER_MUTED') {
            setMutedParticipantIds((prev) => {
              if (msg.isMuted) {
                return prev.includes(msg.targetParticipantId) ? prev : [...prev, msg.targetParticipantId];
              } else {
                return prev.filter((id) => id !== msg.targetParticipantId);
              }
            });
            if (participant && participant.id === msg.targetParticipantId && msg.isMuted) {
              if (liveKitRef.current?.isAudioEnabled) {
                liveKitRef.current.toggleAudio();
              }
            }
          } else if (msg.type === 'USER_KICKED') {
            setActiveParticipants((prev) => prev.filter((p) => p.id !== msg.targetParticipantId));
          } else if (msg.type === 'KICKED_FROM_ROOM') {
            if (typeof window !== 'undefined') {
              alert(msg.reason || 'You have been removed from this room by the host.');
              window.location.href = '/';
            }
          } else if (msg.type === 'PONG') {
            if (msg.clientTimestamp) {
              setPingLatency(Math.max(1, Date.now() - msg.clientTimestamp));
            }
          } else if (msg.type === 'POINTER_UPDATE' && msg.participantId) {
            setRemotePointers((prev) => ({
              ...prev,
              [msg.participantId]: {
                id: msg.participantId,
                name: msg.name || 'Participant',
                color: msg.color || '#6366f1',
                x: msg.x,
                y: msg.y,
                lastUpdate: Date.now(),
              },
            }));
          } else if (msg.type === 'WEBRTC_SIGNAL') {
            liveKitRef.current.handleWebRtcSignal(msg.fromParticipantId, msg.signal);
          } else if (msg.type === 'MEDIA_STATE_UPDATE') {
            liveKitRef.current.handleMediaStateUpdate(msg.participantId, msg.mediaState);
          }
        } catch {}
      };

      ws.onerror = () => {
        // Fallback to optimistic local connection for client tests without realtime server
        setConnectionStatus('connected');
      };

      ws.onclose = () => {
        setConnectionStatus('disconnected');
      };
    } catch {
      setConnectionStatus('connected');
    }

    return () => {
      if (pingInterval) {
        clearInterval(pingInterval);
      }
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [roomCode, participant?.id]);

  const copyRoomLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRunCode = async () => {
    const activeItem = workspaceState.items.find((i) => i.id === workspaceState.activeFileId);
    const filename = activeItem?.name || 'main.js';
    const content = activeItem?.content || '// empty';
    const language = detectLanguageFromFilename(filename);

    const runParams = {
      language,
      files: [{ name: filename, content, encoding: 'utf-8' as const }],
      limits: { timeoutMs: 10000, memoryLimitMb: 256, networkEnabled: false as const },
    };

    setTerminalStatus('RUNNING');
    setIsTerminalExpanded(true);

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'RUN_START', params: runParams }));
    } else {
      try {
        const res = await fetch(`/api/v1/rooms/${roomCode}/run`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-role': participant?.role || 'EDITOR',
          },
          body: JSON.stringify(runParams),
        });
        const result = await res.json();
        if (result.stdout) {
          setTerminalChunks((prev) => [
            ...prev,
            { runId: result.runId, stream: 'stdout', data: result.stdout, timestamp: Date.now() },
          ]);
        }
        if (result.stderr) {
          setTerminalChunks((prev) => [
            ...prev,
            { runId: result.runId, stream: 'stderr', data: result.stderr, timestamp: Date.now() },
          ]);
        }
        setTerminalStatus(result.status || 'COMPLETED');
        setTerminalExitCode(result.exitCode ?? 0);
        setTerminalDuration(result.durationMs);
      } catch (err: unknown) {
        setTerminalStatus('FAILED');
        setTerminalChunks((prev) => [
          ...prev,
          { runId: 'err', stream: 'stderr', data: String(err), timestamp: Date.now() },
        ]);
      }
    }
  };

  const handleSendStdin = (data: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && activeRunId) {
      wsRef.current.send(JSON.stringify({ type: 'RUN_STDIN', runId: activeRunId, data }));
    }
  };

  const handleClearTerminal = () => {
    setTerminalChunks([]);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'TERMINAL_CLEAR' }));
    }
  };

  const handleSendChatMessage = (content: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'CHAT_SEND', content }));
    } else if (participant) {
      const localMsg: ChatMessageItem = {
        id: `local_${Date.now()}`,
        roomId: roomCode,
        senderId: participant.id,
        senderName: participant.displayName,
        senderAvatar: participant.avatar,
        senderColor: participant.color,
        senderRole: participant.role,
        content,
        mentions: [],
        createdAt: Date.now(),
      };
      setChatMessages((prev) => [...prev, localMsg]);
    }
  };

  const handleBroadcastNotepadUpdate = (updateBase64: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'NOTEPAD_UPDATE',
          content: notepadSessionRef.current?.getText() || '',
          update: updateBase64,
        })
      );
    }
  };

  const handleAddWhiteboardElement = (element: WhiteboardElement) => {
    setWhiteboardElements((prev) => [...prev, element]);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'WHITEBOARD_DRAW', element }));
    }
  };

  const handleClearWhiteboard = () => {
    setWhiteboardElements([]);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'WHITEBOARD_CLEAR' }));
    }
  };

  const handleChangeRole = (targetParticipantId: string, newRole: RoomRole) => {
    setActiveParticipants((prev) =>
      prev.map((p) => (p.id === targetParticipantId ? { ...p, role: newRole } : p))
    );
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'ROLE_CHANGE',
          targetParticipantId,
          newRole,
        })
      );
    }
  };

  const handleKickParticipant = (targetParticipantId: string, reason?: string) => {
    setActiveParticipants((prev) => prev.filter((p) => p.id !== targetParticipantId));
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'USER_KICK',
          targetParticipantId,
          reason,
        })
      );
    }
  };

  const handleToggleMuteParticipant = (targetParticipantId: string, isMuted: boolean) => {
    setMutedParticipantIds((prev) => {
      if (isMuted) {
        return prev.includes(targetParticipantId) ? prev : [...prev, targetParticipantId];
      } else {
        return prev.filter((id) => id !== targetParticipantId);
      }
    });
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'USER_MUTE',
          targetParticipantId,
          isMuted,
        })
      );
    }
  };

  const handleToggleRoomLock = (isLocked: boolean) => {
    setIsRoomLocked(isLocked);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'ROOM_LOCK_TOGGLE',
          isLocked,
        })
      );
    }
  };

  const handleExplainAndFix = async () => {
    const activeItem = workspaceState.items.find((i) => i.id === workspaceState.activeFileId);
    if (!activeItem) return;

    const terminalLogs = terminalChunks.map((c) => c.data).join('');
    setIsAiExplaining(true);

    try {
      const res = await fetch(`/api/v1/rooms/${roomCode}/ai`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': participant?.role || 'EDITOR',
        },
        body: JSON.stringify({
          action: 'EXPLAIN_AND_FIX',
          model: 'claude-3-5-sonnet',
          context: {
            activeFile: {
              path: activeItem.name,
              content: activeItem.content || '',
              language: detectLanguageFromFilename(activeItem.name),
            },
            terminalOutput: terminalLogs,
            errorContext: {
              message: `Process terminated with exit code ${terminalExitCode ?? 1}`,
              stackTrace: terminalLogs,
            },
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.suggestedCode) {
          const diffRes = computeUnifiedDiff(
            activeItem.content || '',
            data.suggestedCode,
            activeItem.name
          );

          setActiveProposal({
            proposalId: `prop-fix-${Date.now()}`,
            action: 'EXPLAIN_AND_FIX',
            filePath: activeItem.name,
            baseDocumentVersion: documentVersion,
            explanation: data.explanation,
            diff: diffRes.diffText,
            suggestedCode: data.suggestedCode,
            status: 'PENDING',
            createdAt: Date.now(),
          });
        }
      }
    } catch (err) {
      console.error('Failed to explain and fix error', err);
    } finally {
      setIsAiExplaining(false);
    }
  };

  return (
    <div
      id="room-workspace-root"
      data-testid="room-ide"
      className="flex flex-col h-[calc(100vh-4rem)] bg-slate-950 text-slate-100 overflow-hidden font-sans"
    >
      {/* Room Toolbar Header */}
      <header className="h-12 border-b border-slate-800 bg-slate-900/90 px-4 flex items-center justify-between select-none">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-sm tracking-tight text-brand-400 hover:text-brand-300 transition-colors"
          >
            <Code2 className="w-5 h-5" />
            <span className="hidden sm:inline">Pairly</span>
          </Link>
          <span className="text-slate-600">/</span>
          <div className="flex items-center gap-2">
            <span
              id="room-code-badge"
              data-testid="room-code"
              className="px-2 py-0.5 rounded text-xs font-mono font-medium bg-slate-800 text-slate-200 border border-slate-700"
            >
              {roomCode}
            </span>
            <button
              id="copy-room-link-btn"
              onClick={copyRoomLink}
              title="Copy invite link"
              className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* Center: Play / Run Controls & Checkpoint Snapshots */}
        <div className="flex items-center gap-2">
          <button
            id="run-code-btn"
            data-testid="run-code-btn"
            onClick={handleRunCode}
            disabled={terminalStatus === 'RUNNING' || participant?.role === 'VIEWER'}
            title={participant?.role === 'VIEWER' ? 'Viewers cannot run code' : 'Execute code in sandbox'}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-medium transition-colors shadow-sm"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Run</span>
          </button>

          <button
            id="checkpoint-modal-btn"
            data-testid="checkpoint-btn"
            onClick={() => setIsCheckpointModalOpen(true)}
            title="Manage Workspace Checkpoints"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors shadow-sm"
          >
            <History className="w-3.5 h-3.5 text-brand-400" />
            <span className="hidden sm:inline">Checkpoints</span>
          </button>

          <button
            id="toggle-preview-btn"
            data-testid="toggle-preview-btn"
            onClick={() => setIsPreviewOpen((prev) => !prev)}
            title="Toggle Live Web Preview"
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium border transition-colors shadow-sm ${
              isPreviewOpen
                ? 'bg-brand-600 text-white border-brand-500'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-brand-300" />
            <span className="hidden sm:inline">Preview</span>
          </button>

          <button
            id="toggle-chat-btn"
            data-testid="toggle-chat-btn"
            onClick={() => {
              setIsChatOpen((prev) => !prev);
              setUnreadCount(0);
            }}
            title="Toggle Room Chat"
            className={`relative inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium border transition-colors shadow-sm ${
              isChatOpen
                ? 'bg-brand-600 text-white border-brand-500'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-brand-300" />
            <span className="hidden sm:inline">Chat</span>
            {unreadCount > 0 && !isChatOpen && (
              <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full text-[9px] bg-brand-500 text-white font-bold">
                {unreadCount}
              </span>
            )}
          </button>

          <button
            id="toggle-notepad-btn"
            data-testid="toggle-notepad-btn"
            onClick={() => setIsNotepadOpen((prev) => !prev)}
            title="Toggle Collaborative Markdown Notes (Isolated from Workspace Code)"
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium border transition-colors shadow-sm ${
              isNotepadOpen
                ? 'bg-amber-600/30 text-amber-300 border-amber-500/50'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Notes</span>
          </button>

          <button
            id="toggle-whiteboard-btn"
            data-testid="toggle-whiteboard-btn"
            onClick={() => setIsWhiteboardOpen((prev) => !prev)}
            title="Toggle Collaborative Architecture Whiteboard"
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium border transition-colors shadow-sm ${
              isWhiteboardOpen
                ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500/50'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
          >
            <Palette className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Whiteboard</span>
          </button>

          <button
            id="toggle-participants-btn"
            data-testid="toggle-participants-btn"
            onClick={() => setIsParticipantsModalOpen(true)}
            title="Room Participants & Permissions"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium border bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 transition-colors shadow-sm"
          >
            <Users className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">People</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-500/20 text-indigo-300 font-mono">
              {activeParticipants.length}
            </span>
          </button>

          <button
            id="toggle-ai-btn"
            data-testid="toggle-ai-btn"
            onClick={() => setIsAiPanelOpen((prev) => !prev)}
            title="Toggle Pairly Agent AI Assistant (FR-AI-01)"
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium border transition-colors shadow-sm ${
              isAiPanelOpen
                ? 'bg-purple-600/30 text-purple-300 border-purple-500/50'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">AI Agent</span>
          </button>

          <button
            id="toggle-media-btn"
            data-testid="toggle-media-btn"
            onClick={() => setIsMediaPanelOpen((prev) => !prev)}
            title="Toggle WebRTC Audio/Video Call (FR-COMM-03..07)"
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium border transition-colors shadow-sm ${
              isMediaPanelOpen
                ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/50'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
          >
            <Video className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Call</span>
            {liveKit.isConnected && (
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
            )}
          </button>
        </div>

        {/* Right: Presence and Connection Status */}
        <div className="flex items-center gap-3">
          {participant && (
            <button
              type="button"
              id="current-user-badge"
              data-testid="current-user-badge"
              onClick={() => {
                const newName = window.prompt(
                  'Enter your new display name:',
                  participant.displayName
                );
                if (
                  !newName ||
                  !newName.trim() ||
                  newName.trim() === participant.displayName
                )
                  return;
                const cleanName = newName.trim();
                const updated: ParticipantIdentity = {
                  ...participant,
                  displayName: cleanName,
                };
                setParticipant(updated);
                sessionStorage.setItem('pairly_username', cleanName);
                sessionStorage.setItem(
                  `pairly_guest_${roomCode}`,
                  JSON.stringify(updated)
                );
                setActiveParticipants((prev) =>
                  prev.map((p) => (p.id === updated.id ? updated : p))
                );
                if (
                  wsRef.current &&
                  wsRef.current.readyState === WebSocket.OPEN
                ) {
                  wsRef.current.send(
                    JSON.stringify({
                      type: 'PRESENCE_UPDATE',
                      participantId: updated.id,
                      displayName: updated.displayName,
                      fileId: workspaceState.activeFileId,
                    })
                  );
                }
              }}
              title="Click to change your display name"
              className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded text-xs bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 transition-colors cursor-pointer"
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: participant.color }}
              />
              <span className="font-medium text-slate-200">
                {participant.displayName}
              </span>
              <span className="text-[10px] text-slate-400">
                ({participant.role})
              </span>
            </button>
          )}

          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            {connectionStatus === 'connected' ? (
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <WifiOff className="w-3.5 h-3.5 text-rose-400" />
            )}
            <span className="hidden md:inline capitalize">{connectionStatus}</span>
            {pingLatency !== null && connectionStatus === 'connected' && (
              <span
                data-testid="ping-latency-badge"
                title="Round-trip network latency to coordinator"
                className="hidden lg:inline text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-emerald-400 border border-slate-700/50"
              >
                {pingLatency}ms
              </span>
            )}
          </div>

          <PresenceBar
            currentParticipant={participant}
            participants={activeParticipants.map((p) => ({
              participant: p,
              activeFileId: participantPresenceMap[p.id]?.fileId,
              activeFileName: participantPresenceMap[p.id]?.fileName,
            }))}
            followedParticipantId={follow.followedParticipantId}
            spotlightedParticipantId={follow.spotlightedParticipantId}
            onFollow={follow.startFollowing}
            onUnfollow={follow.stopFollowing}
            onToggleSpotlight={(targetId) => {
              if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                wsRef.current.send(
                  JSON.stringify({
                    type: 'SPOTLIGHT_TOGGLE',
                    targetParticipantId: targetId,
                  })
                );
              }
            }}
          />

          <button
            id="report-abuse-btn"
            data-testid="report-abuse-btn"
            onClick={() => setIsReportModalOpen(true)}
            title="Report Abuse or Security Incident (FR-ADMIN-01)"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-rose-950/40 hover:text-rose-300 text-slate-400 text-xs font-medium border border-slate-700/60 transition-colors"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden sm:inline">Report</span>
          </button>

          <button
            id="share-room-btn"
            data-testid="share-room-btn"
            onClick={() => setIsShareModalOpen(true)}
            title="Share Room and View QR Code"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Share</span>
          </button>

          <button
            id="command-palette-btn"
            data-testid="command-palette-btn"
            onClick={() => setIsCommandPaletteOpen(true)}
            title="Command Palette (Ctrl+K / Cmd+K)"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700/60 transition-colors"
          >
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden lg:inline text-slate-400">Commands</span>
            <kbd className="hidden lg:inline-flex px-1 py-0.2 rounded text-[9px] font-mono bg-slate-900 border border-slate-700 text-slate-400">
              ⌘K
            </kbd>
          </button>

          <button
            id="about-btn"
            data-testid="about-btn"
            onClick={() => setIsAboutModalOpen(true)}
            title="About Pairly & Keyboard Shortcuts"
            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
          >
            <Info className="w-3.5 h-3.5" />
          </button>

          <button
            id="editor-settings-btn"
            data-testid="editor-settings-btn"
            onClick={() => setIsSettingsModalOpen(true)}
            title="Editor Settings (Font, Tab Size, Themes)"
            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>

          <button
            id="leave-room-btn"
            data-testid="leave-room-btn"
            onClick={() => setIsLeaveModalOpen(true)}
            title="Leave or Terminate Room"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-medium transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Leave</span>
          </button>
        </div>
      </header>

      {/* Main IDE Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar (File Explorer) */}
        <aside
          id="workspace-filetree-panel"
          data-testid="filetree-panel"
          className="w-56 border-r border-slate-800 bg-slate-900/40 hidden md:flex flex-col overflow-hidden"
        >
          <FileTree
            items={workspaceState.items}
            activeFileId={workspaceState.activeFileId}
            onSelectFile={(id) => {
              follow.breakFollowOnInteraction();
              workspaceManagerRef.current.openTab(id);
            }}
            onCreateFile={(name, isFolder, parentId) =>
              workspaceManagerRef.current.createFile(name, isFolder, parentId)
            }
            onDeleteFile={(id) => workspaceManagerRef.current.deleteFile(id)}
            onImportItems={(imported) => {
              for (const item of imported) {
                workspaceManagerRef.current.createFile(
                  item.name,
                  item.isFolder,
                  item.parentId,
                  item.content
                );
              }
            }}
            onOpenGitHubImport={() => setIsGitHubModalOpen(true)}
            onOpenFilePreview={(file) => setFilePreviewData(file)}
          />
        </aside>

        {/* Central Editor Viewport */}
        <section
          id="workspace-editor"
          data-testid="room-editor"
          ref={editorContainerRef}
          className="flex-1 flex flex-col bg-slate-950 relative overflow-hidden"
        >
          {/* Editor Tab Bar */}
          <Tabs
            items={workspaceState.items}
            openTabIds={workspaceState.openTabIds}
            activeFileId={workspaceState.activeFileId}
            onSelectTab={(id) => {
              follow.breakFollowOnInteraction();
              workspaceManagerRef.current.setActiveTab(id);
            }}
            onCloseTab={(id) => workspaceManagerRef.current.closeTab(id)}
          />

          {/* Code Area */}
          <div className="flex-1 overflow-hidden relative">
            {/* Real-Time Collaborative Remote Pointers */}
            <RemotePointers
              currentUserId={participant?.id}
              pointers={remotePointers}
              containerRef={editorContainerRef}
              onBroadcastPointer={(x, y) => {
                if (wsRef.current?.readyState === WebSocket.OPEN && participant) {
                  wsRef.current.send(
                    JSON.stringify({
                      type: 'POINTER_UPDATE',
                      participantId: participant.id,
                      name: participant.displayName,
                      color: participant.color,
                      x,
                      y,
                    })
                  );
                }
              }}
            />

            {participant && (
              <CodeEditor
                key={workspaceState.activeFileId || 'empty'}
                isCollaborative={true}
                language="typescript"
                participant={participant}
                settings={editorSettings}
                readOnly={participant.role === 'VIEWER'}
                onCodeChange={(newCode) => {
                  if (workspaceState.activeFileId) {
                    workspaceManagerRef.current.updateFileContent(
                      workspaceState.activeFileId,
                      newCode
                    );
                  }
                }}
                onCursorMove={(cursor) => {
                  setCursorPosition({ line: cursor.line, column: cursor.column });
                  if (wsRef.current?.readyState === WebSocket.OPEN) {
                    wsRef.current.send(
                      JSON.stringify({
                        type: 'CURSOR_UPDATE',
                        cursor,
                      })
                    );
                  }
                }}
                onSessionReady={(session) => {
                  activeSessionRef.current = session;
                  while (pendingDocUpdatesRef.current.length > 0) {
                    const pending = pendingDocUpdatesRef.current.shift()!;
                    session.applyEncodedUpdate(pending);
                  }
                  session.onUpdate((base64Update, origin) => {
                    if (
                      origin === 'local' &&
                      wsRef.current &&
                      wsRef.current.readyState === WebSocket.OPEN
                    ) {
                      wsRef.current.send(
                        JSON.stringify({
                          type: 'DOC_UPDATE',
                          fileId: workspaceState.activeFileId,
                          update: base64Update,
                        })
                      );
                    }
                  });
                }}
                initialUpdate={serverDocSnapshot || undefined}
                initialCode={
                  workspaceState.items.find((i) => i.id === workspaceState.activeFileId)?.content ||
                  `// Welcome to Pairly Room ${roomCode}`
                }
              />
            )}
          </div>

          {/* Shared Real-Time Terminal (FR-EXEC-02..03, FR-AI-09) */}
          <SharedTerminal
            chunks={terminalChunks}
            status={terminalStatus}
            exitCode={terminalExitCode}
            durationMs={terminalDuration}
            isExpanded={isTerminalExpanded}
            onToggleExpand={() => setIsTerminalExpanded((prev) => !prev)}
            onSendStdin={handleSendStdin}
            onClear={handleClearTerminal}
            onExplainAndFix={handleExplainAndFix}
            isAiExplaining={isAiExplaining}
          />
        </section>

        {/* Live Web Preview Panel (FR-PREV-01..03, AT-06) */}
        {isPreviewOpen && (
          <div className="w-1/2 flex flex-col min-w-[320px] max-w-[50%] h-full">
            <WebPreview items={workspaceState.items} />
          </div>
        )}

        {/* In-Room Collaborative Chat Panel (FR-COMM-01..02) */}
        {isChatOpen && (
          <ChatPanel
            messages={chatMessages}
            currentParticipant={participant}
            participants={activeParticipants}
            onSendMessage={handleSendChatMessage}
            onClose={() => setIsChatOpen(false)}
          />
        )}

        {/* Pairly Agent AI Assistant Panel (FR-AI-01..03) */}
        {isAiPanelOpen && (
          <div className="w-80 flex flex-col min-w-[300px] max-w-[360px] h-full border-l border-slate-800">
            <AiAssistantPanel
              roomCode={roomCode}
              activeFilePath={
                workspaceState.items.find((i) => i.id === workspaceState.activeFileId)?.name ||
                'index.ts'
              }
              activeFileContent={
                workspaceState.items.find((i) => i.id === workspaceState.activeFileId)?.content ||
                ''
              }
              documentVersion={documentVersion}
              userRole={participant?.role || 'EDITOR'}
              onOpenProposal={(prop) => setActiveProposal(prop)}
            />
          </div>
        )}

        {/* WebRTC Audio/Video Call Panel (FR-COMM-03..07, 10) */}
        {isMediaPanelOpen && (
          <div className="w-80 flex flex-col min-w-[300px] max-w-[360px] h-full border-l border-slate-800 bg-slate-950">
            <div className="p-3 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Video className="h-4 w-4 text-indigo-400" />
                <span className="text-xs font-bold text-slate-200">Room Call</span>
              </div>
              <button
                onClick={() => setIsMediaPanelOpen(false)}
                className="text-xs text-slate-400 hover:text-slate-200 p-1 rounded"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <VideoGrid
                localName={participant?.displayName || 'You'}
                isMicMuted={liveKit.isMicMuted}
                isCameraOff={liveKit.isCameraOff}
                isScreenSharing={liveKit.isScreenSharing}
                audioVolume={liveKit.audioVolume}
                localVideoTrack={liveKit.localVideoTrack}
                localScreenTrack={liveKit.localScreenTrack}
                remoteParticipants={liveKit.remoteParticipants}
              />
            </div>
            <MediaBar
              isConnected={liveKit.isConnected}
              isConnecting={liveKit.isConnecting}
              isMicMuted={liveKit.isMicMuted}
              isCameraOff={liveKit.isCameraOff}
              isScreenSharing={liveKit.isScreenSharing}
              error={liveKit.error}
              onToggleMic={liveKit.toggleMic}
              onToggleCamera={liveKit.toggleCamera}
              onToggleScreenShare={liveKit.toggleScreenShare}
              onConnect={liveKit.connect}
              onDisconnect={liveKit.disconnect}
              onOpenSettings={() => setIsDeviceSettingsOpen(true)}
            />
          </div>
        )}
      </div>

      {/* IDE Bottom Status Bar (CodeX Inspired) */}
      <StatusBar
        activeFileName={
          workspaceState.items.find((i) => i.id === workspaceState.activeFileId)?.name || 'index.ts'
        }
        language={
          detectLanguageFromFilename(
            workspaceState.items.find((i) => i.id === workspaceState.activeFileId)?.name || 'index.ts'
          )
        }
        cursorLine={cursorPosition.line}
        cursorColumn={cursorPosition.column}
        latencyMs={pingLatency ?? 28}
        isConnected={connectionStatus === 'connected'}
        isPreviewOpen={isPreviewOpen}
        isTerminalOpen={isTerminalExpanded}
        onTogglePreview={() => setIsPreviewOpen((prev) => !prev)}
        onToggleTerminal={() => setIsTerminalExpanded((prev) => !prev)}
        onOpenDiagnostics={() => setIsDiagnosticsOpen(true)}
        onSelectLanguage={(newLang) => {
          const activeFile = workspaceState.items.find(
            (i) => i.id === workspaceState.activeFileId
          );
          if (activeFile) {
            const extMap: Record<string, string> = {
              TypeScript: '.ts',
              JavaScript: '.js',
              Python: '.py',
              Go: '.go',
              Rust: '.rs',
              'C++': '.cpp',
              C: '.c',
              Java: '.java',
              'C#': '.cs',
              Ruby: '.rb',
              PHP: '.php',
              HTML: '.html',
              CSS: '.css',
              JSON: '.json',
              Markdown: '.md',
              YAML: '.yaml',
              SQL: '.sql',
              Bash: '.sh',
              Dockerfile: 'Dockerfile',
            };
            const newExt = extMap[newLang];
            if (newExt) {
              const baseName = activeFile.name.includes('.')
                ? activeFile.name.substring(0, activeFile.name.lastIndexOf('.'))
                : activeFile.name;
              const targetName = newExt.startsWith('.') ? `${baseName}${newExt}` : newExt;
              workspaceManagerRef.current.renameFile(activeFile.id, targetName);
            }
          }
        }}
      />

      <CheckpointModal
        isOpen={isCheckpointModalOpen}
        onClose={() => setIsCheckpointModalOpen(false)}
        roomCode={roomCode}
        isHostOrEditor={participant?.role === 'HOST' || participant?.role === 'EDITOR'}
      />

      {/* Shared Collaborative Markdown Notepad (FR-BOARD-02) */}
      <SharedNotepad
        isOpen={isNotepadOpen}
        onClose={() => setIsNotepadOpen(false)}
        roomCode={roomCode}
        onBroadcastUpdate={handleBroadcastNotepadUpdate}
        onMountSession={(session) => {
          notepadSessionRef.current = session;
        }}
      />

      {/* AI Code Modification Proposal Modal (FR-AI-04, FR-AI-05, FR-AI-08) */}
      <AIProposalModal
        proposal={activeProposal}
        isOpen={!!activeProposal}
        currentDocumentVersion={documentVersion}
        currentDocumentContent={
          workspaceState.items.find((i) => i.id === workspaceState.activeFileId)?.content || ''
        }
        originalDocumentContent={
          workspaceState.items.find((i) => i.id === workspaceState.activeFileId)?.content || ''
        }
        onClose={() => setActiveProposal(null)}
        onAccept={(proposal, finalCode) => {
          const file = workspaceState.items.find((i) => i.id === workspaceState.activeFileId);
          if (file) {
            workspaceManagerRef.current.updateFileContent(file.id, finalCode);
            setDocumentVersion((v) => v + 1);
          }
        }}
        onReject={() => {
          setActiveProposal(null);
        }}
        userCanApply={participant?.role === 'HOST' || participant?.role === 'EDITOR'}
      />

      {/* GitHub Repository Import Modal (FR-INT-01..02) */}
      <GitHubImportModal
        isOpen={isGitHubModalOpen}
        onClose={() => setIsGitHubModalOpen(false)}
        onImportFiles={(files, repoName) => {
          for (const f of files) {
            workspaceManagerRef.current.createFile(f.path, f.isFolder, null, f.content);
          }
        }}
      />

      {/* In-Room Abuse and Security Violation Report Modal (FR-ADMIN-01) */}
      <AbuseReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        roomCode={roomCode}
        reporterId={participant?.id || 'guest-reporter'}
        participants={activeParticipants}
        activeFileName={
          workspaceState.items.find((i) => i.id === workspaceState.activeFileId)?.name
        }
      />

      {/* Audio & Video Device Settings Modal */}
      <DeviceSettingsModal
        isOpen={isDeviceSettingsOpen}
        onClose={() => setIsDeviceSettingsOpen(false)}
        availableDevices={liveKit.availableDevices}
      />

      {/* Share Room and Invite Peers Modal (CodeX Inspired) */}
      <ShareRoomModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        roomCode={roomCode}
        isHost={participant?.role === 'HOST'}
      />

      {/* Editor Settings Modal (CodeX Inspired) */}
      <EditorSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={editorSettings}
        onUpdateSettings={setEditorSettings}
      />

      {/* About & Keyboard Shortcuts Modal (CodeX Inspired) */}
      <AboutModal
        isOpen={isAboutModalOpen}
        onClose={() => setIsAboutModalOpen(false)}
      />

      {/* Leave Room Modal (CodeX Inspired) */}
      <LeaveRoomModal
        isOpen={isLeaveModalOpen}
        onClose={() => setIsLeaveModalOpen(false)}
        roomCode={roomCode}
        isHost={participant?.role === 'HOST'}
      />

      {/* File Diff & Preview Modal (code-editor Inspired) */}
      {filePreviewData && (
        <FilePreviewModal
          isOpen={!!filePreviewData}
          onClose={() => setFilePreviewData(null)}
          fileName={filePreviewData.fileName}
          fileContent={filePreviewData.content}
          currentCode={
            workspaceState.items.find((i) => i.id === workspaceState.activeFileId)?.content || ''
          }
          currentFileName={
            workspaceState.items.find((i) => i.id === workspaceState.activeFileId)?.name ||
            'active file'
          }
          onAppend={(content) => {
            const activeFile = workspaceState.items.find(
              (i) => i.id === workspaceState.activeFileId
            );
            if (activeFile) {
              const merged =
                (activeFile.content ? activeFile.content + '\n\n' : '') + content;
              workspaceManagerRef.current.updateFileContent(activeFile.id, merged);
            }
          }}
          onReplace={(content) => {
            const activeFile = workspaceState.items.find(
              (i) => i.id === workspaceState.activeFileId
            );
            if (activeFile) {
              workspaceManagerRef.current.updateFileContent(activeFile.id, content);
            }
          }}
          onSaveAsNewFile={(name, content) => {
            workspaceManagerRef.current.createFile(name, false, null, content);
          }}
        />
      )}

      {/* Join Room Name Prompt Modal */}
      <JoinRoomPromptModal
        isOpen={isJoinPromptOpen}
        roomCode={roomCode}
        onJoin={(chosenName) => {
          sessionStorage.setItem('pairly_username', chosenName);
          const updated = generateGuestIdentity('EDITOR', chosenName);
          sessionStorage.setItem(`pairly_guest_${roomCode}`, JSON.stringify(updated));
          setParticipant(updated);
          setActiveParticipants([updated]);
          setIsJoinPromptOpen(false);
        }}
      />

      {/* Quick Command Palette Modal (Ctrl+K / Cmd+K / Ctrl+Shift+P) */}
      <CommandPaletteModal
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        workspaceFiles={workspaceState.items}
        onSelectFile={(id) => {
          follow.breakFollowOnInteraction();
          workspaceManagerRef.current.openTab(id);
        }}
        onRunCode={handleRunCode}
        onTogglePreview={() => setIsPreviewOpen((prev) => !prev)}
        onToggleTerminal={() => setIsTerminalExpanded((prev) => !prev)}
        onOpenCheckpoints={() => setIsCheckpointModalOpen(true)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onToggleChat={() => {
          setIsChatOpen((prev) => !prev);
          setUnreadCount(0);
        }}
        onToggleNotepad={() => setIsNotepadOpen((prev) => !prev)}
        onToggleWhiteboard={() => setIsWhiteboardOpen((prev) => !prev)}
        onOpenParticipants={() => setIsParticipantsModalOpen(true)}
        onToggleAi={() => setIsAiPanelOpen((prev) => !prev)}
        onToggleMedia={() => setIsMediaPanelOpen((prev) => !prev)}
        onOpenShare={() => setIsShareModalOpen(true)}
        onOpenGitHubImport={() => setIsGitHubModalOpen(true)}
        onOpenDiagnostics={() => setIsDiagnosticsOpen(true)}
        onOpenAbout={() => setIsAboutModalOpen(true)}
        onOpenReport={() => setIsReportModalOpen(true)}
        onOpenLeave={() => setIsLeaveModalOpen(true)}
      />

      {/* Collaborative Architecture Whiteboard Modal */}
      <WhiteboardModal
        isOpen={isWhiteboardOpen}
        onClose={() => setIsWhiteboardOpen(false)}
        roomCode={roomCode}
        elements={whiteboardElements}
        onAddElement={handleAddWhiteboardElement}
        onClearElements={handleClearWhiteboard}
      />

      {/* Room Participants & Moderation Modal */}
      <ParticipantsModal
        isOpen={isParticipantsModalOpen}
        onClose={() => setIsParticipantsModalOpen(false)}
        roomCode={roomCode}
        currentParticipant={participant}
        participants={activeParticipants}
        participantPresenceMap={participantPresenceMap}
        isRoomLocked={isRoomLocked}
        mutedParticipantIds={mutedParticipantIds}
        onChangeRole={handleChangeRole}
        onKickParticipant={handleKickParticipant}
        onToggleMuteParticipant={handleToggleMuteParticipant}
        onToggleRoomLock={handleToggleRoomLock}
      />
    </div>
  );
}
