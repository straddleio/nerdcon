import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { WaldoStage } from '../WaldoStage';
import type { GeneratorData } from '../types';

describe('WaldoStage', () => {
  it('should call onComplete immediately when no waldoData', () => {
    const onComplete = vi.fn();
    const generatorData: GeneratorData = {
      customerName: 'Test User',
      waldoData: undefined,
      paykeyToken: 'token_123',
      accountLast4: '1234',
      routingNumber: '021000021',
    };

    render(<WaldoStage generatorData={generatorData} onComplete={onComplete} />);

    // Should call onComplete immediately and only once
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('should not cause infinite loop when no waldoData', () => {
    const onComplete = vi.fn();
    const generatorData: GeneratorData = {
      customerName: 'Test User',
      waldoData: undefined,
      paykeyToken: 'token_123',
      accountLast4: '1234',
      routingNumber: '021000021',
    };

    const { rerender } = render(
      <WaldoStage generatorData={generatorData} onComplete={onComplete} />
    );

    // Re-render multiple times
    rerender(<WaldoStage generatorData={generatorData} onComplete={onComplete} />);
    rerender(<WaldoStage generatorData={generatorData} onComplete={onComplete} />);

    // Should still only call onComplete once
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('should render NameNormalizer when waldoData exists', () => {
    const onComplete = vi.fn();
    const generatorData: GeneratorData = {
      customerName: 'John Smith',
      waldoData: {
        correlationScore: 95,
        matchedName: 'JOHN SMITH',
        namesOnAccount: ['John Smith', 'J Smith'],
      },
      paykeyToken: 'token_123',
      accountLast4: '1234',
      routingNumber: '021000021',
    };

    const { container } = render(
      <WaldoStage generatorData={generatorData} onComplete={onComplete} />
    );

    // Should render the first animation stage
    expect(container.textContent).toContain('Name Normalization');

    // Should not call onComplete immediately
    expect(onComplete).not.toHaveBeenCalled();
  });
});
