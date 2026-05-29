type StreamingAudioOptions = {
  signal?: AbortSignal;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: unknown) => void;
};

// ── Volume boost via Web Audio API GainNode ──
// We keep a single AudioContext + GainNode per audio element so we only
// connect once (calling createMediaElementSource twice on the same element
// throws).  The gain is intentionally high (2.5x) because ElevenLabs MP3s
// tend to be normalised conservatively.
const boostedElements = new WeakSet<HTMLAudioElement>();
const GAIN_MULTIPLIER = 2.5; // 2.5× louder than the raw MP3

function ensureVolumeBoost(audioEl: HTMLAudioElement) {
  // Only wire up the gain node once per element
  if (boostedElements.has(audioEl)) return;
  try {
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    const source = ctx.createMediaElementSource(audioEl);
    const gain = ctx.createGain();
    gain.gain.value = GAIN_MULTIPLIER;
    source.connect(gain);
    gain.connect(ctx.destination);
    boostedElements.add(audioEl);
  } catch {
    // Fallback: no boost, but playback still works at normal volume.
  }
}

function canUseMediaSource() {
  return typeof window !== "undefined" && "MediaSource" in window;
}

async function appendStreamToSourceBuffer(
  body: ReadableStream<Uint8Array>,
  sourceBuffer: SourceBuffer,
  mediaSource: MediaSource,
  signal?: AbortSignal,
) {
  const reader = body.getReader();
  const queue: Uint8Array[] = [];
  let done = false;
  let appending = false;

  const pump = async () => {
    while (true) {
      const { value, done: d } = await reader.read();
      if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
      if (d) {
        done = true;
        break;
      }
      if (value) queue.push(value);
      flush();
      if (queue.length > 32) {
        // Backpressure: wait until source buffer catches up
        await new Promise<void>((r) => setTimeout(r, 10));
      }
    }
    flush();
  };

  const flush = () => {
    if (appending) return;
    if (sourceBuffer.updating) return;
    const next = queue.shift();
    if (!next) {
      if (done && mediaSource.readyState === "open") {
        try {
          mediaSource.endOfStream();
        } catch {
          // ignore
        }
      }
      return;
    }
    appending = true;
    try {
      // Always create a Uint8Array backed by a plain ArrayBuffer (not SharedArrayBuffer)
      // to satisfy SourceBuffer.appendBuffer()'s strict BufferSource type requirement.
      const safe = new Uint8Array(next.byteLength);
      safe.set(next);
      sourceBuffer.appendBuffer(safe);
    } catch (e) {
      // If we appended after an abort/end, ignore.
      throw e;
    }
  };

  sourceBuffer.addEventListener("updateend", () => {
    appending = false;
    flush();
  });

  await pump();
}

export async function playStreamingMp3(
  audioEl: HTMLAudioElement,
  resp: Response,
  opts: StreamingAudioOptions = {},
) {
  const { signal, onStart, onEnd, onError } = opts;

  try {
    if (!resp.ok) {
      const t = await resp.text().catch(() => "");
      throw new Error(t || `TTS failed (${resp.status})`);
    }

    // Best path: play as the stream arrives (low-latency).
    // Always ensure max volume + gain boost
    audioEl.volume = 1.0;
    ensureVolumeBoost(audioEl);

    if (canUseMediaSource() && resp.body) {
      const mediaSource = new MediaSource();
      const url = URL.createObjectURL(mediaSource);

      audioEl.src = url;
      audioEl.preload = "auto";

      await new Promise<void>((resolve, reject) => {
        const onOpen = () => resolve();
        const onErr = () => reject(new Error("MediaSource error"));
        mediaSource.addEventListener("sourceopen", onOpen, { once: true });
        mediaSource.addEventListener("error", onErr, { once: true });
      });

      if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

      const sourceBuffer = mediaSource.addSourceBuffer("audio/mpeg");
      sourceBuffer.mode = "sequence";

      onStart?.();
      const playPromise = audioEl.play();

      // Append stream in background while audio plays.
      await appendStreamToSourceBuffer(resp.body, sourceBuffer, mediaSource, signal);
      await playPromise.catch(() => {});

      await new Promise<void>((resolve) => {
        if (audioEl.ended) return resolve();
        const cleanUpAndResolve = () => {
          audioEl.removeEventListener("ended", cleanUpAndResolve);
          audioEl.removeEventListener("error", cleanUpAndResolve);
          signal?.removeEventListener("abort", cleanUpAndResolve);
          resolve();
        };
        audioEl.addEventListener("ended", cleanUpAndResolve);
        audioEl.addEventListener("error", cleanUpAndResolve);
        signal?.addEventListener("abort", cleanUpAndResolve);
      });

      URL.revokeObjectURL(url);
      onEnd?.();
      return;
    }

    // Fallback: buffer full blob then play.
    const blob = await resp.blob();
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

    const url = URL.createObjectURL(blob);
    audioEl.src = url;
    audioEl.preload = "auto";
    audioEl.volume = 1.0;

    onStart?.();
    await audioEl.play();

    await new Promise<void>((resolve) => {
      const cleanUpAndResolve = () => {
        audioEl.removeEventListener("ended", cleanUpAndResolve);
        audioEl.removeEventListener("error", cleanUpAndResolve);
        signal?.removeEventListener("abort", cleanUpAndResolve);
        resolve();
      };
      audioEl.addEventListener("ended", cleanUpAndResolve);
      audioEl.addEventListener("error", cleanUpAndResolve);
      signal?.addEventListener("abort", cleanUpAndResolve);
    });
    URL.revokeObjectURL(url);
    onEnd?.();
  } catch (e) {
    // Aborts are expected during interruption; treat as clean stop.
    if (e instanceof DOMException && e.name === "AbortError") {
      onEnd?.();
      return;
    }
    onError?.(e);
    throw e;
  }
}

