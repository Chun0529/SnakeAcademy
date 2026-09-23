let context: AudioContext | null = null;
let enabled = true;
export function setSoundEnabled(value: boolean) {
  enabled = value;
  if (!value) void context?.suspend();
  else void context?.resume();
}
export function unlockAudio() {
  if (!enabled) return;
  try {
    const Constructor =
      window.AudioContext || (window as any).webkitAudioContext;
    context ||= new Constructor();
    if (context?.state === "suspended") void context.resume();
  } catch {
    /* Audio unavailable: keep all visuals and controls functional. */
  }
}
export function playSound(kind: "tear" | "flip" | "ssr" | "draw") {
  if (!enabled) return;
  unlockAudio();
  if (!context) return;
  const ctx = context,
    now = ctx.currentTime;
  const tone = (
    start: number,
    end: number,
    duration: number,
    volume: number,
    delay = 0,
    type: OscillatorType = "sine"
  ) => {
    const oscillator = ctx.createOscillator(),
      gain = ctx.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(start, now + delay);
    oscillator.frequency.exponentialRampToValueAtTime(
      end,
      now + delay + duration
    );
    gain.gain.setValueAtTime(0.001, now + delay);
    gain.gain.exponentialRampToValueAtTime(volume, now + delay + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, now + delay + duration);
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start(now + delay);
    oscillator.stop(now + delay + duration + 0.02);
    oscillator.onended = () => {
      oscillator.disconnect();
      gain.disconnect();
    };
  };
  const paper = (duration: number, frequency: number, volume: number) => {
    const buffer = ctx.createBuffer(
      1,
      Math.ceil(ctx.sampleRate * duration),
      ctx.sampleRate
    );
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      const position = i / ctx.sampleRate;
      data[i] =
        (Math.random() * 2 - 1) *
        (0.45 + 0.55 * Math.abs(Math.sin(position * 180)));
    }
    const source = ctx.createBufferSource(),
      filter = ctx.createBiquadFilter(),
      gain = ctx.createGain();
    source.buffer = buffer;
    filter.type = "bandpass";
    filter.frequency.value = frequency;
    filter.Q.value = 0.8;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    source.start(now);
    source.onended = () => {
      source.disconnect();
      filter.disconnect();
      gain.disconnect();
    };
  };
  if (kind === "tear") {
    paper(0.62, 2700, 0.32);
    tone(160, 55, 0.3, 0.055);
  }
  if (kind === "flip") {
    paper(0.14, 1800, 0.13);
    tone(660, 960, 0.13, 0.025);
  }
  if (kind === "draw") {
    tone(220, 440, 0.45, 0.07);
    tone(660, 880, 0.35, 0.035, 0.1);
  }
  if (kind === "ssr") {
    tone(90, 38, 1.5, 0.15);
    [220, 330, 440, 660].forEach((frequency, i) =>
      tone(frequency, frequency * 1.006, 1.65, 0.035, i * 0.07, "triangle")
    );
    tone(360, 1800, 1.2, 0.025);
    paper(0.5, 800, 0.07);
  }
}
