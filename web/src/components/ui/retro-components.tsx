/**
 * Retro Gaming Component Variants
 * Drop-in replacements for shadcn/ui components with retro styling
 */

import * as React from 'react';
import { cn } from './utils';

// ========================================
// CARD COMPONENTS
// ========================================

interface RetroCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'cyan' | 'blue' | 'magenta' | 'gold';
  glow?: boolean;
}

export const RetroCard = React.forwardRef<HTMLDivElement, RetroCardProps>(
  ({ className, variant = 'cyan', glow = false, ...props }, ref) => {
    const variantClasses = {
      cyan: 'retro-card',
      blue: 'retro-card-blue',
      magenta: 'retro-card-magenta',
      gold: 'border-gold/60 hover:border-gold hover:shadow-glow-gold',
    };

    return (
      <div
        ref={ref}
        className={cn(variantClasses[variant], glow && 'animate-pulse-glow', className)}
        {...props}
      />
    );
  }
);
RetroCard.displayName = 'RetroCard';

export const RetroCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('flex flex-col space-y-2 mb-4', className)} {...props} />
));
RetroCardHeader.displayName = 'RetroCardHeader';

export const RetroCardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn('text-xl font-pixel text-primary leading-relaxed tracking-wide', className)}
    {...props}
  />
));
RetroCardTitle.displayName = 'RetroCardTitle';

export const RetroCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn('text-sm text-neutral-400 font-body', className)} {...props} />
));
RetroCardDescription.displayName = 'RetroCardDescription';

export const RetroCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => <div ref={ref} className={cn('', className)} {...props} />);
RetroCardContent.displayName = 'RetroCardContent';

// ========================================
// BUTTON COMPONENTS
// ========================================

interface RetroButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'gold';
  filled?: boolean;
  pixelText?: boolean;
}

export const RetroButton = React.forwardRef<HTMLButtonElement, RetroButtonProps>(
  ({ className, variant = 'primary', filled = false, pixelText = true, ...props }, ref) => {
    const variantClasses = {
      primary: filled ? 'retro-button-filled' : 'retro-button',
      secondary: 'retro-button retro-button-secondary',
      accent: 'retro-button retro-button-accent',
      gold: 'retro-button retro-button-gold',
    };

    return (
      <button
        ref={ref}
        className={cn(
          variantClasses[variant],
          !pixelText && 'font-body text-sm tracking-normal',
          className
        )}
        {...props}
      />
    );
  }
);
RetroButton.displayName = 'RetroButton';

// ========================================
// BADGE COMPONENT
// ========================================

interface RetroBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'gold';
}

export const RetroBadge = React.forwardRef<HTMLDivElement, RetroBadgeProps>(
  ({ className, variant = 'primary', ...props }, ref) => {
    const variantClasses = {
      primary: 'border-primary bg-primary/10 text-primary',
      secondary: 'border-secondary bg-secondary/10 text-secondary',
      accent: 'border-accent bg-accent/10 text-accent',
      gold: 'border-gold bg-gold/10 text-gold',
    };

    return (
      <div ref={ref} className={cn('retro-badge', variantClasses[variant], className)} {...props} />
    );
  }
);
RetroBadge.displayName = 'RetroBadge';

// ========================================
// INPUT COMPONENT
// ========================================

export interface RetroInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  glowOnFocus?: boolean;
}

export const RetroInput = React.forwardRef<HTMLInputElement, RetroInputProps>(
  ({ className, glowOnFocus = true, type = 'text', ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn('retro-input', glowOnFocus && 'focus:shadow-glow-cyan', className)}
        {...props}
      />
    );
  }
);
RetroInput.displayName = 'RetroInput';

// ========================================
// HEADING COMPONENTS
// ========================================

interface RetroHeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  glow?: boolean;
  glitch?: boolean;
  variant?: 'primary' | 'secondary' | 'accent' | 'gold';
}

