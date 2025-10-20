// Simple procedural sound effects generator using Web Audio API

let audioContext: AudioContext;

// Lazily create and retrieve the audio context.
// This needs to be initiated by a user gesture (like a click).
function getAudioContext(): AudioContext {
    if (!audioContext) {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContext;
}

export type SoundProfile = {
  baseFrequency: number;
  pitchDrop: number;
  noiseDuration: number;
  gain: number;
};

/**
 * Generates and plays a procedural gunshot sound based on a profile.
 * Consists of a noisy burst and a tonal "crack" with a pitch drop.
 */
export function playGunshot(profile?: SoundProfile) {
    const context = getAudioContext();
    if (context.state === 'suspended') {
        context.resume();
    }
    const now = context.currentTime;

    const p = {
        baseFrequency: profile?.baseFrequency ?? 800,
        pitchDrop: profile?.pitchDrop ?? 100,
        noiseDuration: profile?.noiseDuration ?? 0.2,
        gain: profile?.gain ?? 0.15,
    };

    // Noise part (the "boom")
    const bufferSize = Math.floor(context.sampleRate * p.noiseDuration);
    const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
    }
    
    const noiseSource = context.createBufferSource();
    noiseSource.buffer = buffer;
    
    const noiseGain = context.createGain();
    noiseGain.gain.setValueAtTime(1, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + p.noiseDuration * 0.9);

    noiseSource.connect(noiseGain);
    
    // Tonal part (the "crack")
    const osc = context.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(p.baseFrequency, now);
    osc.frequency.exponentialRampToValueAtTime(p.pitchDrop, now + 0.1);
    
    const oscGain = context.createGain();
    oscGain.gain.setValueAtTime(0.5, now);
    oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

    osc.connect(oscGain);

    // Combine and play
    const masterGain = context.createGain();
    masterGain.gain.value = p.gain;
    noiseGain.connect(masterGain);
    oscGain.connect(masterGain);
    masterGain.connect(context.destination);
    
    noiseSource.start(now);
    osc.start(now);
    noiseSource.stop(now + p.noiseDuration);
    osc.stop(now + 0.2);
}

let lastFootstepTime = 0;

/**
 * Generates and plays a procedural footstep sound.
 * A short, low-pass filtered burst of noise.
 */
export function playFootstep() {
    const context = getAudioContext();
    if (context.state === 'suspended') {
        context.resume();
    }
    const now = context.currentTime;
    
    // Rate limit footsteps
    if (now - lastFootstepTime < 0.35) return;
    lastFootstepTime = now;

    const bufferSize = context.sampleRate * 0.1;
    const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    const noise = context.createBufferSource();
    noise.buffer = buffer;
    
    const filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 400 + Math.random() * 200;
    
    const gain = context.createGain();
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(context.destination);
    
    noise.start(now);
    noise.stop(now + 0.1);
}

/**
 * Generates and plays a procedural enemy death sound.
 * A "squishy" sound with a descending pitch.
 */
export function playEnemyDeath() {
    const context = getAudioContext();
    if (context.state === 'suspended') {
        context.resume();
    }
    const now = context.currentTime;

    const bufferSize = context.sampleRate * 0.5;
    const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    const noise = context.createBufferSource();
    noise.buffer = buffer;
    
    const filter = context.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 5;
    filter.frequency.setValueAtTime(1000, now);
    filter.frequency.exponentialRampToValueAtTime(200, now + 0.4);
    
    const gain = context.createGain();
    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(context.destination);
    
    noise.start(now);
    noise.stop(now + 0.5);
}