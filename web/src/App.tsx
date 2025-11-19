import { SplitView } from './layout/SplitView';
import { LeftPanel } from './layout/LeftPanel';
import { RightPanel } from './layout/RightPanel';
import { Terminal } from './components/Terminal';
import { DashboardView } from './components/dashboard/DashboardView';
import { LogsTab } from './components/LogsTab';
import { GeneratorTab } from './components/GeneratorTab';
import { SoundToggle } from './components/settings/SoundToggle';
import { ConnectionStatus } from './components/ConnectionStatus';
import { PaykeyGeneratorModal } from './components/PaykeyGeneratorModal';
import { useSSE } from './lib/useSSE';
import { BridgeModal } from './components/modals/BridgeModal';
import { ReviewDecisionModal } from './components/ReviewDecisionModal';
import { EndDemoBanner } from './components/EndDemoBanner';
import { useDemoStore } from './lib/state';
import { paykeyReviewDecision, customerReviewDecision } from './lib/api';

/**
 * Main App - Straddle NerdCon Live Demo
 * Phase 3A: Static UI shell with retro aesthetic
 * Phase 3B: Terminal + API integration
 * Phase 3C: Dashboard data binding
 * Phase 3D: Real-time webhooks + polish
 */
function App(): React.ReactElement {
  // Connect to SSE for real-time updates
  useSSE();

  const {
    reviewModalData,
    isReviewModalOpen,
    setReviewModalOpen,
    showEndDemoBanner,
    setShowEndDemoBanner,
    addAPILogEntry,
    addTerminalLine,
  } = useDemoStore();

  const handleReviewDecision = async (
    decision: 'verified' | 'rejected' | 'approved'
  ): Promise<void> => {
    if (!reviewModalData) {
      return;
    }

    try {
      if (reviewModalData.type === 'paykey') {
        const apiDecision = decision === 'approved' ? 'approved' : 'rejected';
        await paykeyReviewDecision(reviewModalData.id, apiDecision);

        const action = apiDecision === 'approved' ? 'Approved' : 'Rejected';
        const data = reviewModalData.data as { institution?: string };
        addAPILogEntry({
          type: 'ui-action',
          text: `Paykey review decision: ${action} paykey for ${data.institution || 'unknown'}`,
        });
      } else if (reviewModalData.type === 'customer') {
        // Map decision to customer review decision (no 'approved' for customers)
        const customerDecision =
          decision === 'verified' || decision === 'approved' ? 'verified' : 'rejected';
        await customerReviewDecision(reviewModalData.id, customerDecision);

        const action = customerDecision === 'verified' ? 'Verified' : 'Rejected';
        const data = reviewModalData.data as { name?: string };
        addAPILogEntry({
          type: 'ui-action',
          text: `Customer review decision: ${action} customer ${data.name || 'unknown'}`,
        });
      }
    } catch (error) {
      addTerminalLine({
        type: 'error',
        text: `Failed to submit review decision: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  };

  return (
    <>
      <ConnectionStatus />
      <SplitView
        left={<LeftPanel terminal={<Terminal />} />}
        right={
          <RightPanel
            demoView={<DashboardView />}
            logsView={<LogsTab />}
            generatorView={<GeneratorTab />}
          />
        }
      />
      <SoundToggle />
      <PaykeyGeneratorModal />
      <BridgeModal />
      {reviewModalData && (
        <ReviewDecisionModal
          isOpen={isReviewModalOpen}
          onClose={() => setReviewModalOpen(false)}
          onDecision={handleReviewDecision}
          data={reviewModalData.data as never}
        />
      )}
      <EndDemoBanner isVisible={showEndDemoBanner} onClose={() => setShowEndDemoBanner(false)} />
    </>
  );
}

export default App;
