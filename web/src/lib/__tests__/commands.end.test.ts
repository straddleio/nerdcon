import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeCommand } from '../commands';
import * as sounds from '../sounds';

vi.mock('../sounds', () => ({
  playEndDemoSound: vi.fn().mockResolvedValue(true),
}));

global.fetch = vi.fn();

describe('/end command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should play end_demo audio', async () => {
    await executeCommand('/end');

    expect(sounds.playEndDemoSound).toHaveBeenCalled();
  });

  it('should return success message', async () => {
    const result = await executeCommand('/end');

    expect(result.message).toContain('Demo ended');
  });

  it('should work without arguments', async () => {
    const result = await executeCommand('/end');

    expect(result).toBeTruthy();
    expect(sounds.playEndDemoSound).toHaveBeenCalled();
  });
});
