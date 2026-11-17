// Night ambience synthesized with the Web Audio API: campfire crackle, crickets and wind.
// One AudioContext, created on the first user gesture.

type Focus = "overview" | "fire" | "skills" | "sky" | "tent";

class Ambience {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private fireBus: GainNode | null = null;
  private natureBus: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private timer: number | null = null;
  private nextCricket = 0;
  private muted = false;

  start() {
    if (typeof window === "undefined") return;
    if (this.ctx) {
      void this.ctx.resume();
      return;
    }
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    this.ctx = ctx;

    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -10;
    limiter.ratio.value = 12;
    limiter.connect(ctx.destination);

    this.master = ctx.createGain();
    this.master.gain.value = 0;
    this.master.connect(limiter);
    this.master.gain.setTargetAtTime(this.muted ? 0 : 0.9, ctx.currentTime, 1.2);

    this.fireBus = ctx.createGain();
    this.fireBus.gain.value = 0.8;
    this.fireBus.connect(this.master);
    this.natureBus = ctx.createGain();
    this.natureBus.gain.value = 0.7;
    this.natureBus.connect(this.master);

    // 2 s of white noise, shared by every noise source.
    const len = ctx.sampleRate * 2;
    this.noise = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = this.noise.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;

    this.buildFireBed();
    this.buildWind();
    this.nextCricket = ctx.currentTime + 0.5;
    this.timer = window.setInterval(() => this.schedule(), 60);

    document.addEventListener("visibilitychange", this.onVisibility);
  }

  private onVisibility = () => {
    if (!this.ctx) return;
    if (document.hidden) void this.ctx.suspend();
    else if (!this.muted) void this.ctx.resume();
  };

  private noiseSource() {
    const src = this.ctx!.createBufferSource();
    src.buffer = this.noise;
    src.loop = true;
    src.loopStart = Math.random();
    return src;
  }

  private buildFireBed() {
    const ctx = this.ctx!;
    // Low roar of the flames.
    const src = this.noiseSource();
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 520;
    const g = ctx.createGain();
    g.gain.value = 0.11;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.35;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.04;
    lfo.connect(lfoGain).connect(g.gain);
    src.connect(lp).connect(g).connect(this.fireBus!);
    src.start(0, Math.random());
    lfo.start();
  }

  private buildWind() {
    const ctx = this.ctx!;
    const src = this.noiseSource();
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 380;
    bp.Q.value = 0.6;
    const g = ctx.createGain();
    g.gain.value = 0.05;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.06;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.035;
    lfo.connect(lfoGain).connect(g.gain);
    const lfo2 = ctx.createOscillator();
    lfo2.frequency.value = 0.09;
    const lfo2Gain = ctx.createGain();
    lfo2Gain.gain.value = 180;
    lfo2.connect(lfo2Gain).connect(bp.frequency);
    src.connect(bp).connect(g).connect(this.natureBus!);
    src.start(0, Math.random());
    lfo.start();
    lfo2.start();
  }

  private crackle(when: number) {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const f = ctx.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.value = 1200 + Math.random() * 4200;
    f.Q.value = 0.9 + Math.random() * 2;
    const g = ctx.createGain();
    const peak = 0.08 + Math.random() * Math.random() * 0.5;
    const dur = 0.006 + Math.random() * 0.035;
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(peak, when + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0005, when + dur);
    const pan = ctx.createStereoPanner();
    pan.pan.value = Math.random() * 0.6 - 0.3;
    src.connect(f).connect(g).connect(pan).connect(this.fireBus!);
    src.start(when, Math.random() * 1.5, dur + 0.02);
  }

  private cricket(when: number) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = 4100 + Math.random() * 900;
    const g = ctx.createGain();
    g.gain.value = 0;
    const pan = ctx.createStereoPanner();
    pan.pan.value = Math.random() * 1.6 - 0.8;
    const vol = 0.012 + Math.random() * 0.018;
    const pulses = 3 + Math.floor(Math.random() * 3);
    let t = when;
    for (let i = 0; i < pulses; i++) {
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(vol, t + 0.006);
      g.gain.linearRampToValueAtTime(0, t + 0.022);
      t += 0.042;
    }
    osc.connect(g).connect(pan).connect(this.natureBus!);
    osc.start(when);
    osc.stop(t + 0.05);
  }

  private schedule() {
    const ctx = this.ctx;
    if (!ctx || ctx.state !== "running") return;
    const now = ctx.currentTime;
    // Crackles: Poisson-ish, a few per second, sometimes in bursts.
    const rate = 5;
    const n = Math.random() < rate * 0.06 ? (Math.random() < 0.2 ? 3 : 1) : 0;
    for (let i = 0; i < n; i++) this.crackle(now + 0.05 + Math.random() * 0.06);
    // Crickets on a loose rhythm.
    while (this.nextCricket < now + 0.2) {
      this.cricket(this.nextCricket);
      if (Math.random() < 0.35) this.cricket(this.nextCricket + 0.18 + Math.random() * 0.1);
      this.nextCricket += 0.55 + Math.random() * 1.1;
    }
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    if (!this.ctx || !this.master) return;
    if (!muted) void this.ctx.resume();
    this.master.gain.setTargetAtTime(muted ? 0 : 0.9, this.ctx.currentTime, 0.25);
  }

  setFocus(focus: Focus) {
    if (!this.ctx || !this.fireBus || !this.natureBus) return;
    const t = this.ctx.currentTime;
    this.fireBus.gain.setTargetAtTime(focus === "fire" ? 1.25 : focus === "sky" ? 0.45 : 0.8, t, 0.6);
    this.natureBus.gain.setTargetAtTime(focus === "sky" ? 1.05 : 0.7, t, 0.6);
  }

  dispose() {
    if (this.timer) window.clearInterval(this.timer);
    document.removeEventListener("visibilitychange", this.onVisibility);
    void this.ctx?.close();
    this.ctx = null;
  }
}

export const ambience = new Ambience();
