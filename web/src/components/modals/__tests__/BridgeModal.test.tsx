import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BridgeModal } from '../BridgeModal';
import { useDemoStore } from '../../../lib/state';

// Mock StraddleBridge component
interface MockStraddleBridgeProps {
  onSuccess: (event: { data: { id: string } }) => void;
  onSuccessCTAClicked?: () => void;
  onClose: () => void;
  onLoadError: (error: string) => void;
  token: string;
}

vi.mock('@straddleio/bridge-react', () => ({
  StraddleBridge: ({
    onSuccess,
    onClose,
    onLoadError,
    onSuccessCTAClicked,
    token,
  }: MockStraddleBridgeProps): JSX.Element => (
    <div data-testid="straddle-bridge">
      <span>Bridge Widget (Token: {token})</span>
      <button onClick={() => onSuccess({ data: { id: 'paykey_123' } })}>Success</button>
      <button onClick={onSuccessCTAClicked}>Return</button>
      <button onClick={onClose}>Close</button>
      <button onClick={() => onLoadError('Load Error')}>Error</button>
    </div>
  ),
}));

describe('BridgeModal', () => {
  beforeEach(() => {
    useDemoStore.getState().reset();
  });

  it('should not render when closed', () => {
    render(<BridgeModal />);
    expect(screen.queryByTestId('straddle-bridge')).not.toBeInTheDocument();
  });

  it('should render when open with token', () => {
    useDemoStore.getState().setBridgeToken('test_token');
    useDemoStore.getState().setBridgeModalOpen(true);

    render(<BridgeModal />);
    expect(screen.getByTestId('straddle-bridge')).toBeInTheDocument();
    expect(screen.getByText('Bridge Widget (Token: test_token)')).toBeInTheDocument();
  });

  it('should handle success', () => {
    useDemoStore.getState().setBridgeToken('test_token');
    useDemoStore.getState().setBridgeModalOpen(true);

    render(<BridgeModal />);
    fireEvent.click(screen.getByText('Success'));

    const state = useDemoStore.getState();
    expect(state.paykey?.id).toBe('paykey_123');
    expect(state.isBridgeModalOpen).toBe(true); // stays open until CTA clicked
    expect(state.terminalHistory.some((l) => l.text.includes('Paykey created via Bridge'))).toBe(
      true
    );
  });

  it('should close after success CTA click', () => {
    useDemoStore.getState().setBridgeToken('test_token');
    useDemoStore.getState().setBridgeModalOpen(true);

    render(<BridgeModal />);
    fireEvent.click(screen.getByText('Success'));
    fireEvent.click(screen.getByText('Return'));

    const state = useDemoStore.getState();
    expect(state.isBridgeModalOpen).toBe(false);
  });

  it('should handle close', () => {
    useDemoStore.getState().setBridgeToken('test_token');
    useDemoStore.getState().setBridgeModalOpen(true);

    render(<BridgeModal />);
    fireEvent.click(screen.getByText('Close'));

    const state = useDemoStore.getState();
    expect(state.isBridgeModalOpen).toBe(false);
    expect(state.terminalHistory.some((l) => l.text.includes('Bridge widget closed'))).toBe(true);
  });

  it('should handle load error', () => {
    useDemoStore.getState().setBridgeToken('test_token');
    useDemoStore.getState().setBridgeModalOpen(true);

    render(<BridgeModal />);
    fireEvent.click(screen.getByText('Error'));

    const state = useDemoStore.getState();
    expect(state.isBridgeModalOpen).toBe(false);
    expect(state.terminalHistory.some((l) => l.text.includes('Failed to load Bridge widget'))).toBe(
      true
    );
  });
});
