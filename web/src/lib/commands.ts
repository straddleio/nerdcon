import { useDemoStore } from './state';
import * as api from './api';
import { playEndDemoSound, playAutoAttackSound } from './sounds';

/**
 * Command execution result
 */
export interface CommandResult {
  success: boolean;
  message: string;
  data?: unknown;
}

/**
 * Command registry with IDs and descriptions for autocomplete
 */
export interface CommandInfo {
  id: string;
  description: string;
}

export const COMMAND_REGISTRY: CommandInfo[] = [
  { id: '/help', description: 'Show available commands' },
  { id: '/customer-create', description: 'Create customer with identity verification' },
  { id: '/create-customer', description: 'Alias for /customer-create' },
  { id: '/create-business', description: 'Create business customer' },
  { id: '/customer-KYC', description: 'Create KYC test customer (Jane Doe)' },
  { id: '/create-paykey', description: 'Link bank account' },
  { id: '/create-paykey-bridge', description: 'Link bank account using Straddle Bridge Widget' },
  { id: '/paykey-decision', description: 'Approve or reject paykey in review' },
  { id: '/paykey-review', description: 'Show review details for current paykey' },
  { id: '/create-charge', description: 'Create a payment' },
  { id: '/demo', description: 'Run full happy-path flow' },
  { id: '/info', description: 'Show current demo state' },
  { id: '/outcomes', description: 'Show available sandbox outcomes' },
  { id: '/reset', description: 'Clear all demo data' },
  { id: '/clear', description: 'Clear terminal output' },
  { id: '/end', description: 'End demo session' },
];

/**
 * Available terminal commands (for backward compatibility)
 */
export const AVAILABLE_COMMANDS = COMMAND_REGISTRY.map((cmd) => cmd.id);

/**
 * Business form data from BusinessCard component
 */
export interface BusinessFormData {
  name: string;
  email: string;
  phone: string;
  address: {
    address1: string;
    address2?: string;
    city: string;
    state: string;
    zip: string;
  };
  compliance_profile: {
    ein: string;
    legal_business_name: string;
    website: string;
  };
  device: {
    ip_address: string;
  };
  type: 'business';
}

/**
 * Parse and execute terminal command
 */
