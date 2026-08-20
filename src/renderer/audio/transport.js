// Transport — timeline playback for one audio track and one visual track.
// Audio clips are AudioBufferSourceNodes scheduled against the AudioContext
// clock (sample-accurate seek/loop/fades; the page CSP forbids file:// media,
// so buffers arrive decoded from the project store). The visual track never
// touches the engine directly: entering a clip fires the onVisualClip
// subscriber (the router), which decides cut versus crossfade.
//
// Clock: position = ctx.currentTime - startedAt while playing, so the
// transport cannot drift against the audio it schedules. The loop seam is
// checked once per update() call (frame-quantized; accepted for v1).

export function createTransport(ctx, destinationNodes) {
  const outs = Array.isArray(destinationNodes) ? destinationNodes : [destinationNodes];
  const master = ctx.createGain();
  for (const node of outs) {
    try {
      master.connect(node);
    } catch {
      /* duplicate connections are harmless */
    }
  }

  const state = {
    playing: false,
    position: 0,
    duration: 0,
    loop: { enabled: false, start: 0, end: 0 },
    activeVisualClip: null, // clip id or null
  };

  let timeline = null; // the project.timeline object, edited live by the UI
  const buffers = new Map(); // mediaId -> AudioBuffer
  let startedAt = 0;
  let live = []; // [{ src, gain, clip }]
  let visualCb = null;
  let pendingVisualCause = null; // fire the clip under the playhead on next update

  function audioTrack() {
    return timeline ? timeline.tracks.find((t) => t.type === 'audio') : null;
  }
  function visualTrack() {
    return timeline ? timeline.tracks.find((t) => t.type === 'visual') : null;
  }

  function refreshDuration() {
    let end = 0;
    if (timeline) {
      for (const t of timeline.tracks) {
        for (const c of t.clips) end = Math.max(end, c.end);
      }
    }
    state.duration = end;
  }

  function stopSources() {
    for (const v of live) {
      try {
        v.src.onended = null;
        v.src.stop();
      } catch {
        /* already ended */
      }
      v.src.disconnect();
      v.gain.disconnect();
    }
    live = [];
  }

  // (Re)schedules every audio clip still ahead of `position`. Clips whose
  // buffer has not arrived yet are skipped; setBuffer reschedules when it
  // lands, so late media joins the mix at the right offset.
  function scheduleFrom(position) {
    stopSources();
    const track = audioTrack();
    if (!track || track.muted) return;
    const now = ctx.currentTime;
    for (const clip of track.clips) {
      if (clip.end <= position) continue;
      const buffer = buffers.get(clip.media);
      if (!buffer) continue;
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      const gain = ctx.createGain();
      src.connect(gain);
      gain.connect(master);

      const startsAhead = clip.start > position;
      const when = startsAhead ? now + (clip.start - position) : now;
      const offset = clip.offset + (startsAhead ? 0 : position - clip.start);
      const remaining = clip.end - (startsAhead ? clip.start : position);
      if (remaining <= 0 || offset >= buffer.duration) {
        gain.disconnect();
        continue;
      }

      const level = clip.gain * (track.gain ?? 1);
      const inEnd = clip.start + clip.fadeIn;
      const outStart = clip.end - clip.fadeOut;
      gain.gain.setValueAtTime(level, when);
      if (clip.fadeIn > 0 && inEnd > Math.max(clip.start, position)) {
        const from = startsAhead ? 0 : level * Math.min(1, (position - clip.start) / clip.fadeIn);
        gain.gain.setValueAtTime(from, when);
        gain.gain.linearRampToValueAtTime(level, when + (inEnd - Math.max(clip.start, position)));
      }
      if (clip.fadeOut > 0 && outStart > Math.max(clip.start, position)) {
        gain.gain.setValueAtTime(level, when + (outStart - Math.max(clip.start, position)));
        gain.gain.linearRampToValueAtTime(0, when + (clip.end - Math.max(clip.start, position)));
      }

      src.start(when, offset, Math.min(remaining, buffer.duration - offset));
      live.push({ src, gain, clip });
    }
  }

  function visualClipAt(position) {
    const track = visualTrack();
    if (!track) return null;
    for (const clip of track.clips) {
      if (position >= clip.start && position < clip.end) return clip;
    }
    return null;
  }

  function fireVisual(clip, cause) {
    state.activeVisualClip = clip ? clip.id : null;
    if (clip && visualCb) visualCb({ clip, cause });
  }

  function seekInternal(seconds, cause) {
    state.position = Math.max(0, Math.min(seconds, state.duration));
    if (state.playing) {
      startedAt = ctx.currentTime - state.position;
      scheduleFrom(state.position);
    }
    pendingVisualCause = null;
    fireVisual(visualClipAt(state.position), cause);
  }

  function pauseInternal() {
    if (!state.playing) return;
    state.position = ctx.currentTime - startedAt;
    state.playing = false;
    stopSources();
  }

  return {
    state,

    setTimeline(tl) {
      timeline = tl;
      refreshDuration();
      state.loop = tl ? tl.loop : { enabled: false, start: 0, end: 0 };
      stopSources();
      state.playing = false;
      state.position = 0;
      state.activeVisualClip = null;
    },

    // Re-sorts clips and recomputes duration after the UI edits the timeline
    // in place; reschedules if audio is rolling.
    refresh() {
      if (!timeline) return;
      for (const t of timeline.tracks) t.clips.sort((a, b) => a.start - b.start);
      refreshDuration();
      if (state.playing) scheduleFrom(state.position);
    },

    setBuffer(mediaId, audioBuffer) {
      if (audioBuffer) buffers.set(mediaId, audioBuffer);
      else buffers.delete(mediaId);
      if (state.playing) scheduleFrom(state.position);
    },
    hasBuffer(mediaId) {
      return buffers.has(mediaId);
    },
    getBuffer(mediaId) {
      return buffers.get(mediaId) || null;
    },

    play() {
      if (state.playing || !timeline) return;
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
      state.playing = true;
      startedAt = ctx.currentTime - state.position;
      scheduleFrom(state.position);
      pendingVisualCause = null;
      fireVisual(visualClipAt(state.position), 'play');
    },

    pause: pauseInternal,

    stop() {
      state.playing = false;
      stopSources();
      state.position = 0;
      state.activeVisualClip = null;
    },

    seek(seconds) {
      seekInternal(seconds, 'seek');
    },

    setLoop(start, end, enabled) {
      state.loop.start = Math.max(0, start);
      state.loop.end = Math.max(state.loop.start, end);
      state.loop.enabled = !!enabled && state.loop.end > state.loop.start;
      if (timeline) timeline.loop = state.loop;
    },

    onVisualClip(cb) {
      visualCb = cb;
    },

    update() {
      if (!state.playing) return;
      state.position = ctx.currentTime - startedAt;
      if (state.loop.enabled && state.position >= state.loop.end) {
        seekInternal(state.loop.start, 'seek');
        return;
      }
      if (state.position >= state.duration && state.duration > 0) {
        pauseInternal();
        state.position = state.duration;
        return;
      }
      const clip = visualClipAt(state.position);
      const id = clip ? clip.id : null;
      if (id !== state.activeVisualClip) fireVisual(clip, pendingVisualCause || 'boundary');
      pendingVisualCause = null;
    },

    collect() {
      if (timeline) refreshDuration();
      return timeline;
    },

    dispose() {
      stopSources();
      master.disconnect();
      buffers.clear();
    },
  };
}
