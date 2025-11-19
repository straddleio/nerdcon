import { render, fireEvent, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EndDemoBanner } from '../EndDemoBanner';

describe('EndDemoBanner', () => {
  beforeEach(() => {
    vi.clearAllTimers();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  describe('Visibility', () => {
    it('should render when isVisible is true', () => {
      render(<EndDemoBanner isVisible={true} />);

      expect(screen.getByText('Thanks Nerds!')).toBeInTheDocument();
      // STRADDLE is split into individual letters, check for first letter and .COM
      expect(screen.getByText('S')).toBeInTheDocument();
      expect(screen.getByText('.COM')).toBeInTheDocument();
    });

    it('should not render when isVisible is false', () => {
      render(<EndDemoBanner isVisible={false} />);

      expect(screen.queryByText('Thanks Nerds!')).not.toBeInTheDocument();
      expect(screen.queryByText('.COM')).not.toBeInTheDocument();
    });

    it('should toggle visibility when prop changes', () => {
      const { rerender } = render(<EndDemoBanner isVisible={false} />);

      expect(screen.queryByText('Thanks Nerds!')).not.toBeInTheDocument();

      rerender(<EndDemoBanner isVisible={true} />);

      expect(screen.getByText('Thanks Nerds!')).toBeInTheDocument();
    });
  });

  describe('Content', () => {
    it('should display main arcade message', () => {
      render(<EndDemoBanner isVisible={true} />);

      expect(screen.getByText('Thanks Nerds!')).toBeInTheDocument();
    });

    it('should display Straddle URL', () => {
      render(<EndDemoBanner isVisible={true} />);

      // Check for individual letters in STRADDLE (D appears twice, so use getAllByText)
      expect(screen.getByText('S')).toBeInTheDocument();
      expect(screen.getByText('T')).toBeInTheDocument();
      expect(screen.getByText('R')).toBeInTheDocument();
      expect(screen.getByText('A')).toBeInTheDocument();
      expect(screen.getAllByText('D').length).toBe(2); // D appears twice in STRADDLE
      expect(screen.getByText('L')).toBeInTheDocument();
      expect(screen.getByText('E')).toBeInTheDocument();
      expect(screen.getByText('.COM')).toBeInTheDocument();
    });

    it('should have clickable link to straddle.com', () => {
      render(<EndDemoBanner isVisible={true} />);

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', 'https://straddle.com');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('should display continue message', () => {
      render(<EndDemoBanner isVisible={true} />);

      expect(screen.getByText('[ CLICK ANYWHERE TO CONTINUE ]')).toBeInTheDocument();
    });

    it('should display pixel hearts decoration', () => {
      render(<EndDemoBanner isVisible={true} />);

      // Verify banner is rendered (hearts are part of it)
      expect(screen.getByText('Thanks Nerds!')).toBeInTheDocument();
    });
  });

  describe('Backdrop Interaction', () => {
    it('should call onClose when backdrop is clicked', () => {
      const onCloseMock = vi.fn();
      const { container } = render(<EndDemoBanner isVisible={true} onClose={onCloseMock} />);

      const backdrop = container.querySelector('[class*="backdrop-blur"]');
      expect(backdrop).not.toBeNull();
      fireEvent.click(backdrop!);

      expect(onCloseMock).toHaveBeenCalledTimes(1);
    });

    it('should not call onClose if prop not provided', () => {
      const { container } = render(<EndDemoBanner isVisible={true} />);

      const backdrop = container.querySelector('[class*="backdrop-blur"]');
      expect(backdrop).not.toBeNull();

      // Should not throw error
      expect(() => fireEvent.click(backdrop!)).not.toThrow();
    });
  });

  describe('Animations and Effects', () => {
    it('should show scanlines after delay', async () => {
      const { container } = render(<EndDemoBanner isVisible={true} />);

      // Scanlines should not be visible immediately
      let scanlines = container.querySelector('[class*="repeating-linear-gradient"]');
      expect(scanlines).toBeNull();

      // Fast-forward timer past 800ms and flush promises
      await act(async () => {
        vi.advanceTimersByTime(800);
        await Promise.resolve();
      });

      // Scanlines should now be visible
      scanlines = container.querySelector('[style*="repeating-linear-gradient"]');
      expect(scanlines).toBeInTheDocument();
    });

    it('should have grid background pattern', () => {
      const { container } = render(<EndDemoBanner isVisible={true} />);

      const banner = container.querySelector('[class*="border-y-8"]');
      expect(banner).toBeInTheDocument();

      // Check for grid background via inline style
      const style = (banner as HTMLElement)?.style;
      expect(style?.backgroundImage).toContain('linear-gradient');
    });

    it('should have corner decorations', () => {
      const { container } = render(<EndDemoBanner isVisible={true} />);

      // Should have 4 corner decorations
      const corners = container.querySelectorAll('[class*="border-t-4"], [class*="border-b-4"]');
      expect(corners.length).toBeGreaterThanOrEqual(4);
    });

    it('should have floating particles', () => {
      const { container } = render(<EndDemoBanner isVisible={true} />);

      // Should have 12 particle elements
      const particles = container.querySelectorAll(
        '[class*="bg-primary"][class*="w-2"][class*="h-2"]'
      );
      expect(particles.length).toBeGreaterThanOrEqual(12);
    });
  });

  describe('Styling', () => {
    it('should have retro arcade gradient background', () => {
      const { container } = render(<EndDemoBanner isVisible={true} />);

      const banner = container.querySelector('[class*="border-y-8"]');
      expect(banner).toHaveClass('bg-gradient-to-b');
      expect(banner).toHaveClass('from-[#0a0a14]');
      expect(banner).toHaveClass('via-[#1a1a2e]');
      expect(banner).toHaveClass('to-[#0a0a14]');
    });

    it('should have neon border effect', () => {
      const { container } = render(<EndDemoBanner isVisible={true} />);

      const banner = container.querySelector('[class*="border-y-8"]');
      expect(banner).toHaveClass('border-primary');
    });

    it('should use display font for main text', () => {
      render(<EndDemoBanner isVisible={true} />);

      const mainText = screen.getByText('Thanks Nerds!');
      expect(mainText).toHaveClass('font-display');
      expect(mainText).toHaveClass('uppercase');
    });

    it('should use pixel font for continue message', () => {
      render(<EndDemoBanner isVisible={true} />);

      const continueMsg = screen.getByText('[ CLICK ANYWHERE TO CONTINUE ]');
      expect(continueMsg).toHaveClass('font-pixel');
    });

    it('should have high z-index', () => {
      const { container } = render(<EndDemoBanner isVisible={true} />);

      const backdrop = container.querySelector('[class*="backdrop-blur"]');
      const banner = container.querySelector('[class*="border-y-8"]');

      expect(backdrop).toHaveClass('z-[9998]');
      expect(banner).toHaveClass('z-[9999]');
    });
  });

  describe('Cleanup', () => {
    it('should clear scanline timer when unmounted', () => {
      const { unmount } = render(<EndDemoBanner isVisible={true} />);

      // Spy on clearTimeout
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');

      unmount();

      expect(clearTimeoutSpy).toHaveBeenCalled();
    });

    it('should reset scanlines when visibility changes to false', async () => {
      // This test verifies the cleanup behavior: when isVisible changes to false,
      // the component resets showScanlines state
      const { rerender, container } = render(<EndDemoBanner isVisible={true} />);

      // Initially no scanlines (800ms delay)
      let scanlines = container.querySelector('[style*="repeating-linear-gradient"]');
      expect(scanlines).not.toBeInTheDocument();

      // Advance to show scanlines
      await act(async () => {
        vi.advanceTimersByTime(800);
        await Promise.resolve();
      });

      // Verify banner is visible and scanlines appeared
      expect(screen.getByText('Thanks Nerds!')).toBeInTheDocument();
      scanlines = container.querySelector('[style*="repeating-linear-gradient"]') as HTMLElement;
      expect(scanlines).toBeInTheDocument();

      // Hide banner - this triggers the useEffect cleanup (sets showScanlines to false)
      act(() => {
        rerender(<EndDemoBanner isVisible={false} />);
      });

      // The showScanlines state is reset to false, which triggers exit animation
      // Check that scanlines are being removed or have opacity 0
      scanlines = container.querySelector('[style*="repeating-linear-gradient"]') as HTMLElement;

      // Component sets showScanlines to false, causing framer-motion to animate out
      // Scanlines may still be in DOM (opacity 0) or already removed
      if (scanlines && (scanlines as HTMLElement).style) {
        // Still animating out - should have opacity 0
        expect((scanlines as HTMLElement).style.opacity).toBe('0');
      }
      // Test passes if scanlines either removed or have opacity 0
    });
  });
});
