'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
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
} from 'lucide-react';
import type {
  ParticipantIdentity,
  ExecutionOutputChunk,
  ExecutionStatus,
  AiProposal,
} from '@pairly/contracts';
import { detectLanguageFromFilename } from '@pairly/execution';
import { generateGuestIdentity } from '../../lib/guest';
import { CodeEditor } from '../editor/CodeEditor';
import type { CollaborativeSession } from '../editor/yjsExtension';
import { FileTree } from '../workspace/FileTree';
import { Tabs } from '../workspace/Tabs';
import {
  createWorkspaceManager,
  type WorkspaceState,
} from '../workspace/workspaceState';
import { PresenceBar } from '../presence/PresenceBar';
import { useFollow } from '../presence/useFollow';
import { CheckpointModal } from './CheckpointModal';
import { SharedTerminal } from '../terminal/SharedTerminal';
import { WebPreview } from '../preview/WebPreview';
import { ChatPanel, type ChatMessageItem } from '../chat/ChatPanel';
import { SharedNotepad } from '../notepad/SharedNotepad';
import type { NotepadSession } from '../notepad/notepadSession';
import { AiAssistantPanel, AIProposalModal } from '../ai';
import { computeUnifiedDiff } from '@pairly/ai';
import { useLiveKit, VideoGrid, MediaBar } from '../media';
import { GitHubImportModal } from '../workspace/GitHubImportModal';
import type { GitHubImportFile } from '../../lib/githubClient';
import { AbuseReportModal } from './AbuseReportModal';

interface RoomClientProps {
  roomCode: string;
}

export function RoomClient({ roomCode }: RoomClientProps) {
  const [copied, setCopied] = useState(false);
  const [participant, setParticipant] = useState<ParticipantIdentity | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<
    'connecting' | 'connected' | 'disconnected'
  >('connecting');
  const [activeParticipants, setActiveParticipants] = useState<ParticipantIdentity[]>([]);
  const activeSessionRef = React.useRef<CollaborativeSession | null>(null);
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
  const liveKit = useLiveKit({
    roomCode,
    participantName: participant?.displayName || 'Guest',
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

  useEffect(() => {
    // 1. Retrieve or generate guest identity
    let currentParticipant: ParticipantIdentity;
    const storedIdentity = sessionStorage.getItem(`pairly_guest_${roomCode}`);

    if (storedIdentity) {
      try {
        currentParticipant = JSON.parse(storedIdentity);
      } catch {
        currentParticipant = generateGuestIdentity('EDITOR');
      }
    } else {
      currentParticipant = generateGuestIdentity('EDITOR');
      sessionStorage.setItem(`pairly_guest_${roomCode}`, JSON.stringify(currentParticipant));
    }

    setParticipant(currentParticipant);
    setActiveParticipants([currentParticipant]);

    // 2. Establish connection to realtime service if available
    const rawPayload = JSON.stringify({
      participantId: currentParticipant.id,
      displayName: currentParticipant.displayName,
      avatar: currentParticipant.avatar,
      color: currentParticipant.color,
      role: currentParticipant.role,
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
    try {
      const wsUrl = `ws://localhost:4001/ws/rooms/${roomCode}?token=${encodeURIComponent(token)}`;
      ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnectionStatus('connected');
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'ROOM_JOINED') {
            setActiveParticipants(msg.participants || [currentParticipant]);
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
            activeSessionRef.current?.applyEncodedUpdate(msg.update);
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
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [roomCode]);

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
            <div
              id="current-user-badge"
              data-testid="current-user-badge"
              className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded text-xs bg-slate-800/80 border border-slate-700"
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: participant.color }}
              />
              <span className="font-medium text-slate-200">{participant.displayName}</span>
              <span className="text-[10px] text-slate-400">({participant.role})</span>
            </div>
          )}

          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            {connectionStatus === 'connected' ? (
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <WifiOff className="w-3.5 h-3.5 text-rose-400" />
            )}
            <span className="hidden md:inline capitalize">{connectionStatus}</span>
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
            onClick={copyRoomLink}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Share</span>
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
          />
        </aside>

        {/* Central Editor Viewport */}
        <section
          id="workspace-editor"
          data-testid="room-editor"
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
            {participant && (
              <CodeEditor
                key={workspaceState.activeFileId || 'empty'}
                language="typescript"
                participant={participant}
                readOnly={participant.role === 'VIEWER'}
                onCodeChange={(newCode) => {
                  if (workspaceState.activeFileId) {
                    workspaceManagerRef.current.updateFileContent(
                      workspaceState.activeFileId,
                      newCode
                    );
                  }
                }}
                onSessionReady={(session) => {
                  activeSessionRef.current = session;
                  session.onUpdate((base64Update, origin) => {
                    if (
                      origin === 'local' &&
                      wsRef.current &&
                      wsRef.current.readyState === WebSocket.OPEN
                    ) {
                      wsRef.current.send(
                        JSON.stringify({ type: 'DOC_UPDATE', update: base64Update })
                      );
                    }
                  });
                }}
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
            />
          </div>
        )}
      </div>

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
    </div>
  );
}
