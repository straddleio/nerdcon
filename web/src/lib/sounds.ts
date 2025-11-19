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
 * Play end demo sound (plays twice back-to-back)
 */
export async function playEndDemoSound(): Promise<boolean> {
  if (!soundEnabled) {
    return false;
  }

  try {
    // Play first time
    const audio1 = new Audio('/sounds/end_demo.mp3');
    audio1.volume = 0.5;
    await audio1.play();

    // Wait for first playback to finish, then play second time
    return new Promise((resolve) => {
      audio1.onended = async () => {
        try {
          const audio2 = new Audio('/sounds/end_demo.mp3');
          audio2.volume = 0.5;
          await audio2.play();
          resolve(true);
        } catch (error) {
          console.warn('End demo sound (second play) failed:', error);
          resolve(false);
        }
      };
    });
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

/**
 * Play bridge opened sound (when Bridge modal opens)
 */
export async function playBridgeOpenedSound(): Promise<boolean> {
  if (!soundEnabled) {
    return false;
  }

  try {
    const audio = new Audio('/sounds/bridge_opened.mp3');
    audio.volume = 0.4;
    await audio.play();
    return true;
  } catch (error) {
    console.warn('Bridge opened sound failed to play:', error);
    return false;
  }
}

/**
 * Play menu opened sound (when command menu opens)
 */
export async function playMenuOpenedSound(): Promise<boolean> {
  if (!soundEnabled) {
    return false;
  }

  try {
    const audio = new Audio('/sounds/menu_opened.mp3');
    audio.volume = 0.3;
    await audio.play();
    return true;
  } catch (error) {
    console.warn('Menu opened sound failed to play:', error);
    return false;
  }
}

/**
 * Play menu closed sound (when command menu closes)
 */
export async function playMenuClosedSound(): Promise<boolean> {
  if (!soundEnabled) {
    return false;
  }

  try {
    const audio = new Audio('/sounds/menu_closed.mp3');
    audio.volume = 0.3;
    await audio.play();
    return true;
  } catch (error) {
    console.warn('Menu closed sound failed to play:', error);
    return false;
  }
}
