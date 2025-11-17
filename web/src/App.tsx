import { SplitView } from './layout/SplitView';
import { LeftPanel } from './layout/LeftPanel';
import { RightPanel } from './layout/RightPanel';
import { Terminal } from './components/Terminal';
import { DashboardView } from './components/dashboard/DashboardView';
import { LogsTab } from './components/LogsTab';
import { SoundToggle } from './components/settings/SoundToggle';
import { ConnectionStatus } from './components/ConnectionStatus';
import { useSSE } from './lib/useSSE';

/**
 * Main App - Straddle NerdCon Live Demo
 * Phase 3A: Static UI shell with retro aesthetic
 * Phase 3B: Terminal + API integration
 * Phase 3C: Dashboard data binding
 * Phase 3D: Real-time webhooks + polish
 */
function App() {
  // Connect to SSE for real-time updates
  useSSE();

  return (
    <>
      <ConnectionStatus />
      <SplitView
        left={
          <LeftPanel
            terminal={<Terminal />}
          />
        }
        right={
          <RightPanel
            demoView={<DashboardView />}
            logsView={<LogsTab />}
          />
        }
      />
      <SoundToggle />
    </>
  );
}

export default App;
