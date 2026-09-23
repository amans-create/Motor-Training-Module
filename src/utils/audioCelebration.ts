/**
 * Web Audio API synthesizer for instant celebration sound (fanfare chime)
 * Works client-side without any external audio file downloads.
 */
export function playCelebrationFanfare(): void {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    const notes = [
      { freq: 523.25, time: 0.0, duration: 0.15 }, // C5
      { freq: 659.25, time: 0.15, duration: 0.15 }, // E5
      { freq: 783.99, time: 0.30, duration: 0.20 }, // G5
      { freq: 1046.50, time: 0.50, duration: 0.45 }, // C6 (long)
      { freq: 1318.51, time: 0.70, duration: 0.60 }  // E6 (sparkle)
    ];

    notes.forEach((note) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.freq, ctx.currentTime + note.time);

      gain.gain.setValueAtTime(0.001, ctx.currentTime + note.time);
      gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + note.time + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + note.time + note.duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + note.time);
      osc.stop(ctx.currentTime + note.time + note.duration + 0.1);
    });
  } catch (err) {
    console.warn('Audio playback bypassed or unsupported', err);
  }
}
