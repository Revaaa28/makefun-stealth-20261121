// The Lantern Vault — sound, made only with WebAudio oscillators. No
// audio files: footsteps tick, a guard's alarm stings, relics chime and
// the getaway plays a little arpeggio. M mutes everything.
export function createAudio() {
  const audio = {
    ctx: null,
    muted: false,
    master: null,
    lastStepAt: 0,
  };

  function ensure() {
    if (audio.ctx) {
      if (audio.ctx.state === 'suspended') audio.ctx.resume();
      return true;
    }
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      audio.ctx = new Ctx();
      audio.master = audio.ctx.createGain();
      audio.master.gain.value = 0.5;
      audio.master.connect(audio.ctx.destination);
      return true;
    } catch {
      return false;
    }
  }

  function tone(freq, seconds, type, volume, when = 0, slideTo = null) {
    if (!ensure() || audio.muted || volume <= 0.001) return;
    const t0 = audio.ctx.currentTime + when;
    const osc = audio.ctx.createOscillator();
    const gain = audio.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + seconds);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(volume, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + seconds);
    osc.connect(gain);
    gain.connect(audio.master);
    osc.start(t0);
    osc.stop(t0 + seconds + 0.05);
  }

  return {
    unlock: ensure,
    toggleMute() {
      audio.muted = !audio.muted;
      return audio.muted;
    },
    isMuted: () => audio.muted,
    // A soft tick for a footstep; volume fades with distance (0..1).
    footstep(distance01) {
      const now = performance.now();
      if (now - audio.lastStepAt < 90) return;
      audio.lastStepAt = now;
      tone(150 + Math.random() * 40, 0.07, 'triangle', 0.12 * distance01);
    },
    guardStep(distance01) {
      tone(110, 0.09, 'sine', 0.10 * distance01);
    },
    // Two-note sting when a guard goes from suspicious to alert.
    alarm() {
      tone(392, 0.16, 'square', 0.10);
      tone(311, 0.22, 'square', 0.10, 0.14);
    },
    spotted() {
      tone(660, 0.12, 'sine', 0.12, 0, 520);
    },
    pickup() {
      tone(880, 0.10, 'sine', 0.14);
      tone(1318, 0.16, 'sine', 0.12, 0.09);
    },
    win() {
      [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.22, 'triangle', 0.14, i * 0.11));
    },
    caught() {
      tone(220, 0.5, 'sawtooth', 0.12, 0, 110);
    },
  };
}
