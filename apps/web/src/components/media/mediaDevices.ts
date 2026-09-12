/**
 * Real media device management and WebRTC track utilities.
 * Inspired by CodeX webcam-stream implementation.
 */

export interface AvailableDevices {
  audioInputs: MediaDeviceInfo[];
  videoInputs: MediaDeviceInfo[];
  audioOutputs: MediaDeviceInfo[];
}

export class MediaDeviceManager {
  private localStream: MediaStream | null = null;
  private screenStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private animFrameId: number | null = null;

  /**
   * Enumerate available system microphones, cameras, and audio output devices.
   */
  async enumerateDevices(): Promise<AvailableDevices> {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.enumerateDevices) {
      return { audioInputs: [], videoInputs: [], audioOutputs: [] };
    }

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return {
        audioInputs: devices.filter((d) => d.kind === 'audioinput'),
        videoInputs: devices.filter((d) => d.kind === 'videoinput'),
        audioOutputs: devices.filter((d) => d.kind === 'audiooutput'),
      };
    } catch (err) {
      console.warn('Failed to enumerate media devices:', err);
      return { audioInputs: [], videoInputs: [], audioOutputs: [] };
    }
  }

  /**
   * Acquire local user media (camera and microphone).
   */
  async getUserMedia(options: {
    video?: boolean | MediaTrackConstraints;
    audio?: boolean | MediaTrackConstraints;
    videoDeviceId?: string;
    audioDeviceId?: string;
  } = {}): Promise<MediaStream | null> {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      return null;
    }

    const videoConstraint: boolean | MediaTrackConstraints = options.video ?? true
      ? options.videoDeviceId
        ? { deviceId: { exact: options.videoDeviceId } }
        : true
      : false;

    const audioConstraint: boolean | MediaTrackConstraints = options.audio ?? true
      ? options.audioDeviceId
        ? { deviceId: { exact: options.audioDeviceId } }
        : true
      : false;

    try {
      this.stopLocalStream();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraint,
        audio: audioConstraint,
      });
      this.localStream = stream;
      return stream;
    } catch (err) {
      console.warn('getUserMedia permission denied or device not found:', err);
      throw err;
    }
  }

  /**
   * Acquire screen share media stream.
   */
  async getDisplayMedia(): Promise<MediaStream | null> {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getDisplayMedia) {
      return null;
    }

    try {
      this.stopScreenStream();
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'monitor',
          frameRate: { ideal: 30, max: 60 },
        },
        audio: true,
      });
      this.screenStream = stream;
      return stream;
    } catch (err) {
      console.warn('getDisplayMedia permission denied or cancelled:', err);
      throw err;
    }
  }

  /**
   * Setup real-time audio volume analyser to detect speaking activity.
   */
  startAudioMeter(stream: MediaStream, onVolumeChange: (volume: number) => void): () => void {
    const audioTrack = stream.getAudioTracks()[0];
    if (!audioTrack || typeof window === 'undefined') {
      return () => {};
    }

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return () => {};

      this.audioContext = new AudioCtx();
      const source = this.audioContext.createMediaStreamSource(stream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.5;
      source.connect(this.analyser);

      const bufferLength = this.analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const checkVolume = () => {
        if (!this.analyser) return;
        this.analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i] ?? 0;
        }
        const average = sum / bufferLength;
        const normalized = Math.min(100, Math.round((average / 128) * 100));
        onVolumeChange(normalized);
        this.animFrameId = requestAnimationFrame(checkVolume);
      };

      checkVolume();

      return () => {
        if (this.animFrameId) {
          cancelAnimationFrame(this.animFrameId);
          this.animFrameId = null;
        }
        if (this.audioContext && this.audioContext.state !== 'closed') {
          this.audioContext.close();
          this.audioContext = null;
        }
      };
    } catch (err) {
      console.warn('Audio analyser failed to start:', err);
      return () => {};
    }
  }

  /**
   * Stop local audio and video tracks.
   */
  stopLocalStream() {
    if (this.localStream) {
      for (const track of this.localStream.getTracks()) {
        track.stop();
      }
      this.localStream = null;
    }
  }

  /**
   * Stop screen share tracks.
   */
  stopScreenStream() {
    if (this.screenStream) {
      for (const track of this.screenStream.getTracks()) {
        track.stop();
      }
      this.screenStream = null;
    }
  }

  /**
   * Cleanup all media resources.
   */
  destroy() {
    this.stopLocalStream();
    this.stopScreenStream();
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

export const defaultMediaManager = new MediaDeviceManager();
