/* ============================================================================
   js/audio.js — Procedural Minecraft-Style Web Audio Synthesizer
   ============================================================================ */
(function (root) {
  'use strict';

  class VoxelAudio {
    constructor() {
      this.ctx = null;
      this.enabled = true;
      this.noiseBuf = null;
    }

    unlock() {
      if (!this.enabled) return;
      const Ctx = root.AudioContext || root.webkitAudioContext;
      if (!Ctx) return;
      if (!this.ctx) {
        this.ctx = new Ctx();
        const len = this.ctx.sampleRate;
        const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
        this.noiseBuf = buf;
      }
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
    }

    setEnabled(val) {
      this.enabled = Boolean(val);
    }

    _tone(type, f0, f1, dur, vol, delay) {
      if (!this.enabled || !this.ctx) return;
      const t = this.ctx.currentTime + (delay || 0);
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(Math.max(40, f0), t);
      if (f1 && f1 !== f0) osc.frequency.exponentialRampToValueAtTime(Math.max(40, f1), t + dur);
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(vol, t + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0008, t + dur);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + dur + 0.02);
    }

    _noise(dur, freq, q, vol) {
      if (!this.enabled || !this.ctx || !this.noiseBuf) return;
      const t = this.ctx.currentTime;
      const src = this.ctx.createBufferSource();
      src.buffer = this.noiseBuf;
      const flt = this.ctx.createBiquadFilter();
      flt.type = 'bandpass';
      flt.frequency.setValueAtTime(freq, t);
      flt.Q.setValueAtTime(q || 1.4, t);
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
      src.connect(flt);
      flt.connect(g);
      g.connect(this.ctx.destination);
      src.start(t, Math.random() * 0.3);
      src.stop(t + dur + 0.02);
    }

    play(sfx) {
      if (!this.enabled) return;
      this.unlock();
      if (!this.ctx) return;
      switch (sfx) {
        case 'mine':
          this._noise(0.09, 1200, 1.8, 0.14);
          this._tone('square', 220, 140, 0.07, 0.08);
          break;
        case 'diamond':
          this._tone('triangle', 880, 1320, 0.15, 0.11);
          this._tone('sine', 1320, 1760, 0.22, 0.1, 0.08);
          break;
        case 'expand':
          this._tone('triangle', 392, 523.25, 0.18, 0.12, 0);
          this._tone('triangle', 523.25, 659.25, 0.18, 0.12, 0.1);
          this._tone('triangle', 659.25, 1046.5, 0.32, 0.14, 0.2);
          break;
        case 'sword':
          this._noise(0.12, 2400, 1.2, 0.14);
          this._tone('sawtooth', 420, 160, 0.09, 0.08);
          break;
        case 'portal':
          this._tone('sine', 160, 480, 0.45, 0.11);
          this._tone('triangle', 240, 620, 0.42, 0.08, 0.06);
          break;
        case 'upgrade':
          this._tone('square', 523, 659, 0.1, 0.08, 0);
          this._tone('square', 659, 784, 0.1, 0.08, 0.08);
          this._tone('square', 784, 1046, 0.22, 0.1, 0.16);
          break;
        case 'apple':
          this._noise(0.08, 1800, 2.2, 0.1);
          this._tone('sine', 580, 920, 0.18, 0.1, 0.05);
          break;
        case 'crystal':
          this._noise(0.24, 3400, 1.0, 0.16);
          this._tone('sawtooth', 620, 110, 0.28, 0.12);
          break;
        case 'dragonHit':
          this._tone('sawtooth', 145, 72, 0.25, 0.14);
          this._noise(0.16, 850, 1.5, 0.12);
          break;
        case 'victory':
          [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => {
            this._tone('triangle', f, f, 0.26, 0.12, i * 0.11);
          });
          break;
        default:
          this._tone('sine', 440, 620, 0.08, 0.07);
      }
    }
  }

  const EXPORT = { VoxelAudio };
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = EXPORT;
  } else {
    root.MaizenAudio = EXPORT;
  }
})(typeof window !== 'undefined' ? window : globalThis);
