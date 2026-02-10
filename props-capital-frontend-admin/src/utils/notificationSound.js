/**
 * Play notification sound for trading alerts
 * Uses Web Audio API to generate sounds without external files
 */

let audioContext = null;

// Initialize audio context (lazy initialization to avoid autoplay issues)
const getAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioContext;
};

/**
 * Play a beep sound with specified frequency and duration
 * @param {number} frequency - Frequency in Hz (e.g., 440 for A4)
 * @param {number} duration - Duration in milliseconds
 * @param {number} volume - Volume level (0-1)
 */
const playBeep = (frequency, duration, volume = 0.3) => {
  try {
    const context = getAudioContext();
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(volume, context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + duration / 1000);

    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + duration / 1000);
  } catch (error) {
    console.warn('Failed to play notification sound:', error);
  }
};

/**
 * Play stop loss hit alert (urgent, lower pitch)
 */
export const playStopLossAlert = () => {
  // Two-tone urgent alert: low-high-low
  playBeep(300, 200, 0.4);
  setTimeout(() => playBeep(400, 200, 0.4), 220);
  setTimeout(() => playBeep(300, 300, 0.4), 440);
};

/**
 * Play take profit hit alert (success, higher pitch)
 */
export const playTakeProfitAlert = () => {
  // Pleasant ascending tones
  playBeep(523, 150, 0.3); // C5
  setTimeout(() => playBeep(659, 150, 0.3), 160); // E5
  setTimeout(() => playBeep(784, 200, 0.3), 320); // G5
};

/**
 * Play position closed alert (neutral)
 */
export const playPositionClosedAlert = () => {
  // Single neutral tone
  playBeep(440, 250, 0.3);
};

/**
 * Play alert based on close reason
 * @param {string} closeReason - 'SL_HIT', 'TP_HIT', or 'USER_CLOSE'
 */
export const playClosureAlert = (closeReason) => {
  switch (closeReason) {
    case 'SL_HIT':
      playStopLossAlert();
      break;
    case 'TP_HIT':
      playTakeProfitAlert();
      break;
    default:
      playPositionClosedAlert();
      break;
  }
};