export const RetroHeading = React.forwardRef<HTMLHeadingElement, RetroHeadingProps>(
  (
    { className, level = 1, glow = false, glitch = false, variant = 'primary', children, ...props },
    ref
  ) => {
    const Tag = `h${level}` as keyof JSX.IntrinsicElements;

    const sizeClasses = {
      1: 'text-4xl md:text-5xl lg:text-6xl',
      2: 'text-3xl md:text-4xl lg:text-5xl',
      3: 'text-2xl md:text-3xl lg:text-4xl',
      4: 'text-xl md:text-2xl lg:text-3xl',
      5: 'text-lg md:text-xl lg:text-2xl',
      6: 'text-base md:text-lg lg:text-xl',
    };

    const colorClasses = {
      primary: 'text-primary',
      secondary: 'text-secondary',
      accent: 'text-accent',
      gold: 'text-gold',
    };

    return React.createElement(
      Tag,
      {
        ref,
        className: cn(
          'font-pixel leading-relaxed',
          sizeClasses[level],
          colorClasses[variant],
          glow && 'text-glow-cyan',
          glitch && 'glitch',
          className
        ),
        'data-text': glitch ? children : undefined,
        ...props,
      },
      children
    );
  }
);
RetroHeading.displayName = 'RetroHeading';

// ========================================
// DIVIDER COMPONENT
// ========================================

export const RetroDivider = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('retro-divider my-6', className)} {...props} />
  )
);
RetroDivider.displayName = 'RetroDivider';

// ========================================
// CONTAINER WITH EFFECTS
// ========================================

interface RetroContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  scanlines?: boolean;
  crt?: boolean;
  grid?: boolean;
}

export const RetroContainer = React.forwardRef<HTMLDivElement, RetroContainerProps>(
  ({ className, scanlines = false, crt = false, grid = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          scanlines && 'scanlines',
          crt && 'crt-screen',
          grid && 'retro-grid',
          className
        )}
        {...props}
      />
    );
  }
);
RetroContainer.displayName = 'RetroContainer';

// ========================================
// PIXEL TEXT COMPONENT
// ========================================

interface PixelTextProps extends React.HTMLAttributes<HTMLSpanElement> {
  glow?: boolean;
  variant?: 'primary' | 'secondary' | 'accent' | 'gold';
}

export const PixelText = React.forwardRef<HTMLSpanElement, PixelTextProps>(
  ({ className, glow = false, variant = 'primary', ...props }, ref) => {
    const colorClasses = {
      primary: 'pixel-text',
      secondary: 'pixel-text pixel-text-blue',
      accent: 'pixel-text pixel-text-magenta',
      gold: 'pixel-text pixel-text-gold',
    };

    return (
      <span
        ref={ref}
        className={cn(colorClasses[variant], glow && 'pixel-text-glow', className)}
        {...props}
      />
    );
  }
);
PixelText.displayName = 'PixelText';

// ========================================
// ANIMATED COUNTER (for stats)
// ========================================

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  suffix?: string;
  className?: string;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  duration = 2000,
  suffix = '',
  className,
}) => {
  const [count, setCount] = React.useState(0);

  React.useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) {
        startTime = currentTime;
      }
      const progress = Math.min((currentTime - startTime) / duration, 1);

      setCount(Math.floor(progress * value));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrame);
  }, [value, duration]);

  return (
    <span className={cn('font-pixel text-primary text-glow-cyan', className)}>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
};

// ========================================
// UTILITY HOOKS
// ========================================

/**
 * Hook to add retro typewriter effect to text
 */
export const useTypewriter = (text: string, speed: number = 50): string => {
  const [displayedText, setDisplayedText] = React.useState('');

  React.useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      if (i < text.length) {
        setDisplayedText((prev) => prev + text.charAt(i));
        i++;
      } else {
        clearInterval(timer);
      }
    }, speed);

    return () => clearInterval(timer);
  }, [text, speed]);

  return displayedText;
};

/**
 * Hook for retro audio effects (optional, requires Web Audio API)
 */
export const useRetroAudio = () => {
  const playBeep = React.useCallback((frequency: number = 440, duration: number = 100) => {
    const AudioContextClass =
      window.AudioContext ||
      (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) {
      console.warn('AudioContext not supported');
      return;
    }
    const audioContext = new AudioContextClass();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = 'square'; // 8-bit style square wave

    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration / 1000);
  }, []);

  return { playBeep };
};
