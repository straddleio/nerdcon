import { useDemoStore } from './state';
import * as api from './api';

/**
 * Command execution result
 */
export interface CommandResult {
  success: boolean;
  message: string;
  data?: unknown;
}

/**
 * Available terminal commands for autocomplete
 */
export const AVAILABLE_COMMANDS = [
  '/help',
  '/customer-create',
  '/customer-KYC',
  '/create-paykey',
  '/create-charge',
  '/demo',
  '/info',
  '/reset',
  '/clear',
];

/**
 * Parse and execute terminal command
 */
export async function executeCommand(input: string): Promise<CommandResult> {
  const trimmed = input.trim();

  // Parse command and args
  if (!trimmed.startsWith('/')) {
    return {
      success: false,
      message: 'Commands must start with /. Type /help for available commands.',
    };
  }

  const parts = trimmed.slice(1).split(/\s+/);
  const command = parts[0].toLowerCase();
  const args = parts.slice(1);

  // Route to handler
  switch (command) {
    case 'help':
      return handleHelp();
    case 'customer-create':
      return handleCreateCustomer(args);
    case 'customer-kyc':
      return handleCustomerKYC();
    case 'create-paykey':
      return handleCreatePaykey(args);
    case 'create-charge':
      return handleCreateCharge(args);
    case 'demo':
      return handleDemo();
    case 'info':
      return handleInfo();
    case 'reset':
      return handleReset();
    case 'clear':
      return handleClear();
    default:
      return {
        success: false,
        message: `Unknown command: ${command}. Type /help for available commands.`,
      };
  }
}

/**
 * /help - Show available commands
 */
function handleHelp(): CommandResult {
  const helpText = `
Available Commands:
  /customer-create [--outcome standard|verified|review|rejected]
    Create a new customer with identity verification

  /customer-KYC
    Create a KYC test customer (Jane Doe) with compliance profile and address

  /create-paykey [plaid|bank] [--outcome standard|active|rejected]
    Link a bank account (requires customer first)

  /create-charge [--amount <cents>] [--outcome standard|paid|...]
    Create a charge (requires paykey first)

  /demo
    Run full happy-path flow (customer → paykey → charge)

  /info
    Show current demo state (customer, paykey, charge IDs)

  /reset
    Clear all demo data and start fresh

  /clear
    Clear terminal output

  /help
    Show this help message
`.trim();

  return { success: true, message: helpText };
}

/**
 * /customer-create - Create customer
 */
