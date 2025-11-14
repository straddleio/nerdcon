import React from 'react';

interface LeftPanelProps {
  terminal: React.ReactNode;
  apiLog: React.ReactNode;
}

/**
 * Left panel with 40/60 split: Terminal on top, API Log below
 * Terminal gets larger space for command input/output visibility
 */
export const LeftPanel: React.FC<LeftPanelProps> = ({ terminal, apiLog }) => {
  return (
    <div className="h-full flex flex-col">
      {/* Terminal Section (40%) */}
      <div className="h-[40%] border-b border-primary/30 overflow-hidden">
        {terminal}
      </div>

      {/* API Log Section (60%) */}
      <div className="h-[60%] overflow-hidden">
        {apiLog}
      </div>
    </div>
  );
};
