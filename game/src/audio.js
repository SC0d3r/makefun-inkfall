// Tiny WebAudio synth. Every sound is an oscillator or a filtered noise burst; no files.
export function createAudio() {
  let ctx = null;
  let master = null;
  let noise = null;

  function unlock() {
    if (ctx !== null) {
      if (ctx.state === 'suspended') ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.16;
    master.connect(ctx.destination);
    const length = Math.floor(ctx.sampleRate * 0.4);
    noise = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;
  }

  function tone(freq, dur, type = 'sine', vol = 0.2, slide = 0, pan = 0) {
    if (ctx === null || master === null) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(30, freq), now);
    if (slide !== 0) osc.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), now + dur);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    const panner = ctx.createStereoPanner();
    panner.pan.value = Math.max(-1, Math.min(1, pan));
    osc.connect(gain).connect(panner).connect(master);
    osc.start(now);
    osc.stop(now + dur + 0.02);
  }

  function burst(dur = 0.12, vol = 0.18, cutoff = 900, pan = 0) {
    if (ctx === null || noise === null) return;
    const now = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = noise;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = cutoff;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    const panner = ctx.createStereoPanner();
    panner.pan.value = Math.max(-1, Math.min(1, pan));
    src.connect(filter).connect(gain).connect(panner).connect(master);
    src.start(now);
    src.stop(now + dur + 0.02);
  }

  return {
    unlock,
    step(pan = 0, vol = 0.05) {
      burst(0.045, vol, 420, pan);
    },
    guardStep(pan = 0, vol = 0.06) {
      burst(0.06, vol, 260, pan);
      tone(72, 0.05, 'sine', vol * 0.5, -8, pan);
    },
    alert() {
      tone(520, 0.14, 'square', 0.1, 180);
      setTimeout(() => tone(760, 0.2, 'square', 0.09, 120), 90);
    },
    pickup() {
      tone(880, 0.1, 'sine', 0.12, 200);
      setTimeout(() => tone(1320, 0.16, 'sine', 0.1, 100), 80);
    },
    splat() {
      burst(0.22, 0.2, 600);
      tone(95, 0.18, 'sine', 0.12, -30);
    },
    squeak() {
      tone(1180, 0.08, 'square', 0.07, 520);
      setTimeout(() => tone(1420, 0.1, 'square', 0.06, 260), 90);
    },
    ping() {
      tone(1480, 0.12, 'triangle', 0.07, -300);
    },
    horn() {
      tone(196, 0.55, 'sawtooth', 0.12, -22);
      tone(147, 0.65, 'square', 0.07, -14);
    },
    caught() {
      burst(0.32, 0.25, 300);
      tone(110, 0.3, 'sine', 0.16, -55);
      tone(74, 0.45, 'triangle', 0.1, -20);
    },
    nearMiss() {
      tone(990, 0.08, 'sine', 0.06, 160);
      setTimeout(() => tone(1240, 0.12, 'sine', 0.05, 120), 70);
    },
    win() {
      [392, 523, 659, 784].forEach((f, i) => setTimeout(() => tone(f, 0.3, 'triangle', 0.1, 20), i * 130));
    },
    lose() {
      [330, 262, 196, 147].forEach((f, i) => setTimeout(() => tone(f, 0.34, 'sawtooth', 0.07, -18), i * 150));
    },
    hide() {
      burst(0.06, 0.08, 700);
    },
  };
}
