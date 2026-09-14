import type { SessionRecording } from './types';

/**
 * Downloads session data as a structured JSON file.
 */
export function downloadSessionJson(recording: SessionRecording): void {
  if (typeof window === 'undefined') return;
  const jsonStr = JSON.stringify(recording, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${recording.title.replace(/[^a-zA-Z0-9_-]/g, '_')}_session.json`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

/**
 * Generates an animated .webm video of the session recording using HTML5 Canvas & MediaRecorder.
 * Directly adapts and elevates the code-editor canvas recording architecture.
 */
export function downloadSessionVideo(
  recording: SessionRecording,
  onProgress?: (percent: number) => void
): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      resolve(false);
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    const ctx = canvas.getContext('2d');

    if (!ctx || typeof canvas.captureStream !== 'function' || typeof MediaRecorder === 'undefined') {
      // In environments without MediaRecorder (e.g. happy-dom or Safari without webm), fallback to JSON
      downloadSessionJson(recording);
      resolve(true);
      return;
    }

    let mediaRecorder: MediaRecorder;
    try {
      const stream = canvas.captureStream(30);
      mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
    } catch {
      downloadSessionJson(recording);
      resolve(true);
      return;
    }

    const chunks: Blob[] = [];
    mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunks.push(e.data);
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${recording.title.replace(/[^a-zA-Z0-9_-]/g, '_')}_replay.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      resolve(true);
    };

    mediaRecorder.start();

    const maxSec = Math.max(1, recording.durationSeconds);
    let currentSec = 0;
    const stepDurationMs = 250; // accelerated rendering

    const interval = setInterval(() => {
      // Background
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Top Navigation / Window Header
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, 64);
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      ctx.strokeRect(0, 0, canvas.width, 64);

      // Mac Window Controls
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(30, 32, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(50, 32, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FF0000';
      ctx.beginPath();
      ctx.arc(70, 32, 6, 0, Math.PI * 2);
      ctx.fill();

      // Title & Room Code
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(`Pairly IDE Replay — ${recording.title}`, 95, 38);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '13px monospace';
      ctx.fillText(
        `Room: ${recording.roomCode}  •  By: ${recording.createdBy}  •  ${currentSec}s / ${maxSec}s`,
        canvas.width - 440,
        38
      );

      // Editor Frame
      ctx.fillStyle = '#020617';
      ctx.fillRect(24, 88, 860, 580);
      ctx.strokeStyle = '#1e293b';
      ctx.strokeRect(24, 88, 860, 580);

      // Editor Tab Bar
      ctx.fillStyle = '#0b1120';
      ctx.fillRect(24, 88, 860, 36);
      ctx.fillStyle = '#60a5fa';
      ctx.font = 'bold 12px monospace';
      ctx.fillText(`📄 ${recording.initialFileName || 'main.ts'}`, 40, 111);

      // Current Code Snapshot
      const visible = recording.events.filter((e) => e.timestamp <= currentSec);
      const latestCodeEvent = visible.filter((e) => e.type === 'code').pop();
      const currentCode =
        latestCodeEvent?.detail ||
        recording.initialCode ||
        '// Pairly IDE Session Recording\n// Collaborative workspace stream active';

      ctx.fillStyle = '#f8fafc';
      ctx.font = '13px monospace';
      const lines = currentCode.split('\n').slice(0, 24);
      lines.forEach((line, idx) => {
        // Line number
        ctx.fillStyle = '#475569';
        ctx.fillText(String(idx + 1).padStart(3, ' '), 35, 150 + idx * 21);

        // Code content
        if (line.trim().startsWith('import') || line.trim().startsWith('export')) {
          ctx.fillStyle = '#f472b6';
        } else if (line.trim().startsWith('//') || line.trim().startsWith('/*')) {
          ctx.fillStyle = '#64748b';
        } else if (line.includes('function') || line.includes('const') || line.includes('let')) {
          ctx.fillStyle = '#38bdf8';
        } else {
          ctx.fillStyle = '#e2e8f0';
        }
        ctx.fillText(line, 75, 150 + idx * 21);
      });

      // Events & Activity Feed Panel (Right Side)
      ctx.fillStyle = '#0b1120';
      ctx.fillRect(900, 88, 356, 580);
      ctx.strokeStyle = '#1e293b';
      ctx.strokeRect(900, 88, 356, 580);

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(900, 88, 356, 36);
      ctx.fillStyle = '#f1f5f9';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('⚡ Timeline Activity Feed', 916, 111);

      const recentEvents = visible.slice(-14);
      recentEvents.forEach((ev, idx) => {
        const y = 150 + idx * 36;
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(912, y - 18, 332, 28);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '11px monospace';
        ctx.fillText(`+${ev.timestamp}s`, 920, y);

        let badgeColor = '#60a5fa';
        if (ev.type === 'chat') badgeColor = '#34d399';
        if (ev.type === 'terminal') badgeColor = '#f59e0b';
        if (ev.type === 'presence') badgeColor = '#c084fc';

        ctx.fillStyle = badgeColor;
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText(`[${ev.type.toUpperCase()}]`, 970, y);

        ctx.fillStyle = '#e2e8f0';
        ctx.font = '11px sans-serif';
        const truncated =
          ev.detail.length > 22 ? `${ev.detail.slice(0, 20)}...` : ev.detail;
        ctx.fillText(truncated, 1050, y);
      });

      // Bottom Progress Scrubber Bar
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 688, canvas.width, 32);

      const progressRatio = Math.min(1, currentSec / maxSec);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(0, 688, canvas.width * progressRatio, 32);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px monospace';
      ctx.fillText(
        `PROGRESS: ${(progressRatio * 100).toFixed(0)}%  •  RECORDING DURATION: ${maxSec}s`,
        24,
        708
      );

      if (onProgress) onProgress(progressRatio * 100);

      currentSec++;
      if (currentSec > maxSec) {
        clearInterval(interval);
        setTimeout(() => {
          if (mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
          }
        }, 300);
      }
    }, stepDurationMs);
  });
}
