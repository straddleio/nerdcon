import React, { useState } from 'react';
import { cn } from '@/components/ui/utils';

interface RightPanelProps {
  demoView: React.ReactNode;
  logsView?: React.ReactNode;
  generatorView?: React.ReactNode;
  guideView?: React.ReactNode;
}

type TabId = 'demo' | 'logs' | 'generator' | 'guide';

/**
 * Right panel with tabs: Demo (active) and Logs (placeholder)
 * Tab 1: Demo - Shows dashboard cards and pizza tracker
 * Tab 2: Logs - Placeholder for raw request/response + webhooks (Phase 3D)
 * Tab 3: Generator - Optional paykey generator embed
 * Tab 4: Guide - Optional user guide for demo basics
 */
export const RightPanel: React.FC<RightPanelProps> = ({
  demoView,
  logsView,
  generatorView,
  guideView,
}) => {
  const [activeTab, setActiveTab] = useState<TabId>('demo');
  const hasGeneratorTab = Boolean(generatorView);
  const hasGuideTab = Boolean(guideView);

  return (
    <div className="h-full flex flex-col bg-background-card">
      {/* Tab Headers */}
      <div className="flex border-b border-primary/30 bg-background-dark">
        <button
          onClick={() => setActiveTab('demo')}
          className={cn(
            'px-6 py-3 font-pixel text-xs transition-colors border-b-2',
            activeTab === 'demo'
              ? 'text-primary border-primary bg-background-card'
              : 'text-neutral-500 border-transparent hover:text-neutral-300'
          )}
        >
          DEMO
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={cn(
            'px-6 py-3 font-pixel text-xs transition-colors border-b-2',
            activeTab === 'logs'
              ? 'text-secondary border-secondary bg-background-card'
              : 'text-neutral-500 border-transparent hover:text-neutral-300'
          )}
        >
          LOGS
        </button>
        {hasGeneratorTab && (
          <button
            onClick={() => setActiveTab('generator')}
            className={cn(
              'px-6 py-3 font-pixel text-xs transition-colors border-b-2',
              activeTab === 'generator'
                ? 'text-primary border-primary bg-background-card'
                : 'text-neutral-500 border-transparent hover:text-neutral-300'
            )}
          >
            GENERATOR
          </button>
        )}
        {hasGuideTab && (
          <button
            onClick={() => setActiveTab('guide')}
            className={cn(
              'px-6 py-3 font-pixel text-xs transition-colors border-b-2',
              activeTab === 'guide'
                ? 'text-accent border-accent bg-background-card'
                : 'text-neutral-500 border-transparent hover:text-neutral-300'
            )}
          >
            GUIDE
          </button>
        )}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'demo' && (
          <div className="h-full overflow-y-auto scrollbar-retro">{demoView}</div>
        )}
        {activeTab === 'logs' && (
          <div className="h-full overflow-y-auto scrollbar-retro">
            {logsView || (
              <div className="flex items-center justify-center h-full">
                <div className="text-center p-8">
                  <p className="text-neutral-500 font-pixel text-xs mb-2">LOGS VIEW</p>
                  <p className="text-neutral-600 font-body text-xs">Available in Phase 3D</p>
                </div>
              </div>
            )}
          </div>
        )}
        {hasGeneratorTab && activeTab === 'generator' && (
          <div className="h-full overflow-y-auto scrollbar-retro">{generatorView}</div>
        )}
        {hasGuideTab && activeTab === 'guide' && (
          <div className="h-full overflow-y-auto scrollbar-retro">{guideView}</div>
        )}
      </div>
    </div>
  );
};
