import React from 'react';
import { cn } from '@/components/ui/utils';
import { motion, AnimatePresence } from 'framer-motion';

export type CommandType =
  | 'customer-create'
  | 'customer-kyc'
  | 'customer-business'
  | 'paykey-plaid'
  | 'paykey-bank'
  | 'paykey-bridge'
  | 'paykey-decision'
  | 'paykey-review'
  | 'charge'
  | 'payout'
  | 'demo'
  | 'info'
  | 'outcomes'
  | 'reset'
  | 'clear'
  | 'help'
  | 'end';

interface CommandButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'utility';
  disabled?: boolean;
}

const CommandButton: React.FC<CommandButtonProps> = ({
  label,
  onClick,
  variant = 'primary',
  disabled = false,
}) => {
  const variantClasses = {
    primary:
      'text-primary border border-primary/70 bg-background-card hover:text-primary hover:border-primary hover:bg-primary/15 hover:shadow-glow-primary/80',
    secondary:
      'text-primary border border-secondary/70 bg-background-card hover:text-primary hover:border-secondary hover:bg-secondary/15 hover:shadow-glow-blue/80',
    utility:
      'text-primary border border-gold/70 bg-background-card hover:text-primary hover:border-gold hover:bg-gold/15 hover:shadow-glow-gold/80',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'w-full px-3 py-2 rounded-pixel',
        'font-pixel text-xs transition-all duration-200',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variantClasses[variant]
      )}
    >
      {label}
    </button>
  );
};

interface CommandMenuProps {
  onCommandSelect: (command: CommandType) => void;
  isOpen: boolean;
}

export const CommandMenu: React.FC<CommandMenuProps> = ({ onCommandSelect, isOpen }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          id="command-menu-panel"
          initial={{ maxHeight: 0, opacity: 0, overflow: 'hidden' }}
          animate={{ maxHeight: 1000, opacity: 1 }}
          exit={{ maxHeight: 0, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className={cn(
            'bg-gradient-to-br from-background-elevated to-background-card',
            'border-t-2 border-primary shadow-neon-primary',
            'p-4'
          )}
        >
          <h2 className="font-pixel text-primary text-sm mb-4 text-glow-primary">COMMAND MENU</h2>

          {/* Command categories */}
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1 scrollbar-retro">
            {/* CUSTOMERS */}
            <div>
              <h3 className="font-pixel text-accent text-xs mb-2 uppercase">Customers</h3>
              <div className="space-y-2">
                <CommandButton
                  label="Create Customer"
                  onClick={() => {
                    onCommandSelect('customer-create');
                    // Menu stays open until user toggles button
                  }}
                  variant="secondary"
                />
                <CommandButton
                  label="Create Customer (KYC)"
                  onClick={() => {
                    onCommandSelect('customer-kyc');
                    // Menu stays open until user toggles button
                  }}
                  variant="secondary"
                />
                <CommandButton
                  label="Create Business"
                  onClick={() => {
                    onCommandSelect('customer-business');
                    // Menu stays open until user toggles button
                  }}
                  variant="secondary"
                />
              </div>
            </div>

            {/* PAYKEYS */}
            <div>
              <h3 className="font-pixel text-accent text-xs mb-2 uppercase">Paykeys</h3>
              <div className="space-y-2">
                <CommandButton
                  label="Straddle"
                  onClick={() => {
                    onCommandSelect('paykey-bridge');
                    // Menu stays open until user toggles button
                  }}
                  variant="secondary"
                />
                <CommandButton
                  label="Plaid"
                  onClick={() => {
                    onCommandSelect('paykey-plaid');
                    // Menu stays open until user toggles button
                  }}
                  variant="secondary"
                />
                <CommandButton
                  label="Quiltt"
                  onClick={() => {
                    // Placeholder - no action
                  }}
                  variant="secondary"
                  disabled
                />
                <CommandButton
                  label="Bank Account"
                  onClick={() => {
                    onCommandSelect('paykey-bank');
                    // Menu stays open until user toggles button
                  }}
                  variant="secondary"
                />
              </div>
            </div>

            {/* PAYMENTS */}
            <div>
              <h3 className="font-pixel text-accent text-xs mb-2 uppercase">Payments</h3>
              <div className="space-y-2">
                <CommandButton
                  label="Charge"
                  onClick={() => {
                    onCommandSelect('charge');
                    // Menu stays open until user toggles button
                  }}
                  variant="secondary"
                />
                <CommandButton
                  label="Payout"
                  onClick={() => {
                    onCommandSelect('payout');
                    // Menu stays open until user toggles button
                  }}
                  variant="secondary"
                  disabled
                />
              </div>
            </div>

            {/* INFO & HELP */}
            <div>
              <h3 className="font-pixel text-accent text-xs mb-2 uppercase">Info & Help</h3>
              <div className="space-y-2">
                <CommandButton
                  label="Help"
                  onClick={() => {
                    onCommandSelect('help');
                    // Menu stays open until user toggles button
                  }}
                  variant="secondary"
                />
              </div>
            </div>

            {/* UTILITIES */}
            <div className="pt-2 border-t border-primary/20">
              <div className="grid grid-cols-4 gap-2">
                <CommandButton
                  label="DEMO"
                  onClick={() => {
                    onCommandSelect('demo');
                    // Menu stays open until user toggles button
                  }}
                  variant="utility"
                />
                <CommandButton
                  label="CLEAR"
                  onClick={() => {
                    onCommandSelect('clear');
                    // Menu stays open until user toggles button
                  }}
                  variant="utility"
                />
                <CommandButton
                  label="RESET"
                  onClick={() => {
                    onCommandSelect('reset');
                    // Menu stays open until user toggles button
                  }}
                  variant="utility"
                />
                <CommandButton
                  label="END"
                  onClick={() => {
                    onCommandSelect('end');
                    // Menu stays open until user toggles button
                  }}
                  variant="utility"
                />
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
