/**
 * Sound system for review decision feedback and demo events
 */

let soundEnabled = true; // Changed to true - enable by default

/**
 * Enable/disable sound system
 */
export function setSoundEnabled(enabled: boolean): void {
  soundEnabled = enabled;
}

/**
 * Get current sound enabled state
 */
export function isSoundEnabled(): boolean {
  return soundEnabled;
}

/**
 * Play reject sound
 */
export async function playRejectSound(): Promise<boolean> {
  if (!soundEnabled) {
    return false;
  }

  try {
    const audio = new Audio('/sounds/reject.mp3');
    audio.volume = 0.5;
    await audio.play();
    return true;
  } catch (error) {
    console.warn('Reject sound failed to play:', error);
    return false;
  }
}

/**
 * Play approve sound
 */
export async function playApproveSound(): Promise<boolean> {
  if (!soundEnabled) {
    return false;
  }

  try {
    const audio = new Audio('/sounds/approve.mp3');
    audio.volume = 0.3;
    await audio.play();
    return true;
  } catch (error) {
    console.warn('Approve sound failed to play:', error);
    return false;
  }
}

/**
 * Play review alert sound (when customer or paykey enters review status)
 */
export async function playReviewAlertSound(): Promise<boolean> {
  if (!soundEnabled) {
    return false;
  }

  try {
    const audio = new Audio('/sounds/review_alert.mp3');
    audio.volume = 0.4;
    await audio.play();
    return true;
  } catch (error) {
    console.warn('Review alert sound failed to play:', error);
    return false;
  }
}

/**
 * Play end demo sound
 */
export async function playEndDemoSound(): Promise<boolean> {
  if (!soundEnabled) {
    return false;
  }

  try {
    const audio = new Audio('/sounds/end_demo.mp3');
    audio.volume = 0.5;
    await audio.play();
    return true;
  } catch (error) {
    console.warn('End demo sound failed to play:', error);
    return false;
  }
}

/**
 * Play charge status event sound (for successful charge events)
 */
export async function playChargeStatusSound(): Promise<boolean> {
  if (!soundEnabled) {
    return false;
  }

  try {
    const audio = new Audio('/sounds/charge_status_event.mp3');
    audio.volume = 0.4;
    await audio.play();
    return true;
  } catch (error) {
    console.warn('Charge status sound failed to play:', error);
    return false;
  }
}

/**
 * Play auto attack sound (when demo command starts)
 */
export async function playAutoAttackSound(): Promise<boolean> {
  if (!soundEnabled) {
    return false;
  }

  try {
    const audio = new Audio('/sounds/auto_attack.mp3');
    audio.volume = 0.5;
    await audio.play();
    return true;
  } catch (error) {
    console.warn('Auto attack sound failed to play:', error);
    return false;
  }
}
