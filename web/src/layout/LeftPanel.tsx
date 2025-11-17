import React from 'react';

interface LeftPanelProps {
  terminal: React.ReactNode;
}

/**
 * Left panel with unified terminal
 * API logs now appear inline within terminal
 */
export const LeftPanel: React.FC<LeftPanelProps> = ({ terminal }) => {
  return (
    <div className="h-full">
      {terminal}
    </div>
  );
};
