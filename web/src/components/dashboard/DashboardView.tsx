import React from 'react';
import { CustomerCard } from './CustomerCard';
import { PaykeyCard } from './PaykeyCard';
import { ChargeCard } from './ChargeCard';
import { PizzaTracker } from './PizzaTracker';

/**
 * Main Dashboard View
 * Composes all risk cards in a vertical stack
 * Shows identity → ownership → payment flow
 *
 * Phase 3A: All cards visible with placeholder data
 * Phase 3C: Dynamic visibility (cards fade in when data arrives)
 */
export const DashboardView: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      {/* Dashboard Cards - Identity Flow */}
      <div className="space-y-6">
        {/* Customer Identity (First Layer) */}
        <div className="animate-pixel-fade-in">
          <CustomerCard />
        </div>

        {/* Paykey & Charge Side-by-Side (Second Layer) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-pixel-fade-in" style={{ animationDelay: '0.1s' }}>
          <PaykeyCard />
          <ChargeCard />
        </div>

        {/* Charge Lifecycle Tracker (Full Width) */}
        <div className="animate-pixel-fade-in" style={{ animationDelay: '0.2s' }}>
          <PizzaTracker />
        </div>
      </div>
    </div>
  );
};