export async function executeCommand(
  input: string,
  formData?: BusinessFormData
): Promise<CommandResult> {
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
    case 'create-customer':
      return handleCreateCustomer(args);
    case 'customer-kyc':
      return handleCustomerKYC();
    case 'create-business':
      return handleCreateBusiness(args, formData);
    case 'create-paykey':
      return handleCreatePaykey(args);
    case 'create-paykey-bridge':
      return handleCreatePaykeyBridge();
    case 'paykey-decision':
      return handlePaykeyDecision(args);
    case 'paykey-review':
      return handlePaykeyReview();
    case 'create-charge':
      return handleCreateCharge(args);
    case 'demo':
      return handleDemo();
    case 'info':
      return handleInfo();
    case 'outcomes':
      return handleOutcomes();
    case 'reset':
      return handleReset();
    case 'clear':
      return handleClear();
    case 'end':
      return handleEnd();
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

- /customer-create (or /create-customer)
  Create customer with identity verification
  Options: --outcome standard|verified|review|rejected

- /create-business
  Create business customer (The Bluth Company)
  Options: --outcome standard|verified|review|rejected

- /customer-KYC
  Create KYC test customer (Jane Doe) with full compliance data

- /create-paykey [plaid|bank]
  Link a bank account (requires customer first)
  Options: --outcome standard|active|review|rejected

- /create-paykey-bridge
  Link a bank account using Straddle Bridge Widget (requires customer first)

- /paykey-decision [approve|reject]
  Approve or reject paykey in review

- /paykey-review
  Show review details for current paykey

- /create-charge
  Create a payment (requires paykey first)
  Options: --amount <cents> --outcome standard|paid|...

- /demo
  Run full happy-path flow (customer → paykey → charge)

- /info
  Show current demo state

- /outcomes
  Show all available sandbox outcome values

- /reset
  Clear all demo data

- /clear
  Clear terminal output

- /end
  End demo session

- /help
  Show this message
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
    const customerData: api.CreateCustomerRequest = {
      name: 'Jane Doe',
      email: uniqueEmail,
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
    };

    const customer = await api.createCustomer(customerData);

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
 * /create-business - Create business customer
 */
async function handleCreateBusiness(
  args: string[],
  formData?: BusinessFormData
): Promise<CommandResult> {
  try {
    // Parse outcome flag
    let outcome: 'standard' | 'verified' | 'review' | 'rejected' = 'standard';
    const outcomeIndex = args.indexOf('--outcome');
    if (outcomeIndex >= 0 && args[outcomeIndex + 1]) {
      const value = args[outcomeIndex + 1];
      if (['standard', 'verified', 'review', 'rejected'].includes(value)) {
        outcome = value as 'standard' | 'verified' | 'review' | 'rejected';
      } else {
        return {
          success: false,
          message: `✗ Invalid outcome: ${value}. Must be one of: standard, verified, review, rejected`,
        };
      }
    }

    let businessData: api.CreateCustomerRequest;

    if (formData) {
      // Use form data from BusinessCard component
      // Determine address2 based on outcome for PO Box codes
      let address2 = formData.address.address2 || 'PO Box I304'; // Default to review

      if (outcome === 'verified') {
        address2 = 'PO Box I301';
      } else if (outcome === 'rejected') {
        address2 = 'PO Box I103';
      }

      businessData = {
        type: 'business',
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: {
          ...formData.address,
          address2,
        },
        compliance_profile: formData.compliance_profile,
        outcome,
        // Note: device.ip_address is automatically added by the server from req.ip
      };
    } else {
      // Fall back to hardcoded data (for command-line usage)
      let address2 = 'PO Box I304'; // Default to review

      if (outcome === 'verified') {
        address2 = 'PO Box I301';
      } else if (outcome === 'rejected') {
        address2 = 'PO Box I103';
      }

      const address = {
        address1: '1234 Sandbox Street',
        address2,
        city: 'Mock City',
        state: 'CA',
        zip: '94105',
      };

      businessData = {
        type: 'business',
        name: 'The Bluth Company',
        email: `tobias.${Date.now()}@bluemyself.com`, // Unique email
        phone: '+15558675309',
        address,
        compliance_profile: {
          ein: '12-3456789', // Correct format with hyphen
          legal_business_name: 'The Bluth Company',
          website: 'thebananastand.com',
        },
        outcome, // Pass outcome to API config if supported, otherwise address drives it
      };
    }

    const customer = await api.createCustomer(businessData);

    // Update state
    useDemoStore.getState().setCustomer(customer);

    return {
      success: true,
      message: `✓ Business Customer created: ${customer.id} (${outcome})`,
      data: customer,
    };
  } catch (error) {
    return {
      success: false,
      message: `✗ Failed to create business customer: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * /create-paykey - Link bank account
 */
async function handleCreatePaykey(
  args: string[],
  options: { skipGenerator?: boolean } = {}
): Promise<CommandResult> {
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
    let outcome: 'standard' | 'active' | 'review' | 'rejected' | undefined;
    const outcomeIndex = args.indexOf('--outcome');
    if (outcomeIndex >= 0 && args[outcomeIndex + 1]) {
      const value = args[outcomeIndex + 1];
      if (['standard', 'active', 'review', 'rejected'].includes(value)) {
        outcome = value as 'standard' | 'active' | 'review' | 'rejected';
      } else {
        return {
          success: false,
          message: `✗ Invalid paykey outcome: ${value}. Must be one of: standard, active, review, rejected`,
        };
      }
    }

    // Call API (server will fetch review data internally)
    const paykey = await api.createPaykey({
      customer_id: customer.id,
      method,
      outcome,
    });

    // Extract data for generator modal
    const customerName = customer.name || 'Customer';

    // Extract WALDO data (only for Plaid paykeys with name_match data)
    const waldoData =
      method === 'plaid' && paykey.review?.verification_details?.breakdown?.name_match
        ? {
            correlationScore:
              paykey.review.verification_details.breakdown.name_match.correlation_score ?? 0,
            matchedName: paykey.review.verification_details.breakdown.name_match.matched_name ?? '',
            namesOnAccount:
              paykey.review.verification_details.breakdown.name_match.names_on_account ?? [],
          }
        : undefined;

    // Extract account details
    const accountLast4 = paykey.bank_data?.account_number?.slice(-4) ?? '****';
    const routingNumber = paykey.bank_data?.routing_number ?? '';

    // Show generator modal BEFORE state update if not skipped
    if (!options.skipGenerator) {
      useDemoStore.getState().setGeneratorData({
        customerName,
        waldoData,
        paykeyToken: paykey.paykey,
        accountLast4,
        routingNumber,
      });
    }

    // State will update automatically via SSE
    // Modal will auto-close after animations complete (~14 seconds)

    // Update state manually as well for immediate feedback/testing
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
 * /create-paykey-bridge - Link bank account via Bridge Widget
 */
async function handleCreatePaykeyBridge(): Promise<CommandResult> {
  try {
    const { customer, setBridgeToken, setBridgeModalOpen } = useDemoStore.getState();
    if (!customer) {
      return {
        success: false,
        message: '✗ No customer found. Run /customer-create first.',
      };
    }

    // Initialize bridge
    const { bridge_token } = await api.initializeBridge(customer.id);

    // Open modal
    setBridgeToken(bridge_token);
    setBridgeModalOpen(true);

    return {
      success: true,
      message: '✓ Bridge initialized. Opening widget...',
    };
  } catch (error) {
    return {
      success: false,
      message: `✗ Failed to initialize bridge: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
 * /paykey-decision - Approve or reject paykey in review
 */
async function handlePaykeyDecision(args: string[]): Promise<CommandResult> {
  const decision = args.find((a) => a === 'approve' || a === 'reject');

  if (!decision) {
    return {
      success: false,
      message: 'Usage: /paykey-decision [approve|reject]',
    };
  }

  const { paykey } = useDemoStore.getState();
  if (!paykey?.id) {
    return {
      success: false,
      message: 'Error: No paykey found. Create a paykey first with /create-paykey',
    };
  }

  if (paykey.status !== 'review') {
    return {
      success: false,
      message: `Error: Paykey status is "${paykey.status}", not "review". Only paykeys in review can be approved/rejected.`,
    };
  }

  try {
    const decisionValue = decision === 'approve' ? 'approved' : 'rejected';
    await api.updatePaykeyReview(paykey.id, { decision: decisionValue });

    // Fetch updated paykey to get new status
    const updatedPaykey = await api.getPaykey(paykey.id);

    // Update state with new paykey data
    useDemoStore.getState().setPaykey(updatedPaykey);

    return {
      success: true,
      message: `Paykey review ${decisionValue}. Status: ${updatedPaykey.status}`,
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to update paykey review: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * /paykey-review - Show review details for current paykey
 */
async function handlePaykeyReview(): Promise<CommandResult> {
  const { paykey } = useDemoStore.getState();
  if (!paykey?.id) {
    return {
      success: false,
      message: 'Error: No paykey found. Create a paykey first with /create-paykey',
    };
  }

  if (paykey.status !== 'review') {
    return {
      success: false,
      message: `Error: Paykey status is "${paykey.status}", not "review". Only paykeys in review have review details.`,
    };
  }

  try {
    const reviewDetails = await api.getPaykeyReview(paykey.id);

    // Log to console for inspection
    console.info('Paykey Review Details:', reviewDetails);

    // Update paykey in state with review data so UI can display it
    const updatedPaykey = {
      ...paykey,
      review: reviewDetails,
    };
    useDemoStore.getState().setPaykey(updatedPaykey);

    // Build readable message from review data
    const msgs: string[] = ['Paykey Review Details:'];

    if (reviewDetails.verification_details?.decision) {
      msgs.push(`Decision: ${reviewDetails.verification_details.decision}`);
    }

    if (reviewDetails.verification_details?.breakdown) {
      const { account_validation, name_match } = reviewDetails.verification_details.breakdown;

      if (account_validation) {
        msgs.push(`Account Validation: ${account_validation.decision || 'N/A'}`);
        if (account_validation.reason) {
          msgs.push(`  Reason: ${account_validation.reason}`);
        }
      }

      if (name_match) {
        msgs.push(`Name Match: ${name_match.decision || 'N/A'}`);
        if (name_match.correlation_score !== undefined) {
          msgs.push(`  Correlation Score: ${name_match.correlation_score}`);
        }
        if (name_match.customer_name && name_match.matched_name) {
          msgs.push(`  Customer: ${name_match.customer_name}`);
          msgs.push(`  Matched: ${name_match.matched_name}`);
        }
      }
    }

    msgs.push('(See browser console for full details)');

    return {
      success: true,
      message: msgs.join('\n'),
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to get paykey review: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * /demo - Run full flow
 */
async function handleDemo(): Promise<CommandResult> {
  const { addTerminalLine } = useDemoStore.getState();

  try {
    // Play auto attack sound at start of demo
    void playAutoAttackSound();

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
    const paykeyResult = await handleCreatePaykey(['plaid', '--outcome', 'active'], {
      skipGenerator: true,
    });
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

    const lines: string[] = ['Current Demo State:', ''];

    if (state.customer) {
      lines.push(`- Customer: ${state.customer.id}`);
      lines.push(`  Status: ${state.customer.verification_status}`);
      lines.push('');
    } else {
      lines.push('- Customer: None');
      lines.push('');
    }

    if (state.paykey) {
      lines.push(`- Paykey: ${state.paykey.id}`);
      lines.push(`  Status: ${state.paykey.status}`);
      lines.push('');
    } else {
      lines.push('- Paykey: None');
      lines.push('');
    }

    if (state.charge) {
      lines.push(`- Charge: ${state.charge.id}`);
      lines.push(`  Status: ${state.charge.status}`);
      lines.push(`  Amount: $${(state.charge.amount / 100).toFixed(2)}`);
      lines.push('');
    } else {
      lines.push('- Charge: None');
      lines.push('');
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
 * /outcomes - Show available sandbox outcomes
 */
async function handleOutcomes(): Promise<CommandResult> {
  try {
    const outcomes = await api.getOutcomes();

    const lines: string[] = ['Available Sandbox Outcomes:', ''];

    lines.push('Customers:');
    outcomes.customer.forEach((o) => lines.push(`  - ${o}`));
    lines.push('');

    lines.push('Paykeys:');
    outcomes.paykey.forEach((o) => lines.push(`  - ${o}`));
    lines.push('');

    lines.push('Charges:');
    outcomes.charge.forEach((o) => lines.push(`  - ${o}`));

    return {
      success: true,
      message: lines.join('\n'),
    };
  } catch (error) {
    return {
      success: false,
      message: `✗ Failed to fetch outcomes: ${error instanceof Error ? error.message : 'Unknown error'}`,
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

/**
 * /end - End demo session
 */
function handleEnd(): CommandResult {
  void playEndDemoSound();

  // Show the end demo banner
  const { setShowEndDemoBanner } = useDemoStore.getState();
  setTimeout(() => setShowEndDemoBanner(true), 500);

  return {
    success: true,
    message: 'Demo ended. Thank you for watching! 🎮',
  };
}
