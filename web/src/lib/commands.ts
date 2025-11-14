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
    case 'create-customer':
      return handleCreateCustomer(args);
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
  /create-customer [--outcome verified|review|rejected]
    Create a new customer with identity verification

  /create-paykey [plaid|bank] [--outcome active|inactive|rejected]
    Link a bank account (requires customer first)

  /create-charge [--amount <cents>] [--outcome paid|failed|...]
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
 * /create-customer - Create customer
 */
async function handleCreateCustomer(args: string[]): Promise<CommandResult> {
  try {
    // Parse outcome flag
    let outcome: 'verified' | 'review' | 'rejected' | undefined;
    const outcomeIndex = args.indexOf('--outcome');
    if (outcomeIndex >= 0 && args[outcomeIndex + 1]) {
      outcome = args[outcomeIndex + 1] as 'verified' | 'review' | 'rejected';
    }

    // Call API
    const customer = await api.createCustomer({ outcome });

    // Update state
    useDemoStore.getState().setCustomer(customer);

    return {
      success: true,
      message: `✓ Customer created: ${customer.id}\n  Status: ${customer.verification_status}\n  Risk Score: ${customer.risk_score || 'N/A'}`,
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
 * /create-paykey - Link bank account
 */
async function handleCreatePaykey(args: string[]): Promise<CommandResult> {
  try {
    const { customer } = useDemoStore.getState();
    if (!customer) {
      return {
        success: false,
        message: '✗ No customer found. Run /create-customer first.',
      };
    }

    // Parse method (plaid|bank)
    const method = args[0]?.toLowerCase() === 'plaid' ? 'plaid' : 'bank_account';

    // Parse outcome flag
    let outcome: 'active' | 'inactive' | 'rejected' | undefined;
    const outcomeIndex = args.indexOf('--outcome');
    if (outcomeIndex >= 0 && args[outcomeIndex + 1]) {
      outcome = args[outcomeIndex + 1] as 'active' | 'inactive' | 'rejected';
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
      message: `✓ Paykey created: ${paykey.id}\n  Status: ${paykey.status}\n  Institution: ${paykey.institution || 'N/A'}\n  Balance: $${((paykey.balance?.available || 0) / 100).toFixed(2)}`,
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
      outcome = args[outcomeIndex + 1] as api.CreateChargeRequest['outcome'];
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
      message: `✓ Charge created: ${charge.id}\n  Amount: $${(charge.amount / 100).toFixed(2)}\n  Status: ${charge.status}`,
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

    // Step 2: Create paykey
    addTerminalLine({ text: '→ Linking bank account...', type: 'info' });
    const paykeyResult = await handleCreatePaykey(['bank', '--outcome', 'active']);
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
