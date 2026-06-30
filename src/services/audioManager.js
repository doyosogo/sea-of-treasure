const TRACK_REGISTRY = {
  music: new Map(),
  sfx: new Map(),
  ambient: new Map()
};

function clampVolume(value) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(numericValue)));
}

function toVolumeScalar(value) {
  return clampVolume(value) / 100;
}

function resolveTrack(kind, trackOrId) {
  if (!trackOrId) {
    return null;
  }

  if (typeof trackOrId === "object") {
    return {
      id: trackOrId.id ?? null,
      src: trackOrId.src ?? trackOrId.url ?? null,
      loop: Boolean(trackOrId.loop ?? (kind !== "sfx")),
      volume: trackOrId.volume ?? null
    };
  }

  const registry = TRACK_REGISTRY[kind];
  return registry?.get(trackOrId) ?? { id: trackOrId, src: null, loop: kind !== "sfx", volume: null };
}

function createAudioElement() {
  if (typeof window === "undefined" || typeof Audio === "undefined") {
    return null;
  }

  try {
    const audio = new Audio();
    audio.preload = "auto";
    return audio;
  } catch {
    return null;
  }
}

function fadeAudio(audio, targetVolume, durationMs = 250, onComplete) {
  if (!audio) {
    onComplete?.();
    return;
  }

  const startVolume = Number.isFinite(audio.volume) ? audio.volume : 0;
  const endVolume = Math.max(0, Math.min(1, targetVolume));

  if (durationMs <= 0 || Math.abs(startVolume - endVolume) < 0.01) {
    audio.volume = endVolume;
    onComplete?.();
    return;
  }

  const startTime = typeof performance !== "undefined" ? performance.now() : Date.now();
  const step = (now) => {
    const ratio = Math.min(1, (now - startTime) / durationMs);
    audio.volume = startVolume + ((endVolume - startVolume) * ratio);

    if (ratio < 1) {
      window.requestAnimationFrame(step);
      return;
    }

    onComplete?.();
  };

  window.requestAnimationFrame(step);
}

class AudioManager {
  constructor() {
    this.masterMuted = false;
    this.musicMuted = false;
    this.sfxMuted = false;
    this.musicVolume = 0.7;
    this.sfxVolume = 0.7;
    this.currentMusicKey = null;
    this.currentAmbientKey = null;
    this.musicAudio = createAudioElement();
    this.ambientAudio = createAudioElement();
  }

  registerTrack(kind, id, src, options = {}) {
    if (!TRACK_REGISTRY[kind] || !id || !src) {
      return false;
    }

    TRACK_REGISTRY[kind].set(id, {
      id,
      src,
      loop: Boolean(options.loop ?? kind !== "sfx"),
      volume: options.volume ?? null
    });

    return true;
  }

  setMusicVolume(volume) {
    this.musicVolume = toVolumeScalar(volume);
    this.#applyElementVolume(this.musicAudio, this.musicVolume, this.musicMuted);
    this.#applyElementVolume(this.ambientAudio, this.musicVolume, this.musicMuted);
  }

  setSfxVolume(volume) {
    this.sfxVolume = toVolumeScalar(volume);
  }

  setMusicMuted(muted) {
    this.musicMuted = Boolean(muted);
    this.#applyElementVolume(this.musicAudio, this.musicVolume, this.musicMuted);
    this.#applyElementVolume(this.ambientAudio, this.musicVolume, this.musicMuted);
  }

  setSfxMuted(muted) {
    this.sfxMuted = Boolean(muted);
  }

  setMasterMute(muted) {
    this.masterMuted = Boolean(muted);

    if (this.masterMuted) {
      this.#pauseElement(this.musicAudio);
      this.#pauseElement(this.ambientAudio);
    }
  }

  muteAll() {
    this.setMasterMute(true);
  }

