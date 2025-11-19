import React from 'react';
import { StraddleBridge } from '@straddleio/bridge-react';
import { useDemoStore } from '../../lib/state';
import { Paykey } from '../../lib/api';

export const BridgeModal: React.FC = () => {
  const {
    isBridgeModalOpen,
    bridgeToken,
    setBridgeModalOpen,
    setBridgeToken,
    setPaykey,
    addTerminalLine,
  } = useDemoStore();

  if (!isBridgeModalOpen || !bridgeToken || bridgeToken.trim() === '') {
    return null;
  }

  const handleSuccess = (event: { data: Paykey }): void => {
    if (!event?.data?.id) {
      addTerminalLine({
        text: '✗ Invalid paykey data received from Bridge',
        type: 'error',
        source: 'ui-action',
      });
      setBridgeToken(null);
      setBridgeModalOpen(false);
      return;
    }

    setPaykey(event.data);
    addTerminalLine({
      text: `✓ Paykey created via Bridge: ${event.data.id}`,
      type: 'success',
      source: 'ui-action',
    });
    setBridgeToken(null);
    setBridgeModalOpen(false);
  };

  const handleExit = (): void => {
    addTerminalLine({
      text: 'Bridge widget closed',
      type: 'info',
      source: 'ui-action',
    });
    setBridgeToken(null);
    setBridgeModalOpen(false);
  };

  const handleLoadError = (error: unknown): void => {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    addTerminalLine({
      text: `✗ Failed to load Bridge widget: ${errorMsg}`,
      type: 'error',
      source: 'ui-action',
    });
    setBridgeToken(null);
    setBridgeModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <StraddleBridge
        token={bridgeToken}
        mode="sandbox"
        open={true}
        onSuccess={handleSuccess}
        onClose={handleExit}
        onLoadError={handleLoadError}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '480px',
          height: '600px',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
          backgroundColor: 'white',
        }}
      />
    </div>
  );
};
