import React, { useState, useRef, useEffect } from 'react';
import { RetroHeading } from '@/components/ui/retro-components';
import { cn } from '@/components/ui/utils';
import { useDemoStore, type TerminalLine } from '@/lib/state';
import { executeCommand, COMMAND_REGISTRY, type CommandInfo } from '@/lib/commands';
import { API_BASE_URL, type Customer, type Paykey, type Charge } from '@/lib/api';
import { CommandMenu, CommandType } from './CommandMenu';
import { CommandAutocomplete } from './CommandAutocomplete';
import { CustomerCard, CustomerFormData } from './cards/CustomerCard';
import { PaykeyCard, PaykeyFormData } from './cards/PaykeyCard';
import { ChargeCard, ChargeFormData, ChargeOutcome } from './cards/ChargeCard';
import { DemoCard } from './cards/DemoCard';
import { ResetCard } from './cards/ResetCard';
import { APILogInline } from './APILogInline';

// Type guards for API responses
function isCustomer(value: unknown): value is Customer {
  return typeof value === 'object' && value !== null && 'id' in value && 'name' in value;
}

function isPaykey(value: unknown): value is Paykey {
  return typeof value === 'object' && value !== null && 'id' in value && 'paykey' in value;
}

function isCharge(value: unknown): value is Charge {
  return typeof value === 'object' && value !== null && 'id' in value && 'amount' in value;
}

/**
 * Terminal component for command input/output
 */
