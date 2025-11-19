import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  setSoundEnabled,
  isSoundEnabled,
  playApproveSound,
  playRejectSound,
  playReviewAlertSound,
  playEndDemoSound,
  playChargeStatusSound,
} from '../sounds';

describe('Sound System', () => {
  beforeEach(() => {
    // Mock HTMLAudioElement
    global.Audio = vi.fn().mockImplementation(() => ({
      play: vi.fn().mockResolvedValue(undefined),
      pause: vi.fn(),
      load: vi.fn(),
      volume: 0,
    })) as unknown as typeof Audio;

    // Enable sound for tests
    setSoundEnabled(true);
  });

  describe('sound system state', () => {
    it('should be enabled by default', () => {
      expect(isSoundEnabled()).toBe(true);
    });

    it('should allow enabling/disabling', () => {
      setSoundEnabled(false);
      expect(isSoundEnabled()).toBe(false);

      setSoundEnabled(true);
      expect(isSoundEnabled()).toBe(true);
    });
  });

  describe('playReviewAlertSound', () => {
    it('should create audio element with correct path', async () => {
      await playReviewAlertSound();

      expect(global.Audio).toHaveBeenCalledWith('/sounds/review_alert.mp3');
    });

    it('should play the audio', async () => {
      const mockPlay = vi.fn().mockResolvedValue(undefined);
      global.Audio = class {
        volume = 1;
        play = mockPlay;
        pause(): void {}
      } as unknown as typeof Audio;

      const result = await playReviewAlertSound();

      expect(mockPlay).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should not play when sound is disabled', async () => {
      setSoundEnabled(false);

      const result = await playReviewAlertSound();

      expect(global.Audio).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });

    it('should handle errors gracefully', async () => {
      const mockPlay = vi.fn().mockRejectedValue(new Error('Play failed'));
      global.Audio = class {
        volume = 1;
        play = mockPlay;
        pause(): void {}
      } as unknown as typeof Audio;

      const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await playReviewAlertSound();

      expect(result).toBe(false);
      expect(consoleWarn).toHaveBeenCalledWith(
        'Review alert sound failed to play:',
        expect.any(Error)
      );

      consoleWarn.mockRestore();
    });
  });

  describe('playEndDemoSound', () => {
    it('should create audio element with correct path', async () => {
      await playEndDemoSound();

      expect(global.Audio).toHaveBeenCalledWith('/sounds/end_demo.mp3');
    });

    it('should play the audio', async () => {
      const mockPlay = vi.fn().mockResolvedValue(undefined);
      global.Audio = class {
        volume = 1;
        play = mockPlay;
        pause(): void {}
      } as unknown as typeof Audio;

      const result = await playEndDemoSound();

      expect(mockPlay).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should not play when sound is disabled', async () => {
      setSoundEnabled(false);

      const result = await playEndDemoSound();

      expect(global.Audio).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });
  });

  describe('playChargeStatusSound', () => {
    it('should create audio element with correct path', async () => {
      await playChargeStatusSound();

      expect(global.Audio).toHaveBeenCalledWith('/sounds/charge_status_event.mp3');
    });

    it('should play the audio', async () => {
      const mockPlay = vi.fn().mockResolvedValue(undefined);
      global.Audio = class {
        volume = 1;
        play = mockPlay;
        pause(): void {}
      } as unknown as typeof Audio;

      const result = await playChargeStatusSound();

      expect(mockPlay).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should not play when sound is disabled', async () => {
      setSoundEnabled(false);

      const result = await playChargeStatusSound();

      expect(global.Audio).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });

    it('should handle errors gracefully', async () => {
      const mockPlay = vi.fn().mockRejectedValue(new Error('Play failed'));
      global.Audio = class {
        volume = 1;
        play = mockPlay;
        pause(): void {}
      } as unknown as typeof Audio;

      const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await playChargeStatusSound();

      expect(result).toBe(false);
      expect(consoleWarn).toHaveBeenCalledWith(
        'Charge status sound failed to play:',
        expect.any(Error)
      );

      consoleWarn.mockRestore();
    });
  });

  describe('existing sounds still work', () => {
    it('should play approve sound', async () => {
      await playApproveSound();

      expect(global.Audio).toHaveBeenCalledWith('/sounds/approve.mp3');
    });

    it('should play reject sound', async () => {
      await playRejectSound();

      expect(global.Audio).toHaveBeenCalledWith('/sounds/reject.mp3');
    });
  });
});