  playMusic(trackOrId = null, options = {}) {
    const track = resolveTrack("music", trackOrId);

    if (!track || this.masterMuted || this.musicMuted || !this.musicAudio || !track.src) {
      return false;
    }

    const fadeMs = Math.max(0, Number(options.fadeMs ?? options.fade ?? 250));
    const nextVolume = Math.max(0, Math.min(1, (track.volume ?? this.musicVolume)));

    if (this.currentMusicKey === track.id && this.musicAudio.src === track.src) {
      this.#applyElementVolume(this.musicAudio, nextVolume, false);
      return true;
    }

    const nextAudio = this.musicAudio;
    const previousAudio = this.musicAudio;
    const startPlayback = () => {
      try {
        nextAudio.loop = Boolean(track.loop);
        nextAudio.src = track.src;
        nextAudio.volume = fadeMs > 0 ? 0 : nextVolume;
        const playPromise = nextAudio.play?.();

        if (playPromise?.catch) {
          playPromise.catch(() => {});
        }

        if (fadeMs > 0) {
          fadeAudio(nextAudio, nextVolume, fadeMs);
        }

        this.currentMusicKey = track.id;
      } catch {
        // Fail silently.
      }
    };

    if (previousAudio && previousAudio.src && previousAudio !== nextAudio && fadeMs > 0) {
      fadeAudio(previousAudio, 0, fadeMs, () => {
        this.#pauseElement(previousAudio);
        startPlayback();
      });
      return true;
    }

    startPlayback();
    return true;
  }

  stopMusic(options = {}) {
    const fadeMs = Math.max(0, Number(options.fadeMs ?? options.fade ?? 250));
    this.currentMusicKey = null;

    if (!this.musicAudio) {
      return;
    }

    if (fadeMs > 0) {
      fadeAudio(this.musicAudio, 0, fadeMs, () => this.#pauseElement(this.musicAudio));
      return;
    }

    this.#pauseElement(this.musicAudio);
  }

  playAmbient(trackOrId = null, options = {}) {
    const track = resolveTrack("ambient", trackOrId);

    if (!track || this.masterMuted || this.musicMuted || !this.ambientAudio || !track.src) {
      return false;
    }

    const fadeMs = Math.max(0, Number(options.fadeMs ?? options.fade ?? 250));
    const nextVolume = Math.max(0, Math.min(1, (track.volume ?? this.musicVolume)));

    try {
      this.ambientAudio.loop = Boolean(track.loop);
      this.ambientAudio.src = track.src;
      this.ambientAudio.volume = fadeMs > 0 ? 0 : nextVolume;
      const playPromise = this.ambientAudio.play?.();

      if (playPromise?.catch) {
        playPromise.catch(() => {});
      }

      if (fadeMs > 0) {
        fadeAudio(this.ambientAudio, nextVolume, fadeMs);
      }

      this.currentAmbientKey = track.id;
      return true;
    } catch {
      return false;
    }
  }

  stopAmbient(options = {}) {
    const fadeMs = Math.max(0, Number(options.fadeMs ?? options.fade ?? 250));
    this.currentAmbientKey = null;

    if (!this.ambientAudio) {
      return;
    }

    if (fadeMs > 0) {
      fadeAudio(this.ambientAudio, 0, fadeMs, () => this.#pauseElement(this.ambientAudio));
      return;
    }

    this.#pauseElement(this.ambientAudio);
  }

  playSfx(trackOrId = null, options = {}) {
    const track = resolveTrack("sfx", trackOrId);

    if (!track || this.masterMuted || this.sfxMuted || !track.src) {
      return false;
    }

    if (typeof window === "undefined" || typeof Audio === "undefined") {
      return false;
    }

    try {
      const audio = new Audio(track.src);
      audio.volume = Math.max(0, Math.min(1, (track.volume ?? this.sfxVolume)));
      audio.loop = Boolean(options.loop ?? track.loop ?? false);
      const playPromise = audio.play?.();

      if (playPromise?.catch) {
        playPromise.catch(() => {});
      }

      return true;
    } catch {
      return false;
    }
  }

  #applyElementVolume(audio, volume, muted) {
    if (!audio) {
      return;
    }

    audio.volume = muted || this.masterMuted ? 0 : Math.max(0, Math.min(1, volume));
  }

  #pauseElement(audio) {
    if (!audio) {
      return;
    }

    try {
      audio.pause?.();
      audio.currentTime = 0;
    } catch {
      // Fail silently.
    }
  }
}

const audioManager = new AudioManager();

export default audioManager;
