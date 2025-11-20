import React from 'react';
import { cn } from '@/components/ui/utils';
import { motion } from 'framer-motion';

interface GuideCardProps {
  title: string;
  children: React.ReactNode;
  icon?: string;
  accentColor?: 'primary' | 'secondary' | 'accent';
}

const GuideCard: React.FC<GuideCardProps> = ({
  title,
  children,
  icon,
  accentColor = 'primary',
}) => {
  const colorClasses = {
    primary: 'border-primary/40 text-primary',
    secondary: 'border-secondary/40 text-secondary',
    accent: 'border-accent/40 text-accent',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn('bg-background-elevated border-2 rounded-pixel p-4', colorClasses[accentColor])}
    >
      <h3 className="font-pixel text-xs mb-3 flex items-center gap-2">
        {icon && <span className="text-lg">{icon}</span>}
        {title}
      </h3>
      <div className="text-neutral-300 font-body text-xs space-y-2">{children}</div>
    </motion.div>
  );
};

interface CommandItemProps {
  command: string;
  description: string;
}

const CommandItem: React.FC<CommandItemProps> = ({ command, description }) => (
  <div className="flex items-start gap-3 py-1.5">
    <code className="text-primary font-mono text-xs font-bold bg-background-dark px-2 py-1 rounded border border-primary/30 whitespace-nowrap">
      {command}
    </code>
    <span className="text-neutral-400 text-xs leading-relaxed">{description}</span>
  </div>
);

interface WorkflowStepProps {
  step: number;
  label: string;
  color: string;
}

const WorkflowStep: React.FC<WorkflowStepProps> = ({ step, label, color }) => (
  <div className="flex flex-col items-center gap-2">
    <div
      className={cn(
        'w-8 h-8 rounded-full flex items-center justify-center font-pixel text-xs border-2',
        color
      )}
    >
      {step}
    </div>
    <span className="text-neutral-300 font-body text-xs text-center">{label}</span>
  </div>
);

const Arrow: React.FC = () => <div className="text-primary text-2xl flex items-center">→</div>;

/**
 * User Guide Tab - Single-screen reference for demo basics
 */
export const UserGuideTab: React.FC = () => {
  return (
    <div className="h-full bg-background-dark p-6 overflow-y-auto scrollbar-retro">
      <div className="max-w-5xl mx-auto space-y-4">
        {/* Header */}
        <div className="text-center mb-4">
          <h1 className="font-pixel text-primary text-lg mb-2">USER GUIDE</h1>
          <p className="text-neutral-400 font-body text-xs">
            Everything you need to run smooth Straddle demos
          </p>
        </div>

        {/* Grid Layout */}
        <div className="grid grid-cols-2 gap-4">
          {/* Quick Start */}
          <GuideCard title="QUICK START" icon="🚀" accentColor="primary">
            <ol className="list-decimal list-inside space-y-1.5 text-neutral-300">
              <li>
                Type <code className="text-primary font-mono">/demo</code> in terminal for full flow
              </li>
              <li>Watch real-time updates in Dashboard tab</li>
              <li>
                Use <code className="text-primary font-mono">/reset</code> to start fresh
              </li>
            </ol>
          </GuideCard>

          {/* Key Commands */}
          <GuideCard title="KEY COMMANDS" icon="⌨️" accentColor="secondary">
            <div className="space-y-1">
              <CommandItem command="/demo" description="Run complete demo flow" />
              <CommandItem command="/create-customer" description="Create customer only" />
              <CommandItem command="/create-charge" description="Create charge only" />
              <CommandItem command="/reset" description="Clear all state" />
              <CommandItem command="/help" description="Show all commands" />
              <CommandItem command="/info" description="View current state" />
            </div>
          </GuideCard>

          {/* Workflow */}
          <GuideCard title="WORKFLOW" icon="🔄" accentColor="accent">
            <div className="flex items-center justify-around py-2">
              <WorkflowStep step={1} label="Create Customer" color="border-primary text-primary" />
              <Arrow />
              <WorkflowStep step={2} label="Link Bank" color="border-secondary text-secondary" />
              <Arrow />
              <WorkflowStep step={3} label="Create Charge" color="border-accent text-accent" />
            </div>
            <p className="text-neutral-400 text-xs mt-3 text-center">
              Each step requires the previous one to complete
            </p>
          </GuideCard>

          {/* Pro Tips */}
          <GuideCard title="PRO TIPS" icon="💡" accentColor="primary">
            <ul className="space-y-1.5 text-neutral-300">
              <li className="flex items-start gap-2">
                <span className="text-primary">▸</span>
                <span>
                  Use <strong>Tab</strong> for command autocomplete
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">▸</span>
                <span>
                  Click <strong>MENU</strong> button for visual command picker
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">▸</span>
                <span>Check LOGS tab for raw API requests/responses</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">▸</span>
                <span>
                  Use <code className="text-primary">/outcomes</code> to see sandbox options
                </span>
              </li>
            </ul>
          </GuideCard>
        </div>

        {/* Additional Resources */}
        <div className="mt-6 p-4 bg-background-elevated/50 rounded-pixel border border-neutral-700">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-pixel text-xs text-neutral-300 mb-1">NEED MORE HELP?</h4>
              <p className="text-neutral-500 text-xs font-body">
                Type <code className="text-primary font-mono">/help</code> in terminal for detailed
                command documentation
              </p>
            </div>
            <div className="text-4xl">📖</div>
          </div>
        </div>
      </div>
    </div>
  );
};
