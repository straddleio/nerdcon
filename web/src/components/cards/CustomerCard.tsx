import React, { useState, useEffect } from 'react';
import { CommandCard } from '../CommandCard';
import { cn } from '@/components/ui/utils';

interface CustomerCardProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CustomerFormData, outcome: 'standard' | 'verified' | 'review' | 'rejected') => void;
  mode?: 'create' | 'kyc'; // 'create' = customer-create, 'kyc' = customer-kyc
}

export interface CustomerFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address?: {
    address1: string;
    city: string;
    state: string;
    zip: string;
  };
  compliance_profile?: {
    ssn: string;
    dob: string;
  };
  device: {
    ip_address: string;
  };
  type: 'individual' | 'business';
}

export const CustomerCard: React.FC<CustomerCardProps> = ({ isOpen, onClose, onSubmit, mode = 'create' }) => {
  // Different defaults based on mode
  const getInitialFormData = (): CustomerFormData => {
    if (mode === 'kyc') {
      // Jane Doe with full KYC data (matches /customer-kyc command)
      return {
        first_name: 'Jane',
        last_name: 'Doe',
        email: `jane.doe.${Date.now()}@example.com`,
        phone: '+12025551234',
        address: {
          address1: '1600 Pennsylvania Avenue NW',
          city: 'Washington',
          state: 'DC',
          zip: '20500',
        },
        compliance_profile: {
          ssn: '123-45-6789',
          dob: '1990-01-15',
        },
        device: {
          ip_address: '192.168.1.1',
        },
        type: 'individual',
      };
    } else {
      // Alberta Bobbeth Charleson (matches /customer-create command)
      // Simple customer without compliance_profile
      return {
        first_name: 'Alberta',
        last_name: 'Bobbeth Charleson',
        email: `user.${Date.now()}@example.com`,
        phone: '+12125550123',
        address: {
          address1: '123 Main St',
          city: 'New York',
          state: 'NY',
          zip: '10001',
        },
        device: {
          ip_address: '192.168.1.1',
        },
        type: 'individual',
      };
    }
  };

  const [formData, setFormData] = useState<CustomerFormData>(getInitialFormData());

  // Reset form data when mode changes
  useEffect(() => {
    setFormData(getInitialFormData());
  }, [mode]);

  const handleSubmit = (outcome: 'standard' | 'verified' | 'review' | 'rejected') => {
    onSubmit(formData, outcome);
    onClose();
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateNestedField = (parent: string, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [parent]: { ...(prev as any)[parent], [field]: value }
    }));
  };

  return (
    <CommandCard isOpen={isOpen} onClose={onClose} title="CREATE CUSTOMER">
      {/* Form Fields */}
      <div className="space-y-3">
        {/* Name */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-pixel text-primary mb-1">First Name</label>
            <input
              type="text"
              value={formData.first_name}
              onChange={(e) => updateField('first_name', e.target.value)}
              className={cn(
                "w-full px-2 py-1 bg-background-dark border border-primary/30",
                "rounded text-neutral-200 font-body text-sm",
                "focus:border-primary focus:outline-none"
              )}
            />
          </div>
          <div>
            <label className="block text-xs font-pixel text-primary mb-1">Last Name</label>
            <input
              type="text"
              value={formData.last_name}
              onChange={(e) => updateField('last_name', e.target.value)}
              className={cn(
                "w-full px-2 py-1 bg-background-dark border border-primary/30",
                "rounded text-neutral-200 font-body text-sm",
                "focus:border-primary focus:outline-none"
              )}
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-xs font-pixel text-primary mb-1">Email</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => updateField('email', e.target.value)}
            className={cn(
              "w-full px-2 py-1 bg-background-dark border border-primary/30",
              "rounded text-neutral-200 font-body text-sm",
              "focus:border-primary focus:outline-none"
            )}
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-xs font-pixel text-primary mb-1">Phone</label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => updateField('phone', e.target.value)}
            className={cn(
              "w-full px-2 py-1 bg-background-dark border border-primary/30",
              "rounded text-neutral-200 font-body text-sm",
              "focus:border-primary focus:outline-none"
            )}
          />
        </div>

        {/* Address */}
        <div>
          <label className="block text-xs font-pixel text-primary mb-1">Address</label>
          <input
            type="text"
            value={formData.address?.address1 || ''}
            onChange={(e) => updateNestedField('address', 'address1', e.target.value)}
            className={cn(
              "w-full px-2 py-1 bg-background-dark border border-primary/30",
              "rounded text-neutral-200 font-body text-sm mb-2",
              "focus:border-primary focus:outline-none"
            )}
            placeholder="Street Address"
          />
          <div className="grid grid-cols-3 gap-2">
            <input
              type="text"
              value={formData.address?.city || ''}
              onChange={(e) => updateNestedField('address', 'city', e.target.value)}
              className={cn(
                "w-full px-2 py-1 bg-background-dark border border-primary/30",
                "rounded text-neutral-200 font-body text-sm",
                "focus:border-primary focus:outline-none"
              )}
              placeholder="City"
            />
            <input
              type="text"
              value={formData.address?.state || ''}
              onChange={(e) => updateNestedField('address', 'state', e.target.value)}
              className={cn(
                "w-full px-2 py-1 bg-background-dark border border-primary/30",
                "rounded text-neutral-200 font-body text-sm",
                "focus:border-primary focus:outline-none"
              )}
              placeholder="State"
            />
            <input
              type="text"
              value={formData.address?.zip || ''}
              onChange={(e) => updateNestedField('address', 'zip', e.target.value)}
              className={cn(
                "w-full px-2 py-1 bg-background-dark border border-primary/30",
                "rounded text-neutral-200 font-body text-sm",
                "focus:border-primary focus:outline-none"
              )}
              placeholder="ZIP"
            />
          </div>
        </div>

        {/* KYC Fields - Only show in KYC mode */}
        {mode === 'kyc' && (
          <>
            {/* SSN */}
            <div>
              <label className="block text-xs font-pixel text-primary mb-1">SSN</label>
              <input
                type="text"
                value={formData.compliance_profile?.ssn || ''}
                onChange={(e) => updateNestedField('compliance_profile', 'ssn', e.target.value)}
                className={cn(
                  "w-full px-2 py-1 bg-background-dark border border-primary/30",
                  "rounded text-neutral-200 font-body text-sm",
                  "focus:border-primary focus:outline-none"
                )}
              />
            </div>

            {/* DOB */}
            <div>
              <label className="block text-xs font-pixel text-primary mb-1">Date of Birth</label>
              <input
                type="date"
                value={formData.compliance_profile?.dob || ''}
                onChange={(e) => updateNestedField('compliance_profile', 'dob', e.target.value)}
                className={cn(
                  "w-full px-2 py-1 bg-background-dark border border-primary/30",
                  "rounded text-neutral-200 font-body text-sm",
                  "focus:border-primary focus:outline-none"
                )}
              />
            </div>
          </>
        )}

        {/* IP Address */}
        <div>
          <label className="block text-xs font-pixel text-primary mb-1">IP Address</label>
          <input
            type="text"
            value={formData.device.ip_address}
            onChange={(e) => updateNestedField('device', 'ip_address', e.target.value)}
            className={cn(
              "w-full px-2 py-1 bg-background-dark border border-primary/30",
              "rounded text-neutral-200 font-body text-sm",
              "focus:border-primary focus:outline-none"
            )}
          />
        </div>

        {/* Type */}
        <div>
          <label className="block text-xs font-pixel text-primary mb-1">Customer Type</label>
          <select
            value={formData.type}
            onChange={(e) => updateField('type', e.target.value)}
            className={cn(
              "w-full px-2 py-1 bg-background-dark border border-primary/30",
              "rounded text-neutral-200 font-body text-sm",
              "focus:border-primary focus:outline-none"
            )}
          >
            <option value="individual">Individual</option>
            <option value="business">Business</option>
          </select>
        </div>
      </div>

      {/* Sandbox Outcome Buttons - Street Fighter Style */}
      <div className="mt-6 pt-4 border-t-2 border-primary/20">
        <p className="text-xs font-pixel text-secondary mb-3">SANDBOX OUTCOME</p>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleSubmit('standard')}
            className={cn(
              "px-4 py-3 rounded-pixel font-pixel text-sm",
              "bg-secondary/20 border-2 border-secondary text-secondary",
              "hover:bg-secondary/30 hover:shadow-[0_0_15px_rgba(0,102,255,0.5)]",
              "transition-all duration-200 uppercase"
            )}
          >
            ⚡ Standard
          </button>
          <button
            onClick={() => handleSubmit('verified')}
            className={cn(
              "px-4 py-3 rounded-pixel font-pixel text-sm",
              "bg-accent-green/20 border-2 border-accent-green text-accent-green",
              "hover:bg-accent-green/30 hover:shadow-[0_0_15px_rgba(57,255,20,0.5)]",
              "transition-all duration-200 uppercase"
            )}
          >
            ✓ Verified
          </button>
          <button
            onClick={() => handleSubmit('review')}
            className={cn(
              "px-4 py-3 rounded-pixel font-pixel text-sm",
              "bg-gold/20 border-2 border-gold text-gold",
              "hover:bg-gold/30 hover:shadow-[0_0_15px_rgba(255,195,0,0.5)]",
              "transition-all duration-200 uppercase"
            )}
          >
            ⚠ Review
          </button>
          <button
            onClick={() => handleSubmit('rejected')}
            className={cn(
              "px-4 py-3 rounded-pixel font-pixel text-sm",
              "bg-accent-red/20 border-2 border-accent-red text-accent-red",
              "hover:bg-accent-red/30 hover:shadow-[0_0_15px_rgba(255,0,64,0.5)]",
              "transition-all duration-200 uppercase"
            )}
          >
            ✗ Rejected
          </button>
        </div>
      </div>
    </CommandCard>
  );
};
