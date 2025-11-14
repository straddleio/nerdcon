import React, { useState, useRef, useEffect } from 'react';
import { RetroHeading } from '@/components/ui/retro-components';
import { useDemoStore } from '@/lib/state';
import { executeCommand } from '@/lib/commands';

/**
 * Terminal component for command input/output
 */
export const Terminal: React.FC = () => {
  const [input, setInput] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const outputRef = useRef<HTMLDivElement>(null);

  const terminalHistory = useDemoStore((state) => state.terminalHistory);
  const isExecuting = useDemoStore((state) => state.isExecuting);
  const addTerminalLine = useDemoStore((state) => state.addTerminalLine);
  const setExecuting = useDemoStore((state) => state.setExecuting);

  // Auto-scroll to bottom when new lines added
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [terminalHistory]);

  /**
   * Handle command submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const command = input.trim();
    if (!command) return;

    // Add to history
    setCommandHistory((prev) => [...prev, command]);
    setHistoryIndex(-1);

    // Add input line to terminal
    addTerminalLine({ text: `> ${command}`, type: 'input' });
    setInput('');
    setExecuting(true);

    try {
      // Execute command
      const result = await executeCommand(command);

      // Add result to terminal
      if (result.message) {
        addTerminalLine({
          text: result.message,
          type: result.success ? 'success' : 'error',
        });
      }
    } catch (error) {
      addTerminalLine({
        text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'error',
      });
    } finally {
      setExecuting(false);
    }
  };

  /**
   * Handle arrow key navigation through history
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length === 0) return;

      const newIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(newIndex);
      setInput(commandHistory[newIndex]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex === -1) return;

      const newIndex = historyIndex + 1;
      if (newIndex >= commandHistory.length) {
        setHistoryIndex(-1);
        setInput('');
      } else {
        setHistoryIndex(newIndex);
        setInput(commandHistory[newIndex]);
      }
    }
  };

  /**
   * Get CSS class for line type
   */
  const getLineClass = (type: string): string => {
    switch (type) {
      case 'input':
        return 'text-primary font-pixel';
      case 'success':
        return 'text-accent-green';
      case 'error':
        return 'text-accent-red';
      case 'info':
        return 'text-accent-blue';
      default:
        return 'text-neutral-300';
    }
  };

  return (
    <div className="h-full flex flex-col bg-background-dark p-2">
      {/* Header */}
      <div className="mb-1 pb-1 border-b border-primary/30">
        <RetroHeading level={4} variant="primary" className="text-xs leading-tight">
          STRADDLE TERMINAL
        </RetroHeading>
      </div>

      {/* Output Area */}
      <div
        ref={outputRef}
        className="flex-1 overflow-y-auto scrollbar-retro font-body text-xs space-y-0.5 min-h-0"
      >
        {terminalHistory.map((line) => (
          <div key={line.id} className={getLineClass(line.type)}>
            {line.text.split('\n').map((textLine, i) => (
              <div key={i}>{textLine}</div>
            ))}
          </div>
        ))}
        {isExecuting && <div className="text-primary animate-pulse">Processing...</div>}
      </div>

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-primary/30 pt-1 mt-1">
        <span className="text-primary font-pixel text-xs">{'>'}</span>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter command..."
          className="flex-1 bg-transparent border-none outline-none text-primary font-body text-xs placeholder-neutral-600 disabled:opacity-50"
          disabled={isExecuting}
          autoFocus
        />
        <span className="text-primary animate-pulse font-pixel text-xs">_</span>
      </form>
    </div>
  );
};