export const Terminal: React.FC = () => {
  const [input, setInput] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [selectedCommand, setSelectedCommand] = useState<CommandType | null>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  const [suggestions, setSuggestions] = useState<CommandInfo[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const terminalHistory = useDemoStore((state) => state.terminalHistory);
  const isExecuting = useDemoStore((state) => state.isExecuting);
  const addTerminalLine = useDemoStore((state) => state.addTerminalLine);
  const setExecuting = useDemoStore((state) => state.setExecuting);
  const customer = useDemoStore((state) => state.customer);
  const paykey = useDemoStore((state) => state.paykey);
  const apiLogs = useDemoStore((state) => state.apiLogs);
  const associateAPILogsWithCommand = useDemoStore((state) => state.associateAPILogsWithCommand);

  // Auto-scroll to bottom when new lines added
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [terminalHistory]);

  // Track the last command ID for associating API logs
  const [lastCommandId, setLastCommandId] = useState<string | null>(null);

  // Associate API logs with terminal lines
  useEffect(() => {
    if (apiLogs.length === 0 || !lastCommandId) {
      return;
    }

    // Find the terminal line with this command ID
    const commandLine = terminalHistory.find((line) => line.id === lastCommandId);
    if (!commandLine) {
      return;
    }

    // Get API logs that occurred after this command (within last 10 seconds)
    const commandTime = commandLine.timestamp.getTime();
    const relevantLogs = apiLogs.filter((log) => {
      const logTime = new Date(log.timestamp).getTime();
      return logTime >= commandTime && logTime < commandTime + 10000;
    });

    if (
      relevantLogs.length > 0 &&
      (!commandLine.apiLogs || commandLine.apiLogs.length < relevantLogs.length)
    ) {
      // Only new logs that aren't already associated
      const existingLogIds = new Set((commandLine.apiLogs || []).map((log) => log.requestId));
      const newLogs = relevantLogs.filter((log) => !existingLogIds.has(log.requestId));

      if (newLogs.length > 0) {
        associateAPILogsWithCommand(lastCommandId, newLogs);
      }
    }
  }, [apiLogs, lastCommandId, terminalHistory, associateAPILogsWithCommand]);

  /**
   * Handle command submission
   */
  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();

    void (async (): Promise<void> => {
      const command = input.trim();
      if (!command) {
        return;
      }

      // Add to history
      setCommandHistory((prev) => [...prev, command]);
      setHistoryIndex(-1);

      // Add input line to terminal and track the command ID
      const commandId = addTerminalLine({ text: `> ${command}`, type: 'input' });
      setLastCommandId(commandId);
      setInput('');
      setExecuting(true);

      try {
        // Check if command exists
        const commandName = command.slice(1).split(/\s+/)[0].toLowerCase();
        const knownCommands = COMMAND_REGISTRY.map((cmd) => cmd.id.slice(1).toLowerCase());

        if (!knownCommands.includes(commandName)) {
          addTerminalLine({
            text: `Unknown command: ${command}. Type /help to see available commands.`,
            type: 'error',
          });
          setExecuting(false);
          return;
        }

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
    })();
  };

  /**
   * Handle input change to update suggestions
   */
  const handleInputChange = (value: string): void => {
    setInput(value);

    const trimmed = value.trim();

    if (!trimmed) {
      // Hide suggestions when input is empty
      setSuggestions([]);
      setShowSuggestions(false);
      setHighlightedIndex(-1);
      return;
    }

    // Normalize input - if it doesn't start with /, add it for matching
    const searchTerm = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;

    // Find commands that start with the normalized search term (case-insensitive)
    const matches = COMMAND_REGISTRY.filter((cmd) =>
      cmd.id.toLowerCase().startsWith(searchTerm.toLowerCase())
    );

    setSuggestions(matches);
    setShowSuggestions(matches.length > 0);
    setHighlightedIndex(matches.length > 0 ? 0 : -1);
  };

  /**
   * Handle arrow key navigation through history, Tab autocomplete, and suggestion navigation
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle suggestion navigation
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightedIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedIndex((prev) => Math.max(prev - 1, 0));
        return;
      }

      if (e.key === 'Tab') {
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
          const selected = suggestions[highlightedIndex];
          // Always insert with leading slash
          setInput(selected.id);
          setShowSuggestions(false);
          setSuggestions([]);
          setHighlightedIndex(-1);
        }
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        setShowSuggestions(false);
        setSuggestions([]);
        setHighlightedIndex(-1);
        return;
      }

      // Enter executes current input (fall through)
    }

    // Original history navigation (only when no suggestions showing)
    if (!showSuggestions) {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (commandHistory.length === 0) {
          return;
        }

        const newIndex =
          historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setInput(commandHistory[newIndex]);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (historyIndex === -1) {
          return;
        }

        const newIndex = historyIndex + 1;
        if (newIndex >= commandHistory.length) {
          setHistoryIndex(-1);
          setInput('');
        } else {
          setHistoryIndex(newIndex);
          setInput(commandHistory[newIndex]);
        }
      }
    }
  };

  /**
   * Handle suggestion selection from autocomplete dropdown
   */
  const handleSuggestionSelect = (commandId: string): void => {
    setInput(commandId);
    setShowSuggestions(false);
    setSuggestions([]);
    setHighlightedIndex(-1);
  };

  /**
   * Handle command selection from menu
   */
  const handleMenuCommand = (command: CommandType) => {
    setSelectedCommand(command);
  };

  /**
   * Handle customer card submission
   */
  const handleCustomerSubmit = (
    data: CustomerFormData,
    outcome: 'standard' | 'verified' | 'review' | 'rejected'
  ): void => {
    void (async (): Promise<void> => {
      setExecuting(true);
      const commandId = addTerminalLine({
        text: `> Creating customer (${outcome})...`,
        type: 'input',
      });
      setLastCommandId(commandId);

      try {
        const response = await fetch(`${API_BASE_URL}/customers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...data,
            outcome,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to create customer');
        }

        const customerData: unknown = await response.json();
        if (!isCustomer(customerData)) {
          throw new Error('Invalid customer data received');
        }
        useDemoStore.getState().setCustomer(customerData);

        addTerminalLine({
          text: `✓ Customer created: ${customerData.id}`,
          type: 'success',
        });
      } catch (error) {
        addTerminalLine({
          text: `✗ Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          type: 'error',
        });
      } finally {
        setExecuting(false);
        setSelectedCommand(null);
      }
    })();
  };

  /**
   * Handle paykey card submission
   */
  const handlePaykeySubmit = (
    data: PaykeyFormData,
    outcome: 'standard' | 'active' | 'rejected',
    method: 'plaid' | 'bank'
  ): void => {
    void (async (): Promise<void> => {
      setExecuting(true);
      const commandId = addTerminalLine({
        text: `> Creating ${method} paykey (${outcome})...`,
        type: 'input',
      });
      setLastCommandId(commandId);

      try {
        const endpoint =
          method === 'plaid'
            ? `${API_BASE_URL}/bridge/plaid`
            : `${API_BASE_URL}/bridge/bank-account`;

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...data,
            outcome,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to create paykey');
        }

        const paykeyData: unknown = await response.json();
        if (!isPaykey(paykeyData)) {
          throw new Error('Invalid paykey data received');
        }
        useDemoStore.getState().setPaykey(paykeyData);

        addTerminalLine({
          text: `✓ Paykey created: ${paykeyData.id}`,
          type: 'success',
        });
      } catch (error) {
        addTerminalLine({
          text: `✗ Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          type: 'error',
        });
      } finally {
        setExecuting(false);
        setSelectedCommand(null);
      }
    })();
  };

  /**
   * Handle charge card submission
   */
  const handleChargeSubmit = (data: ChargeFormData, outcome: ChargeOutcome): void => {
    void (async (): Promise<void> => {
      setExecuting(true);
      const commandId = addTerminalLine({
        text: `> Creating charge (${outcome})...`,
        type: 'input',
      });
      setLastCommandId(commandId);

      try {
        const response = await fetch(`${API_BASE_URL}/charges`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...data,
            currency: 'USD',
            device: { ip_address: '192.168.1.1' },
            outcome,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to create charge');
        }

        const chargeData: unknown = await response.json();
        if (!isCharge(chargeData)) {
          throw new Error('Invalid charge data received');
        }
        useDemoStore.getState().setCharge(chargeData);

        addTerminalLine({
          text: `✓ Charge created: ${chargeData.id}`,
          type: 'success',
        });
      } catch (error) {
        addTerminalLine({
          text: `✗ Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          type: 'error',
        });
      } finally {
        setExecuting(false);
        setSelectedCommand(null);
      }
    })();
  };

  /**
   * Handle demo execution
   */
  const handleDemoExecute = (): void => {
    void (async (): Promise<void> => {
      setSelectedCommand(null);
      const commandId = addTerminalLine({ text: '> /demo', type: 'input' });
      setLastCommandId(commandId);
      setExecuting(true);

      try {
        const result = await executeCommand('/demo');
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
    })();
  };

  /**
   * Handle reset execution
   */
  const handleResetExecute = (): void => {
    void (async (): Promise<void> => {
      setSelectedCommand(null);
      const commandId = addTerminalLine({ text: '> /reset', type: 'input' });
      setLastCommandId(commandId);
      setExecuting(true);

      try {
        const result = await executeCommand('/reset');
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
    })();
  };

  /**
   * Format terminal output with proper nesting and structure
   * Inspired by riced alacritty terminals with our retro color scheme
   */
  const formatTerminalText = (text: string): React.ReactNode => {
    const lines = text.split('\n');

    return lines.map((line, i) => {
      // Detect indentation level
      const indent = line.match(/^(\s+)/)?.[1].length || 0;
      const paddingLeft = Math.floor(indent / 2) * 0.75; // 0.75rem per 2 spaces

      // Detect list items
      const isBullet = /^\s*[•\-*]\s/.test(line);
      const isNumbered = /^\s*\d+[.)]\s/.test(line);

      // Detect key-value pairs (enhanced)
      const keyValueMatch = line.match(/^\s*([A-Za-z_][A-Za-z0-9_\s]*?):\s*(.+)$/);

      // Detect special formatting
      const isSuccess = /^✓/.test(line.trim());
      const isError = /^✗/.test(line.trim());
      const isInfo = /^ℹ/.test(line.trim());

      if (keyValueMatch) {
        const [, key, value] = keyValueMatch;
        return (
          <div
            key={i}
            style={{ paddingLeft: `${paddingLeft}rem` }}
            className="flex gap-2 font-mono text-xs leading-relaxed"
          >
            <span className="text-secondary font-semibold">{key}:</span>
            <span className="text-neutral-300">{value}</span>
          </div>
        );
      }

      return (
        <div
          key={i}
          style={{ paddingLeft: `${paddingLeft}rem` }}
          className={cn(
            'font-mono text-xs leading-relaxed',
            isBullet && "before:content-['▸'] before:mr-2 before:text-primary",
            isNumbered && 'text-gold',
            isSuccess && 'text-accent-green',
            isError && 'text-accent-red',
            isInfo && 'text-secondary'
          )}
        >
          {line.replace(/^\s+/, '')}
        </div>
      );
    });
  };

  /**
   * Render a single terminal line with enhanced alacritty-style formatting
   */
  const renderLine = (line: TerminalLine) => {
    const formattedContent = formatTerminalText(line.text);

    return (
      <div key={line.id} className="mb-1 animate-pixel-fade-in">
        {/* Terminal Line */}
        <div
          className={cn('leading-relaxed transition-colors duration-150', {
            'text-neutral-300 font-mono text-xs': line.type === 'output',
            'text-primary font-display text-sm font-bold tracking-wide': line.type === 'input',
            'text-accent-green font-mono text-xs': line.type === 'success',
            'text-accent-red font-mono text-xs': line.type === 'error',
            'text-secondary font-mono text-xs': line.type === 'info' && !line.source,
            'text-blue-400 italic font-mono text-xs':
              line.type === 'info' && line.source === 'ui-action',
          })}
          data-type={line.type}
        >
          {formattedContent}
        </div>

        {/* Inline API Logs */}
        {line.apiLogs && line.apiLogs.length > 0 && (
          <div className="ml-2 my-1.5 space-y-1">
            {line.apiLogs.map((log, index) => (
              <APILogInline key={`${line.id}-api-${log.requestId}-${index}`} entry={log} />
            ))}
          </div>
        )}
      </div>
    );
  };

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="h-full flex flex-col bg-background-dark p-2">
      {/* Header */}
      <div className="mb-2 pb-2 border-b border-primary/20">
        <RetroHeading level={4} variant="primary" className="text-xs leading-tight tracking-wider">
          STRADDLE TERMINAL v1.0
        </RetroHeading>
        <div className="text-[10px] text-neutral-500 font-mono mt-0.5">Type /help for commands</div>
      </div>

      {/* Output Area - shrinks when menu opens */}
      <div
        ref={outputRef}
        className="flex-1 overflow-y-auto scrollbar-retro font-body text-xs space-y-0 min-h-0 px-1 transition-all duration-300"
        style={{
          scrollBehavior: 'smooth',
          background: 'linear-gradient(180deg, rgba(10,14,26,0) 0%, rgba(10,14,26,0.3) 100%)',
          maxHeight: isMenuOpen ? 'calc(100% - 16rem)' : '100%',
        }}
      >
        {terminalHistory.map((line) => renderLine(line))}
        {isExecuting && (
          <div className="flex items-center gap-2 text-primary animate-pulse font-mono text-xs my-2">
            <div className="flex gap-1">
              <span
                className="inline-block w-1 h-3 bg-primary animate-pulse"
                style={{ animationDelay: '0ms' }}
              ></span>
              <span
                className="inline-block w-1 h-3 bg-primary animate-pulse"
                style={{ animationDelay: '150ms' }}
              ></span>
              <span
                className="inline-block w-1 h-3 bg-primary animate-pulse"
                style={{ animationDelay: '300ms' }}
              ></span>
            </div>
            <span>Processing...</span>
          </div>
        )}
      </div>

      {/* Input Area */}
      <form
        onSubmit={handleSubmit}
        className="relative flex items-center gap-2 border-t border-primary/20 pt-2 mt-2 bg-background-elevated/30 px-2 py-1.5 rounded"
      >
        {/* Autocomplete Dropdown */}
        <CommandAutocomplete
          suggestions={suggestions}
          highlightedIndex={highlightedIndex}
          onSelect={handleSuggestionSelect}
          isVisible={showSuggestions}
        />
        <span className="text-primary font-pixel text-xs animate-pulse">{'>'}</span>
        <input
          type="text"
          value={input}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter command..."
          className="flex-1 bg-transparent border-none outline-none text-primary font-mono text-xs placeholder-neutral-600 disabled:opacity-50"
          disabled={isExecuting}
          autoFocus
        />
        <button
          type="button"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle command menu"
          aria-expanded={isMenuOpen}
          className="bg-gradient-to-r from-accent to-accent/80 text-white font-pixel text-xs px-2 py-1 rounded-pixel shadow-neon-accent hover:shadow-neon-accent-lg hover:from-accent/90 hover:to-accent/70 transition-all duration-300 flex items-center gap-1"
        >
          <span className="text-xs">{isMenuOpen ? '▼' : '▲'}</span>
          <span>MENU</span>
        </button>
      </form>

      {/* Command Menu Panel - part of terminal flow, not overlay */}
      <CommandMenu
        onCommandSelect={(cmd) => {
          handleMenuCommand(cmd);
        }}
        isOpen={isMenuOpen}
      />

      {/* Command Cards */}
      <CustomerCard
        isOpen={selectedCommand === 'customer-create' || selectedCommand === 'customer-kyc'}
        onClose={() => setSelectedCommand(null)}
        onSubmit={handleCustomerSubmit}
        mode={selectedCommand === 'customer-kyc' ? 'kyc' : 'create'}
      />
      <PaykeyCard
        isOpen={selectedCommand === 'paykey-plaid'}
        onClose={() => setSelectedCommand(null)}
        onSubmit={handlePaykeySubmit}
        type="plaid"
        customerId={customer?.id}
      />
      <PaykeyCard
        isOpen={selectedCommand === 'paykey-bank'}
        onClose={() => setSelectedCommand(null)}
        onSubmit={handlePaykeySubmit}
        type="bank"
        customerId={customer?.id}
      />
      <ChargeCard
        isOpen={selectedCommand === 'charge'}
        onClose={() => setSelectedCommand(null)}
        onSubmit={handleChargeSubmit}
        paykeyToken={paykey?.paykey}
      />
      <DemoCard
        isOpen={selectedCommand === 'demo'}
        onClose={() => setSelectedCommand(null)}
        onConfirm={handleDemoExecute}
      />
      <ResetCard
        isOpen={selectedCommand === 'reset'}
        onClose={() => setSelectedCommand(null)}
        onConfirm={handleResetExecute}
      />
    </div>
  );
};
