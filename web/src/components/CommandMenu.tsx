import React, { useState } from 'react';
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

interface CommandMenuProps {
  onCommandSelect: (command: CommandType) => void;
}

export const CommandMenu: React.FC<CommandMenuProps> = ({ onCommandSelect }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  // onCommandSelect will be used in Task 3.2 when command buttons are added
  void onCommandSelect;

  return (
    <>
      {/* Menu Toggle Button - Nintendo Power Glove Style */}
      <button
        onClick={toggleMenu}
        aria-label="Toggle command menu"
        aria-expanded={isOpen}
        aria-controls="command-menu-panel"
        className={cn(
          "absolute left-0 top-1/2 -translate-y-1/2 z-50",
          "bg-gradient-to-r from-accent to-accent/80",
          "text-white font-pixel text-xs px-3 py-2",
          "rounded-r-pixel shadow-neon-accent",
          "hover:shadow-neon-accent-lg hover:from-accent/90 hover:to-accent/70",
          "transition-all duration-300",
          "flex items-center gap-2"
        )}
      >
        <span className="rotate-90">{isOpen ? '▼' : '▶'}</span>
        <span>MENU</span>
      </button>

      {/* Slide-out Menu Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="command-menu-panel"
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={cn(
              "absolute left-0 top-0 bottom-0 w-64 z-40",
              "bg-gradient-to-br from-background-elevated to-background-card",
              "border-r-2 border-primary shadow-neon-primary",
              "p-4 overflow-y-auto scrollbar-retro"
            )}
          >
            <h2 className="font-pixel text-primary text-sm mb-4 text-glow-primary">
              COMMAND MENU
            </h2>

            {/* Command categories will go here */}
            <div className="space-y-4">
              {/* Categories added in next task */}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
