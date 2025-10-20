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

/**
 * Generates and plays a procedural gunshot sound.
 * Consists of a noisy burst and a tonal "crack" with a pitch drop.
 */
export function playGunshot() {
    const context = getAudioContext();
    if (context.state === 'suspended') {
        context.resume();
    }
    const now = context.currentTime;

    // Noise part (the "boom")
    const bufferSize = context.sampleRate * 0.2; // 0.2 seconds
    const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
    }
    
    const noiseSource = context.createBufferSource();
    noiseSource.buffer = buffer;
    
    const noiseGain = context.createGain();
    noiseGain.gain.setValueAtTime(1, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    noiseSource.connect(noiseGain);
    
    // Tonal part (the "crack")
    const osc = context.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
    
    const oscGain = context.createGain();
    oscGain.gain.setValueAtTime(0.5, now);
    oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

    osc.connect(oscGain);

    // Combine and play
    const masterGain = context.createGain();
    masterGain.gain.value = 0.15; // Not too loud
    noiseGain.connect(masterGain);
    oscGain.connect(masterGain);
    masterGain.connect(context.destination);
    
    noiseSource.start(now);
    osc.start(now);
    noiseSource.stop(now + 0.2);
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