import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MediaDeviceManager } from '../src/components/media/mediaDevices';

describe('Real WebRTC Media System (CodeX Inspired)', () => {
  let mediaManager: MediaDeviceManager;

  beforeEach(() => {
    mediaManager = new MediaDeviceManager();
  });

  it('enumerates audio inputs, video inputs, and audio outputs', async () => {
    const mockDevices: MediaDeviceInfo[] = [
      { deviceId: 'mic-1', kind: 'audioinput', label: 'Internal Mic', groupId: 'g1', toJSON: () => ({}) },
      { deviceId: 'cam-1', kind: 'videoinput', label: 'FaceTime HD Camera', groupId: 'g2', toJSON: () => ({}) },
      { deviceId: 'speaker-1', kind: 'audiooutput', label: 'Headphones', groupId: 'g3', toJSON: () => ({}) },
    ];

    // Mock navigator.mediaDevices
    const originalMediaDevices = navigator.mediaDevices;
    (navigator as any).mediaDevices = {
      enumerateDevices: vi.fn().mockResolvedValue(mockDevices),
      getUserMedia: vi.fn(),
      getDisplayMedia: vi.fn(),
    };

    const devices = await mediaManager.enumerateDevices();
    expect(devices.audioInputs).toHaveLength(1);
    expect(devices.audioInputs[0]?.label).toBe('Internal Mic');
    expect(devices.videoInputs).toHaveLength(1);
    expect(devices.videoInputs[0]?.label).toBe('FaceTime HD Camera');
    expect(devices.audioOutputs).toHaveLength(1);

    (navigator as any).mediaDevices = originalMediaDevices;
  });

  it('acquires local video and audio tracks via getUserMedia', async () => {
    const mockTrack = {
      kind: 'video',
      id: 'vid-1',
      enabled: true,
      stop: vi.fn(),
    };
    const mockStream = {
      getVideoTracks: () => [mockTrack],
      getAudioTracks: () => [],
      getTracks: () => [mockTrack],
    } as unknown as MediaStream;

    const originalMediaDevices = navigator.mediaDevices;
    (navigator as any).mediaDevices = {
      getUserMedia: vi.fn().mockResolvedValue(mockStream),
      enumerateDevices: vi.fn().mockResolvedValue([]),
    };

    const stream = await mediaManager.getUserMedia({ video: true, audio: false });
    expect(stream).toBe(mockStream);
    expect(stream?.getVideoTracks()).toHaveLength(1);

    // Stop streams
    mediaManager.stopLocalStream();
    expect(mockTrack.stop).toHaveBeenCalled();

    (navigator as any).mediaDevices = originalMediaDevices;
  });

  it('handles getDisplayMedia for screen sharing', async () => {
    const mockScreenTrack = {
      kind: 'video',
      id: 'screen-1',
      enabled: true,
      stop: vi.fn(),
      onended: null,
    };
    const mockScreenStream = {
      getVideoTracks: () => [mockScreenTrack],
      getTracks: () => [mockScreenTrack],
    } as unknown as MediaStream;

    const originalMediaDevices = navigator.mediaDevices;
    (navigator as any).mediaDevices = {
      getDisplayMedia: vi.fn().mockResolvedValue(mockScreenStream),
    };

    const stream = await mediaManager.getDisplayMedia();
    expect(stream).toBe(mockScreenStream);
    expect(stream?.getVideoTracks()[0]?.id).toBe('screen-1');

    mediaManager.destroy();
    expect(mockScreenTrack.stop).toHaveBeenCalled();

    (navigator as any).mediaDevices = originalMediaDevices;
  });

  it('gracefully degrades when mediaDevices is unavailable', async () => {
    const originalMediaDevices = navigator.mediaDevices;
    delete (navigator as any).mediaDevices;

    const devices = await mediaManager.enumerateDevices();
    expect(devices.audioInputs).toEqual([]);
    expect(devices.videoInputs).toEqual([]);

    const stream = await mediaManager.getUserMedia();
    expect(stream).toBeNull();

    (navigator as any).mediaDevices = originalMediaDevices;
  });
});
