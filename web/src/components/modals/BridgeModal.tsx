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

    const paykey = event.data;

    // Get customer for generator data
    const customer = useDemoStore.getState().customer;
    const customerName = customer?.name || 'Customer';

    // Extract WALDO data (only for Plaid paykeys with name_match data)
    const waldoData =
      paykey.source === 'plaid' && paykey.review?.verification_details?.breakdown?.name_match
        ? {
            correlationScore:
              paykey.review.verification_details.breakdown.name_match.correlation_score ?? 0,
            matchedName: paykey.review.verification_details.breakdown.name_match.matched_name ?? '',
            namesOnAccount:
              paykey.review.verification_details.breakdown.name_match.names_on_account ?? [],
          }
        : undefined;

    // Extract account details
    const accountLast4 = paykey.bank_data?.account_number?.slice(-4) ?? '****';
    const routingNumber = paykey.bank_data?.routing_number ?? '';

    // Trigger generator modal BEFORE closing Bridge
    useDemoStore.getState().setGeneratorData({
      customerName,
      waldoData,
      paykeyToken: paykey.paykey,
      accountLast4,
      routingNumber,
    });

    // Update state
    setPaykey(paykey);
    addTerminalLine({
      text: `✓ Paykey created via Bridge: ${paykey.id}`,
      type: 'success',
      source: 'ui-action',
    });

    // Don't close yet - wait for user to click the CTA button
  };

  const handleSuccessCTAClicked = (): void => {
    // User clicked "Return" button on success screen
    setBridgeToken(null);
    setBridgeModalOpen(false);
  };

  const handleExit = (): void => {
    // Force remove Straddle iframe that doesn't cleanup automatically
    const iframe = document.getElementById('Straddle-widget-iframe');
    if (iframe) {
      iframe.remove();
    }

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

  // ESC key handler
  React.useEffect(() => {
    const handleEsc = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        handleExit();
      }
    };

    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  // Cleanup orphaned iframe on unmount (defense in depth)
  React.useEffect(() => {
    return () => {
      const iframe = document.getElementById('Straddle-widget-iframe');
      if (iframe) {
        iframe.remove();
      }
    };
  }, []);

  if (!bridgeToken || bridgeToken.trim() === '') {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      {isBridgeModalOpen && (
        <div
          className="bridge-backdrop fixed inset-0 backdrop-blur-sm bg-gradient-to-br from-background-dark/80 via-primary/30 to-background/90"
          onClick={handleExit}
        />
      )}

      {/* Bridge Widget - only render when modal is open */}
      {isBridgeModalOpen && (
        <StraddleBridge
          token={bridgeToken}
          mode="sandbox"
          open={true}
          onSuccess={handleSuccess}
          onSuccessCTAClicked={handleSuccessCTAClicked}
          onClose={handleExit}
          onLoadError={handleLoadError}
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '480px',
            height: '678px',
            zIndex: 2147483647,
            border: '3px solid #00FFFF',
            borderRadius: '12px',
            boxShadow: '0 0 30px rgba(0, 255, 255, 0.5)',
          }}
        />
      )}

      {/* Close button overlay */}
      {isBridgeModalOpen && (
        <button
          onClick={handleExit}
          className="fixed top-4 right-4 z-[2147483648] px-3 py-2 bg-accent text-background font-pixel text-xs rounded border-2 border-accent shadow-glow-accent hover:bg-accent/90 transition-colors"
          aria-label="Close Bridge widget"
        >
          ✕ ESC
        </button>
      )}
    </>
  );
};
