// ==========================================
// PREMIUM PROCEDURAL AUDIO ENGINE
// Generates glassy, high-end sounds without external files
// ==========================================

class PremiumAudioEngine {
    constructor() {
        this.ctx = null;
        // Load settings from Local Storage (Default to ON)
        this.sfxEnabled = localStorage.getItem('omniSoundFX') !== 'false';
    }

    // Must be called on first user interaction to unlock the audio context
    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    toggleSFX() {
        this.sfxEnabled = !this.sfxEnabled;
        localStorage.setItem('omniSoundFX', this.sfxEnabled);
        if (this.sfxEnabled) this.playClick();
        return this.sfxEnabled;
    }

    // --- Core Synth Engine ---
    playTone(freq, type, duration, vol = 0.1) {
        if (!this.sfxEnabled || !this.ctx) return;
        
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        
        // Premium ADSR Envelope (Smooth attack, exponential decay for a "glassy" sound)
        gain.gain.setValueAtTime(0, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(vol, this.ctx.currentTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    // --- Specific Sound Triggers ---
    playClick() {
        // Soft UI pop
        this.playTone(600, 'sine', 0.1, 0.1);
        this.playTone(800, 'triangle', 0.1, 0.05);
    }

    playHighlight() {
        // Marimba-like tick for dragging over letters
        this.playTone(850 + (Math.random() * 50), 'sine', 0.08, 0.05);
    }

    playFound() {
        // Ascending magical major chord
        this.playTone(523.25, 'sine', 0.4, 0.1); // C5
        setTimeout(() => this.playTone(659.25, 'sine', 0.4, 0.1), 100); // E5
        setTimeout(() => this.playTone(783.99, 'sine', 0.6, 0.1), 200); // G5
        setTimeout(() => this.playTone(1046.50, 'triangle', 0.8, 0.15), 300); // C6
    }

    playExtraFound() {
        // Quick sparkly Lydian sweep for extra words
        this.playTone(587.33, 'sine', 0.3, 0.1); // D5
        setTimeout(() => this.playTone(830.61, 'sine', 0.4, 0.1), 100); // F#5
        setTimeout(() => this.playTone(1174.66, 'triangle', 0.5, 0.1), 200); // D6
    }

    playPowerup() {
        // Sci-fi sweep
        if (!this.sfxEnabled || !this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.frequency.setValueAtTime(400, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.3);
    }

    playWin() {
        // Triumphant orchestrations
        this.playTone(440, 'triangle', 0.5, 0.1); // A4
        this.playTone(554.37, 'triangle', 0.5, 0.1); // C#5
        this.playTone(659.25, 'triangle', 0.5, 0.1); // E5
        
        setTimeout(() => {
            this.playTone(587.33, 'triangle', 0.5, 0.1); // D5
            this.playTone(740.00, 'triangle', 0.5, 0.1); // F#5
            this.playTone(880.00, 'triangle', 0.5, 0.1); // A5
        }, 300);

        setTimeout(() => {
            this.playTone(659.25, 'triangle', 1.5, 0.15); // E5
            this.playTone(830.61, 'triangle', 1.5, 0.15); // G#5
            this.playTone(987.77, 'triangle', 1.5, 0.15); // B5
            this.playTone(1318.51, 'sine', 2.0, 0.1); // E6
        }, 600);
    }
}

// Global instance
const audioEngine = new PremiumAudioEngine();