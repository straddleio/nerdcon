import React from 'react';
import { cn } from '@/components/ui/utils';
import { motion, AnimatePresence } from 'framer-motion';

export type CommandType =
  | 'customer-create'
  | 'customer-kyc'
  | 'paykey-plaid'
  | 'paykey-bank'
  | 'charge'
  | 'payout'
  | 'demo'
  | 'reset';

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
  disabled = false
}) => {
  const variantClasses = {
    primary: 'bg-primary/20 border-primary text-primary hover:bg-primary/30',
    secondary: 'bg-secondary/20 border-secondary text-secondary hover:bg-secondary/30',
    utility: 'bg-gold/20 border-gold text-gold hover:bg-gold/30',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-full px-3 py-2 rounded-pixel border-2",
        "font-pixel text-xs transition-all duration-200",
        "hover:shadow-neon-primary disabled:opacity-50 disabled:cursor-not-allowed",
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
  onClose: () => void;
}

export const CommandMenu: React.FC<CommandMenuProps> = ({ onCommandSelect, isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          id="command-menu-panel"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: '16rem', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className={cn(
            "bg-gradient-to-br from-background-elevated to-background-card",
            "border-t-2 border-primary shadow-neon-primary",
            "p-4 overflow-y-auto scrollbar-retro"
          )}
        >
            <h2 className="font-pixel text-primary text-sm mb-4 text-glow-primary">
              COMMAND MENU
            </h2>

            {/* Command categories */}
            <div className="space-y-4">
              {/* CUSTOMERS */}
              <div>
                <h3 className="font-pixel text-secondary text-xs mb-2 uppercase">
                  Customers
                </h3>
                <div className="space-y-2">
                  <CommandButton
                    label="Create Customer"
                    onClick={() => {
                      onCommandSelect('customer-create');
                      onClose();
                    }}
                  />
                  <CommandButton
                    label="Customer KYC"
                    onClick={() => {
                      onCommandSelect('customer-kyc');
                      onClose();
                    }}
                  />
                </div>
              </div>

              {/* PAYKEYS */}
              <div>
                <h3 className="font-pixel text-secondary text-xs mb-2 uppercase">
                  Paykeys
                </h3>
                <div className="space-y-2">
                  <CommandButton
                    label="Plaid Link"
                    onClick={() => {
                      onCommandSelect('paykey-plaid');
                      onClose();
                    }}
                  />
                  <CommandButton
                    label="Bank Account"
                    onClick={() => {
                      onCommandSelect('paykey-bank');
                      onClose();
                    }}
                  />
                </div>
              </div>

              {/* PAYMENTS */}
              <div>
                <h3 className="font-pixel text-secondary text-xs mb-2 uppercase">
                  Payments
                </h3>
                <div className="space-y-2">
                  <CommandButton
                    label="Charge"
                    onClick={() => {
                      onCommandSelect('charge');
                      onClose();
                    }}
                  />
                  <CommandButton
                    label="Payout"
                    onClick={() => {
                      onCommandSelect('payout');
                      onClose();
                    }}
                    disabled
                  />
                </div>
              </div>

              {/* UTILITIES */}
              <div className="pt-2 border-t border-primary/20">
                <div className="grid grid-cols-2 gap-2">
                  <CommandButton
                    label="DEMO"
                    onClick={() => {
                      onCommandSelect('demo');
                      onClose();
                    }}
                    variant="utility"
                  />
                  <CommandButton
                    label="RESET"
                    onClick={() => {
                      onCommandSelect('reset');
                      onClose();
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
