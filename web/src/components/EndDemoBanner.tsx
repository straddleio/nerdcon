import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from './ui/utils';

interface EndDemoBannerProps {
  isVisible: boolean;
  onClose?: () => void;
}

/**
 * Retro arcade-style end demo banner
 * Drops down like a classic game over screen with pixel art aesthetics
 */
export const EndDemoBanner: React.FC<EndDemoBannerProps> = ({ isVisible, onClose }) => {
  const [showScanlines, setShowScanlines] = useState(false);

  useEffect(() => {
    if (isVisible) {
      // Trigger scanline effect after banner appears
      const timer = setTimeout(() => setShowScanlines(true), 800);
      return () => clearTimeout(timer);
    } else {
      setShowScanlines(false);
    }
  }, [isVisible]);

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-[9998] bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Main banner curtain */}
          <motion.div
            initial={{ y: '-100%' }}
            animate={{ y: 0 }}
            exit={{ y: '-100%' }}
            transition={{
              type: 'spring',
              damping: 20,
              stiffness: 100,
              mass: 1.2,
            }}
            className={cn(
              'fixed inset-x-0 top-0 z-[9999]',
              'flex items-center justify-center',
              'min-h-[60vh] py-16',
              'bg-gradient-to-b from-[#0a0a14] via-[#1a1a2e] to-[#0a0a14]',
              'border-y-8 border-primary',
              'shadow-[0_0_100px_rgba(0,255,255,0.3)]'
            )}
            style={{
              backgroundImage: `
                linear-gradient(0deg, rgba(0,255,255,0.03) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0,255,255,0.03) 1px, transparent 1px)
              `,
              backgroundSize: '20px 20px',
            }}
          >
            {/* Scanline effect overlay */}
            {showScanlines && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.15 }}
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(0deg, rgba(0,0,0,0.5) 0px, transparent 2px, transparent 4px)',
                  backgroundSize: '100% 4px',
                }}
              />
            )}

            {/* Content container */}
            <div className="relative z-10 text-center space-y-8 px-8">
              {/* THANKS NERDS! */}
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3, type: 'spring', damping: 15 }}
                className="relative"
              >
                {/* Glow effect behind text */}
                <div
                  className="absolute inset-0 blur-3xl opacity-50"
                  style={{
                    background: 'radial-gradient(ellipse at center, #00FFFF 0%, transparent 70%)',
                  }}
                />

                {/* Main text with pixel font */}
                <h1
                  className={cn(
                    'relative font-pixel text-7xl md:text-9xl font-bold',
                    'text-transparent bg-clip-text',
                    'bg-gradient-to-b from-primary via-cyan-300 to-primary',
                    'drop-shadow-[0_0_20px_rgba(0,255,255,0.8)]',
                    'tracking-wider',
                    'animate-pulse-glow'
                  )}
                  style={{
                    textShadow: `
                      0 0 10px rgba(0, 255, 255, 0.8),
                      0 0 20px rgba(0, 255, 255, 0.6),
                      0 0 30px rgba(0, 255, 255, 0.4),
                      4px 4px 0px rgba(0, 102, 255, 0.3)
                    `,
                  }}
                >
                  THANKS NERDS!
                </h1>

                {/* Pixel decorations */}
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.5, duration: 0.4 }}
                  className="mt-4 h-2 w-64 mx-auto bg-gradient-to-r from-transparent via-primary to-transparent"
                  style={{
                    boxShadow: '0 0 20px rgba(0, 255, 255, 0.6)',
                  }}
                />
              </motion.div>

              {/* straddle.com */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.4 }}
                className="space-y-4"
              >
                {/* URL with retro computer aesthetic */}
                <a
                  href="https://straddle.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    'inline-block group',
                    'font-mono text-3xl md:text-5xl font-bold',
                    'text-gold tracking-widest',
                    'transition-all duration-300',
                    'hover:scale-110 hover:tracking-[0.3em]'
                  )}
                  style={{
                    textShadow: `
                      0 0 10px rgba(255, 195, 0, 0.8),
                      0 0 20px rgba(255, 195, 0, 0.5),
                      2px 2px 0px rgba(255, 0, 153, 0.3)
                    `,
                  }}
                >
                  <span className="inline-block group-hover:animate-bounce-subtle">S</span>
                  <span className="inline-block group-hover:animate-bounce-subtle animation-delay-75">
                    T
                  </span>
                  <span className="inline-block group-hover:animate-bounce-subtle animation-delay-150">
                    R
                  </span>
                  <span className="inline-block group-hover:animate-bounce-subtle animation-delay-225">
                    A
                  </span>
                  <span className="inline-block group-hover:animate-bounce-subtle animation-delay-300">
                    D
                  </span>
                  <span className="inline-block group-hover:animate-bounce-subtle animation-delay-375">
                    D
                  </span>
                  <span className="inline-block group-hover:animate-bounce-subtle animation-delay-450">
                    L
                  </span>
                  <span className="inline-block group-hover:animate-bounce-subtle animation-delay-525">
                    E
                  </span>
                  <span className="inline-block text-primary">.COM</span>
                </a>

                {/* Pixel hearts decoration */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.2, 1] }}
                  transition={{ delay: 0.8, duration: 0.5 }}
                  className="flex justify-center gap-4 text-2xl"
                >
                  <span className="text-accent-red animate-pulse">♥</span>
                  <span className="text-primary animate-pulse animation-delay-200">♥</span>
                  <span className="text-secondary animate-pulse animation-delay-400">♥</span>
                </motion.div>
              </motion.div>

              {/* Press any key to continue */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0.5, 1] }}
                transition={{
                  delay: 1.2,
                  duration: 1.5,
                  repeat: Infinity,
                  repeatDelay: 0.5,
                }}
                className="pt-8"
              >
                <p className="font-pixel text-sm md:text-base text-neutral-400 tracking-wider">
                  [ CLICK ANYWHERE TO CONTINUE ]
                </p>
              </motion.div>
            </div>

            {/* Corner decorations - pixel art style */}
            <div className="absolute top-4 left-4 w-16 h-16 border-t-4 border-l-4 border-primary opacity-50" />
            <div className="absolute top-4 right-4 w-16 h-16 border-t-4 border-r-4 border-primary opacity-50" />
            <div className="absolute bottom-4 left-4 w-16 h-16 border-b-4 border-l-4 border-primary opacity-50" />
            <div className="absolute bottom-4 right-4 w-16 h-16 border-b-4 border-r-4 border-primary opacity-50" />

            {/* Floating pixel particles */}
            {Array.from({ length: 12 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ y: 100, opacity: 0 }}
                animate={{
                  y: -100,
                  opacity: [0, 1, 1, 0],
                }}
                transition={{
                  delay: 1 + i * 0.1,
                  duration: 3,
                  repeat: Infinity,
                  repeatDelay: 2,
                }}
                className="absolute w-2 h-2 bg-primary rounded-sm"
                style={{
                  left: `${10 + i * 7}%`,
                  boxShadow: '0 0 10px rgba(0, 255, 255, 0.8)',
                }}
              />
            ))}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