async function handleCreateCustomer(args: string[]): Promise<CommandResult> {
  try {
    // Parse outcome flag
    let outcome: 'standard' | 'verified' | 'review' | 'rejected' | undefined;
    const outcomeIndex = args.indexOf('--outcome');
    if (outcomeIndex >= 0 && args[outcomeIndex + 1]) {
      const value = args[outcomeIndex + 1];
      if (['standard', 'verified', 'review', 'rejected'].includes(value)) {
        outcome = value as 'standard' | 'verified' | 'review' | 'rejected';
      } else {
        return {
          success: false,
          message: `✗ Invalid customer outcome: ${value}. Must be one of: standard, verified, review, rejected`,
        };
      }
    }

    // Call API
    const customer = await api.createCustomer({ outcome });

    // Update state
    useDemoStore.getState().setCustomer(customer);

    return {
      success: true,
      message: `✓ Customer created: ${customer.id}`,
      data: customer,
    };
  } catch (error) {
    return {
      success: false,
      message: `✗ Failed to create customer: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * /customer-KYC - Create KYC test customer (Jane Doe)
 */
async function handleCustomerKYC(): Promise<CommandResult> {
  try {
    // Pre-populated KYC test data with unique email
    const uniqueEmail = `jane.doe.${Date.now()}@example.com`;
    const customerData = {
      first_name: 'Jane',
      last_name: 'Doe',
      email: uniqueEmail,
      phone: '+12025551234',
      address: {
        address1: '1600 Pennsylvania Avenue NW',
        city: 'Washington',
        state: 'DC',
        zip: '20500'
      },
      compliance_profile: {
        ssn: '123-45-6789',
        dob: '1990-01-15'
      }
    };

    const response = await fetch('/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(customerData)
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        message: `✗ Failed to create KYC customer: ${error.message || response.statusText}`,
      };
    }

    const customer = await response.json();

    // Update state
    useDemoStore.getState().setCustomer(customer);

    return {
      success: true,
      message: `✓ KYC Customer created: ${customer.id}`,
      data: customer,
    };
  } catch (error) {
    return {
      success: false,
      message: `✗ Error creating KYC customer: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * /create-paykey - Link bank account
 */
async function handleCreatePaykey(args: string[]): Promise<CommandResult> {
  try {
    const { customer } = useDemoStore.getState();
    if (!customer) {
      return {
        success: false,
        message: '✗ No customer found. Run /customer-create first.',
      };
    }

    // Parse method (plaid|bank)
    const method = args[0]?.toLowerCase() === 'plaid' ? 'plaid' : 'bank_account';

    // Parse outcome flag
    let outcome: 'standard' | 'active' | 'rejected' | undefined;
    const outcomeIndex = args.indexOf('--outcome');
    if (outcomeIndex >= 0 && args[outcomeIndex + 1]) {
      const value = args[outcomeIndex + 1];
      if (['standard', 'active', 'rejected'].includes(value)) {
        outcome = value as 'standard' | 'active' | 'rejected';
      } else {
        return {
          success: false,
          message: `✗ Invalid paykey outcome: ${value}. Must be one of: standard, active, rejected`,
        };
      }
    }

    // Call API
    const paykey = await api.createPaykey({
      customer_id: customer.id,
      method,
      outcome,
    });

    // Update state
    useDemoStore.getState().setPaykey(paykey);

    return {
      success: true,
      message: `✓ Paykey created: ${paykey.id}`,
      data: paykey,
    };
  } catch (error) {
    return {
      success: false,
      message: `✗ Failed to create paykey: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * /create-charge - Create charge
 */
async function handleCreateCharge(args: string[]): Promise<CommandResult> {
  try {
    const { paykey } = useDemoStore.getState();
    if (!paykey) {
      return {
        success: false,
        message: '✗ No paykey found. Run /create-paykey first.',
      };
    }

    // Parse amount flag
    let amount = 5000; // Default $50.00
    const amountIndex = args.indexOf('--amount');
    if (amountIndex >= 0 && args[amountIndex + 1]) {
      amount = parseInt(args[amountIndex + 1], 10);
      if (isNaN(amount)) {
        return {
          success: false,
          message: '✗ Invalid amount. Must be a number in cents.',
        };
      }
    }

    // Parse outcome flag
    let outcome: api.CreateChargeRequest['outcome'];
    const outcomeIndex = args.indexOf('--outcome');
    if (outcomeIndex >= 0 && args[outcomeIndex + 1]) {
      const value = args[outcomeIndex + 1];
      const validOutcomes = [
        'standard',
        'paid',
        'on_hold_daily_limit',
        'cancelled_for_fraud_risk',
        'cancelled_for_balance_check',
        'failed_insufficient_funds',
        'failed_customer_dispute',
        'failed_closed_bank_account',
        'reversed_insufficient_funds',
        'reversed_customer_dispute',
        'reversed_closed_bank_account',
      ];
      if (validOutcomes.includes(value)) {
        outcome = value as api.CreateChargeRequest['outcome'];
      } else {
        return {
          success: false,
          message: `✗ Invalid charge outcome: ${value}. Must be one of: ${validOutcomes.join(', ')}`,
        };
      }
    }

    // Call API (use paykey TOKEN, not ID)
    const charge = await api.createCharge({
      paykey: paykey.paykey, // TOKEN
      amount,
      description: `Demo charge - $${(amount / 100).toFixed(2)}`,
      outcome,
    });

    // Update state
    useDemoStore.getState().setCharge(charge);

    return {
      success: true,
      message: `✓ Charge created: ${charge.id}`,
      data: charge,
    };
  } catch (error) {
    return {
      success: false,
      message: `✗ Failed to create charge: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * /demo - Run full flow
 */
async function handleDemo(): Promise<CommandResult> {
  const { addTerminalLine } = useDemoStore.getState();

  try {
    // Step 1: Create customer
    addTerminalLine({ text: '→ Creating customer...', type: 'info' });
    const customerResult = await handleCreateCustomer(['--outcome', 'verified']);
    if (!customerResult.success) {
      return customerResult;
    }
    addTerminalLine({ text: customerResult.message, type: 'success' });

    // Wait for effect
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Step 2: Create paykey via Plaid
    addTerminalLine({ text: '→ Linking bank account via Plaid...', type: 'info' });
    const paykeyResult = await handleCreatePaykey(['plaid', '--outcome', 'active']);
    if (!paykeyResult.success) {
      return paykeyResult;
    }
    addTerminalLine({ text: paykeyResult.message, type: 'success' });

    // Wait for effect
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Step 3: Create charge
    addTerminalLine({ text: '→ Creating charge...', type: 'info' });
    const chargeResult = await handleCreateCharge(['--amount', '5000', '--outcome', 'paid']);
    if (!chargeResult.success) {
      return chargeResult;
    }
    addTerminalLine({ text: chargeResult.message, type: 'success' });

    return {
      success: true,
      message: '✓ Demo flow completed successfully!',
    };
  } catch (error) {
    return {
      success: false,
      message: `✗ Demo failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * /info - Show current state
 */
async function handleInfo(): Promise<CommandResult> {
  try {
    const state = await api.getState();

    const lines: string[] = ['Current Demo State:'];

    if (state.customer) {
      lines.push(`  Customer: ${state.customer.id}`);
      lines.push(`    Status: ${state.customer.verification_status}`);
    } else {
      lines.push('  Customer: None');
    }

    if (state.paykey) {
      lines.push(`  Paykey: ${state.paykey.id}`);
      lines.push(`    Status: ${state.paykey.status}`);
    } else {
      lines.push('  Paykey: None');
    }

    if (state.charge) {
      lines.push(`  Charge: ${state.charge.id}`);
      lines.push(`    Status: ${state.charge.status}`);
      lines.push(`    Amount: $${(state.charge.amount / 100).toFixed(2)}`);
    } else {
      lines.push('  Charge: None');
    }

    return {
      success: true,
      message: lines.join('\n'),
    };
  } catch (error) {
    return {
      success: false,
      message: `✗ Failed to fetch state: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * /reset - Clear demo state
 */
async function handleReset(): Promise<CommandResult> {
  try {
    await api.resetState();
    useDemoStore.getState().reset();

    return {
      success: true,
      message: '✓ Demo state cleared. Ready for new demo.',
    };
  } catch (error) {
    return {
      success: false,
      message: `✗ Failed to reset: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * /clear - Clear terminal
 */
function handleClear(): CommandResult {
  useDemoStore.getState().clearTerminal();
  return {
    success: true,
    message: '', // Don't add extra message, clearTerminal adds its own
  };
}
