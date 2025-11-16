import React, { useState, useRef, useEffect } from 'react';
import { RetroHeading } from '@/components/ui/retro-components';
import { cn } from '@/components/ui/utils';
import { useDemoStore } from '@/lib/state';
import { executeCommand, AVAILABLE_COMMANDS } from '@/lib/commands';
import { API_BASE_URL } from '@/lib/api';
import { CommandMenu, CommandType } from './CommandMenu';
import { CustomerCard, CustomerFormData } from './cards/CustomerCard';
import { PaykeyCard, PaykeyFormData } from './cards/PaykeyCard';
import { ChargeCard, ChargeFormData, ChargeOutcome } from './cards/ChargeCard';
import { DemoCard } from './cards/DemoCard';
import { ResetCard } from './cards/ResetCard';

/**
 * Terminal component for command input/output
 */
export const Terminal: React.FC = () => {
  const [input, setInput] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [selectedCommand, setSelectedCommand] = useState<CommandType | null>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  const terminalHistory = useDemoStore((state) => state.terminalHistory);
  const isExecuting = useDemoStore((state) => state.isExecuting);
  const addTerminalLine = useDemoStore((state) => state.addTerminalLine);
  const setExecuting = useDemoStore((state) => state.setExecuting);
  const customer = useDemoStore((state) => state.customer);
  const paykey = useDemoStore((state) => state.paykey);

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
   * Handle command selection from menu
   */
  const handleMenuCommand = (command: CommandType) => {
    setSelectedCommand(command);
  };

  /**
   * Handle customer card submission
   */
  const handleCustomerSubmit = async (
    data: CustomerFormData,
    outcome: 'standard' | 'verified' | 'review' | 'rejected'
  ) => {
    setExecuting(true);
    addTerminalLine({ text: `> Creating customer (${outcome})...`, type: 'input' });

    try {
      const response = await fetch(`${API_BASE_URL}/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          outcome
        })
      });

      if (!response.ok) throw new Error('Failed to create customer');

      const customerData = await response.json();
      useDemoStore.getState().setCustomer(customerData);

      addTerminalLine({
        text: `✓ Customer created: ${customerData.id}`,
        type: 'success'
      });
    } catch (error) {
      addTerminalLine({
        text: `✗ Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'error'
      });
    } finally {
      setExecuting(false);
      setSelectedCommand(null);
    }
  };

  /**
   * Handle paykey card submission
   */
  const handlePaykeySubmit = async (
    data: PaykeyFormData,
    outcome: 'standard' | 'active' | 'rejected',
    method: 'plaid' | 'bank'
  ) => {
    setExecuting(true);
    addTerminalLine({ text: `> Creating ${method} paykey (${outcome})...`, type: 'input' });

    try {
      const endpoint = method === 'plaid'
        ? `${API_BASE_URL}/bridge/plaid`
        : `${API_BASE_URL}/bridge/bank-account`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          outcome
        })
      });

      if (!response.ok) throw new Error('Failed to create paykey');

      const paykeyData = await response.json();
      useDemoStore.getState().setPaykey(paykeyData);

      addTerminalLine({
        text: `✓ Paykey created: ${paykeyData.id}`,
        type: 'success'
      });
    } catch (error) {
      addTerminalLine({
        text: `✗ Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'error'
      });
    } finally {
      setExecuting(false);
      setSelectedCommand(null);
    }
  };

  /**
   * Handle charge card submission
   */
  const handleChargeSubmit = async (
    data: ChargeFormData,
    outcome: ChargeOutcome
  ) => {
    setExecuting(true);
    addTerminalLine({ text: `> Creating charge (${outcome})...`, type: 'input' });

    try {
      const response = await fetch(`${API_BASE_URL}/charges`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          currency: 'USD',
          device: { ip_address: '192.168.1.1' },
          outcome
        })
      });

      if (!response.ok) throw new Error('Failed to create charge');

      const chargeData = await response.json();
      useDemoStore.getState().setCharge(chargeData);

      addTerminalLine({
        text: `✓ Charge created: ${chargeData.id}`,
        type: 'success'
      });
    } catch (error) {
      addTerminalLine({
        text: `✗ Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'error'
      });
    } finally {
      setExecuting(false);
      setSelectedCommand(null);
    }
  };

  /**
   * Handle demo execution
   */
  const handleDemoExecute = async () => {
    setSelectedCommand(null);
    addTerminalLine({ text: '> /demo', type: 'input' });
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
  };

  /**
   * Handle reset execution
   */
  const handleResetExecute = async () => {
    setSelectedCommand(null);
    addTerminalLine({ text: '> /reset', type: 'input' });
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
      const isBullet = /^\s*[•\-*]\s/.test(line);
      const isNumbered = /^\s*\d+[.)]\s/.test(line);

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
   * Render a single terminal line with cleaner styles
   */
  const renderLine = (line: { id: string; text: string; type: string }) => {
    const formattedContent = formatTerminalText(line.text);

    return (
      <div
        key={line.id}
        className={cn(
          'font-mono text-sm leading-relaxed',
          {
            'text-neutral-300': line.type === 'output',
            'text-primary font-medium': line.type === 'input',
            'text-accent-green': line.type === 'success',
            'text-accent-red': line.type === 'error',
            'text-secondary': line.type === 'info',
          }
        )}
        data-type={line.type}
      >
        {formattedContent}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-background-dark p-2 relative">
      {/* Command Menu */}
      <CommandMenu onCommandSelect={handleMenuCommand} />

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
        {terminalHistory.map((line) => renderLine(line))}
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
