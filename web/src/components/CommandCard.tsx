import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/components/ui/utils';

export interface CommandCardProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const CommandCard: React.FC<CommandCardProps> = ({
  isOpen,
  onClose,
  title,
  children,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 z-[60] backdrop-blur-sm"
          />

          {/* Card - Street Fighter Style */}
          <motion.div
            initial={{
              scale: 0.5,
              opacity: 0,
              rotateY: -90,
              x: '-50%',
              y: '-50%'
            }}
            animate={{
              scale: 1,
              opacity: 1,
              rotateY: 0,
              x: '-50%',
              y: '-50%'
            }}
            exit={{
              scale: 0.5,
              opacity: 0,
              rotateY: 90,
              x: '-50%',
              y: '-50%'
            }}
            transition={{
              type: 'spring',
              damping: 20,
              stiffness: 200
            }}
            className={cn(
              "fixed top-1/2 left-1/2 z-[70]",
              "w-[500px] max-h-[80vh] overflow-y-auto",
              "bg-gradient-to-br from-background-elevated via-background-card to-background-dark",
              "border-4 border-primary rounded-pixel",
              "shadow-neon-primary-lg",
              "p-6"
            )}
            style={{ transformStyle: 'preserve-3d' }}
          >
            {/* Header */}
            <div className="mb-6 pb-4 border-b-2 border-primary/30">
              <h2 className="font-pixel text-primary text-xl text-glow-primary uppercase">
                {title}
              </h2>
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-accent hover:text-accent/80 font-pixel text-lg"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="space-y-4">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
