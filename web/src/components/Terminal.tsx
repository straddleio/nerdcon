import React, { useState, useRef, useEffect } from 'react';
import { RetroHeading } from '@/components/ui/retro-components';
import { cn } from '@/components/ui/utils';
import { useDemoStore } from '@/lib/state';
import { executeCommand, AVAILABLE_COMMANDS } from '@/lib/commands';

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
   * Handle arrow key navigation through history and Tab autocomplete
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();

      const currentInput = input.trim();
      if (!currentInput) {
        // Show all commands if nothing typed
        setInput('/');
        return;
      }

      // Find matching commands
      const matches = AVAILABLE_COMMANDS.filter(cmd =>
        cmd.toLowerCase().startsWith(currentInput.toLowerCase())
      );

      if (matches.length === 1) {
        // Exact match - autocomplete
        setInput(matches[0] + ' ');
      } else if (matches.length > 1) {
        // Multiple matches - find common prefix
        const commonPrefix = matches.reduce((prefix, cmd) => {
          let i = 0;
          while (i < prefix.length && i < cmd.length &&
                 prefix[i].toLowerCase() === cmd[i].toLowerCase()) {
            i++;
          }
          return prefix.slice(0, i);
        }, matches[0]);

        if (commonPrefix.length > currentInput.length) {
          setInput(commonPrefix);
        }
      }
    } else if (e.key === 'ArrowUp') {
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
   * Format terminal output with proper nesting and structure
   * Inspired by modern terminal emulators (alacritty, kitty)
   */
  const formatTerminalText = (text: string): React.ReactNode => {
    const lines = text.split('\n');

    return lines.map((line, i) => {
      // Detect indentation level
      const indent = line.match(/^(\s+)/)?.[1].length || 0;
      const paddingLeft = indent * 0.5; // 0.5rem per 2 spaces

      // Detect list items
      const isBullet = /^\s*[•\-\*]\s/.test(line);
      const isNumbered = /^\s*\d+[\.\)]\s/.test(line);

      // Detect key-value pairs
      const isKeyValue = /^\s*[A-Za-z_][A-Za-z0-9_\s]*:\s/.test(line);

      return (
        <div
          key={i}
          style={{ paddingLeft: `${paddingLeft}rem` }}
          className={cn(
            isBullet && "before:content-['▸'] before:mr-1 before:text-primary/60",
            isNumbered && "font-mono",
            isKeyValue && "font-body text-neutral-300"
          )}
        >
          {line.replace(/^\s+/, '')}
        </div>
      );
    });
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
            {formatTerminalText(line.text)}
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
