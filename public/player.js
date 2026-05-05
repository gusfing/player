(function() {
  'use strict';

  const CONFIG_ENDPOINT = '/api/embed';
  const TRACK_ENDPOINT = '/api/track';
  const LEADS_ENDPOINT = '/api/leads';

  // SVG Icons
  const ICONS = {
    play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',
    pause: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>',
    mute: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>',
    unmute: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>',
    fsEnter: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>',
    fsExit: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/></svg>',
  };

  const log = {
    debug: (...args) => console.log('[YT Shell]', ...args),
    info: (...args) => console.info('[YT Shell]', ...args),
    warn: (...args) => console.warn('[YT Shell]', ...args),
    error: (...args) => console.error('[YT Shell]', ...args),
  };

  class YouTubeShellPlayer {
    constructor(iframe, siteId) {
      this.iframe = iframe;
      this.siteId = siteId;
      this.videoId = this.extractVideoId();
      this.config = null;
      this.isPlaying = false;
      this.isPaused = false;
      this.isEnded = false;
      this.hasStarted = false;
      this.isMuted = false;
      this.watchedTime = 0;
      this.hasTrackedComplete = false;
      this.wrapper = null;
      this.player = null;
      this.apiStatus = 'pending';
      this.playerInstance = null;
      this.watchInterval = null;
      this.idleTimer = null;
      this.gateOverlay = null;
      this.leadFormShown = false;
      this.leadCaptured = false;

      log.debug('Player created for video:', this.videoId, { siteId: this.siteId });
      this.init();
    }

    extractVideoId() {
      const src = this.iframe?.src || '';
      let m = src.match(/embed\/([a-zA-Z0-9_-]+)(?:[?#&]|$)/);
      if (m && m[1]) return m[1];
      m = src.match(/[?&]v=([^&#]+)/);
      if (m && m[1]) return m[1];
      return null;
    }

    async init() {
      if (!this.videoId) {
        log.warn('No video ID found, skipping');
        return;
      }

      try {
        const domainParam = `?domain=${encodeURIComponent(window.location.host)}`;
        const response = await fetch(`${CONFIG_ENDPOINT}/${this.siteId}${domainParam}`);

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        this.config = await response.json();
        this.apiStatus = 'success';

        if (this.config.error) {
          log.error('API error:', this.config.error);
          return;
        }

        this.applyConfig();
      } catch (e) {
        this.apiStatus = 'error';
        log.error('Failed to load config:', e.message);
      }
    }

    isKnownUser() {
      const key = `yt_shell_lead_${this.siteId}`;
      const data = localStorage.getItem(key);
      if (!data) return false;
      try {
        const parsed = JSON.parse(data);
        if (!parsed.lastSubmittedAt) return false;
        const reTriggerDays = this.config?.ctaConfig?.rules?.reTriggerAfterDays || 7;
        const lastSubmit = new Date(parsed.lastSubmittedAt);
        const daysSince = (Date.now() - lastSubmit.getTime()) / (1000 * 60 * 60 * 24);
        return daysSince < reTriggerDays;
      } catch {
        return false;
      }
    }

    markUserAsKnown(email) {
      const key = `yt_shell_lead_${this.siteId}`;
      localStorage.setItem(key, JSON.stringify({
        email,
        lastSubmittedAt: new Date().toISOString()
      }));
    }

    applyConfig() {
      if (!document.body.contains(this.iframe)) return;

      const rect = this.iframe.getBoundingClientRect();
      const width = rect.width || 640;
      const height = rect.height || 360;

      const branding = this.config?.brandingConfig || {};
      const ctaConfig = this.config?.ctaConfig || {};
      const playerConfig = this.config?.playerConfig || {};

      // Colors
      const playButtonColor = branding.playButtonColor || branding.primaryColor || '#ef4444';
      const progressBarColor = branding.progressBarColor || branding.primaryColor || '#ef4444';
      const brandName = branding.topBarText || this.config?.domain || 'Video';

      // Create wrapper (STRICTLY SQUARE - no border radius)
      this.wrapper = document.createElement('div');
      this.wrapper.className = 'cysp-shell';
      this.wrapper.tabIndex = 0;
      this.wrapper.style.cssText = `
        position: relative;
        width: ${width}px;
        height: ${height}px;
        max-width: 100%;
        background: #050505;
        border-radius: 0 !important;
        overflow: hidden;
        isolation: isolate;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      `;

      // Stage
      const stage = document.createElement('div');
      stage.className = 'cysp-stage';
      stage.style.cssText = 'position: absolute; inset: 0; background: #000;';

      // Player slot (oversized iframe trick)
      const slot = document.createElement('div');
      slot.className = 'cysp-player-slot';
      slot.style.cssText = 'position: absolute; top: -50%; left: 0; width: 100%; height: 200%; z-index: 1;';

      const playerTarget = document.createElement('div');
      playerTarget.id = 'cysp-player-' + Math.random().toString(36).slice(2, 10);
      slot.appendChild(playerTarget);

      // Click layer
      const clickLayer = document.createElement('div');
      clickLayer.className = 'cysp-click-layer';
      clickLayer.style.cssText = 'position: absolute; inset: 0; z-index: 2; cursor: pointer;';

      // Poster with thumbnail and play button
      const poster = document.createElement('div');
      poster.className = 'cysp-poster';
      poster.style.cssText = `
        position: absolute; inset: 0; z-index: 4; background-color: #000;
        background-image: url(https://i.ytimg.com/vi/${this.videoId}/maxresdefault.jpg);
        background-size: cover; background-position: center; cursor: pointer;
        transition: opacity 0.4s ease;
      `;

      // Central play button (oversized)
      const centerPlay = document.createElement('div');
      centerPlay.className = 'cysp-center-play';
      centerPlay.style.cssText = `
        position: absolute; top: 50%; left: 50%; width: 76px; height: 52px;
        transform: translate(-50%, -50%); border-radius: 14px;
        background: rgba(30, 30, 30, 0.8); border: 1px solid rgba(255, 255, 255, 0.1);
        z-index: 2; transition: transform 0.2s ease, background 0.2s ease;
        cursor: pointer; display: flex; align-items: center; justify-content: center;
      `;
      centerPlay.innerHTML = `<div style="width: 0; height: 0; border-style: solid; border-width: 12px 0 12px 20px; border-color: transparent transparent transparent white; margin-left: 4px;"></div>`;

      poster.appendChild(centerPlay);

      // Pause overlay
      const pauseOverlay = document.createElement('div');
      pauseOverlay.className = 'cysp-pause-overlay';
      pauseOverlay.style.cssText = 'position: absolute; inset: 0; z-index: 3; opacity: 0; pointer-events: none; transition: opacity 0.3s ease;';
      const pausePlay = centerPlay.cloneNode(true);
      pauseOverlay.appendChild(pausePlay);

      // Top bar with brand badge
      const topBar = document.createElement('div');
      topBar.className = 'cysp-top-bar';
      topBar.style.cssText = 'position: absolute; top: 0; left: 0; right: 0; z-index: 5; padding: 20px 22px; pointer-events: none;';

      const badge = document.createElement('span');
      badge.className = 'cysp-badge';
      badge.style.cssText = `
        display: inline-flex; align-items: center; gap: 8px; padding: 8px 14px;
        border-radius: 999px; background: rgba(20, 20, 20, 0.8);
        border: 1px solid rgba(255, 255, 255, 0.08); color: #fff;
        font: 600 11px/1.1 -apple-system, BlinkMacSystemFont, sans-serif;
        letter-spacing: 0.08em; text-transform: uppercase;
      `;
      badge.innerHTML = `<span style="width: 8px; height: 8px; border-radius: 50%; background: ${playButtonColor};"></span>${brandName}`;
      topBar.appendChild(badge);

      // Custom controls
      const controls = document.createElement('div');
      controls.className = 'cysp-controls';
      controls.style.cssText = `
        position: absolute; left: 0; right: 0; bottom: 0; z-index: 6;
        padding: 0 16px 12px 16px;
        background: linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%);
        transition: opacity 0.3s ease, transform 0.3s ease;
      `;

      const progress = document.createElement('div');
      progress.className = 'cysp-progress';
      progress.style.cssText = 'width: 100%; height: 5px; background: rgba(255, 255, 255, 0.2); border-radius: 999px; overflow: hidden; cursor: pointer; margin-bottom: 12px;';

      const progressFill = document.createElement('div');
      progressFill.className = 'cysp-progress-fill';
      progressFill.style.cssText = `width: 0%; height: 100%; background: ${progressBarColor}; border-radius: inherit; transition: width 0.25s linear;`;
      progress.appendChild(progressFill);

      const controlsRow = document.createElement('div');
      controlsRow.className = 'cysp-row';
      controlsRow.style.cssText = 'display: flex; align-items: center; gap: 16px;';

      const playBtn = document.createElement('button');
      playBtn.className = 'cysp-btn cysp-play-btn';
      playBtn.type = 'button';
      playBtn.setAttribute('aria-label', 'Play');
      playBtn.style.cssText = 'appearance: none; border: none; cursor: pointer; color: #fff; background: transparent; padding: 4px; display: flex; align-items: center; justify-content: center; opacity: 0.85; transition: opacity 0.2s ease;';
      playBtn.innerHTML = `<span style="width: 24px; height: 24px;">${ICONS.play}</span>`;

      const timeDisplay = document.createElement('span');
      timeDisplay.className = 'cysp-time';
      timeDisplay.style.cssText = 'color: rgba(255, 255, 255, 0.9); font: 400 13px/1 sans-serif; font-variant-numeric: tabular-nums;';
      timeDisplay.textContent = '0:00 / 0:00';

      const spacer = document.createElement('div');
      spacer.className = 'cysp-spacer';
      spacer.style.cssText = 'flex-grow: 1;';

      const muteBtn = document.createElement('button');
      muteBtn.className = 'cysp-btn cysp-mute-btn';
      muteBtn.type = 'button';
      muteBtn.setAttribute('aria-label', 'Mute');
      muteBtn.style.cssText = playBtn.style.cssText;
      muteBtn.innerHTML = `<span style="width: 24px; height: 24px;">${ICONS.mute}</span>`;

      const fsBtn = document.createElement('button');
      fsBtn.className = 'cysp-btn cysp-fullscreen-btn';
      fsBtn.type = 'button';
      fsBtn.setAttribute('aria-label', 'Fullscreen');
      fsBtn.style.cssText = playBtn.style.cssText;
      fsBtn.innerHTML = `<span style="width: 24px; height: 24px;">${ICONS.fsEnter}</span>`;

      controlsRow.appendChild(playBtn);
      controlsRow.appendChild(timeDisplay);
      controlsRow.appendChild(spacer);
      controlsRow.appendChild(muteBtn);
      controlsRow.appendChild(fsBtn);
      controls.appendChild(progress);
      controls.appendChild(controlsRow);

      // Assemble wrapper
      this.wrapper.appendChild(stage);
      this.wrapper.appendChild(slot);
      this.wrapper.appendChild(clickLayer);
      this.wrapper.appendChild(poster);
      this.wrapper.appendChild(pauseOverlay);
      this.wrapper.appendChild(topBar);
      this.wrapper.appendChild(controls);

      // Hover effects for center play button
      centerPlay.onmouseenter = () => {
        centerPlay.style.transform = 'translate(-50%, -50%) scale(1.05)';
        centerPlay.style.background = playButtonColor;
      };
      centerPlay.onmouseleave = () => {
        centerPlay.style.transform = 'translate(-50%, -50%) scale(1)';
        centerPlay.style.background = 'rgba(30, 30, 30, 0.8)';
      };

      // Event handlers
      const togglePlay = () => {
        if (this.isPlaying && !this.isPaused) {
          this.playerInstance?.pauseVideo();
        } else {
          this.checkAndStartPlayback();
        }
      };

      const toggleMute = () => {
        this.isMuted = !this.isMuted;
        if (this.isMuted) {
          this.playerInstance?.mute();
        } else {
          this.playerInstance?.unMute();
        }
        muteBtn.innerHTML = `<span style="width: 24px; height: 24px;">${this.isMuted ? ICONS.unmute : ICONS.mute}</span>`;
      };

      const toggleFs = () => {
        if (document.fullscreenElement === this.wrapper) {
          document.exitFullscreen?.();
        } else {
          this.wrapper.requestFullscreen?.();
        }
      };

      const seekTo = (e) => {
        if (!this.playerInstance) return;
        const rect = progress.getBoundingClientRect();
        const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const duration = this.playerInstance.getDuration() || 0;
        this.playerInstance.seekTo(duration * ratio, true);
      };

      const seekRelative = (seconds) => {
        if (!this.playerInstance) return;
        const current = this.playerInstance.getCurrentTime() || 0;
        const duration = this.playerInstance.getDuration() || 0;
        let newTime = Math.max(0, Math.min(duration, current + seconds));
        this.playerInstance.seekTo(newTime, true);
      };

      // Click handlers
      poster.onclick = togglePlay;
      pauseOverlay.onclick = togglePlay;
      clickLayer.onclick = togglePlay;
      playBtn.onclick = (e) => { e.stopPropagation(); togglePlay(); };
      muteBtn.onclick = (e) => { e.stopPropagation(); toggleMute(); };
      fsBtn.onclick = (e) => { e.stopPropagation(); toggleFs(); };
      progress.onclick = (e) => { e.stopPropagation(); seekTo(e); };

      // Keyboard shortcuts
      this.wrapper.addEventListener('keydown', (e) => {
        if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
        switch(e.key) {
          case ' ':
          case 'k':
          case 'K':
            e.preventDefault();
            togglePlay();
            break;
          case 'm':
          case 'M':
            e.preventDefault();
            toggleMute();
            break;
          case 'f':
          case 'F':
            e.preventDefault();
            toggleFs();
            break;
          case 'ArrowRight':
            e.preventDefault();
            seekRelative(5);
            break;
          case 'ArrowLeft':
            e.preventDefault();
            seekRelative(-5);
            break;
        }
      });

      // Fullscreen change handler
      document.addEventListener('fullscreenchange', () => {
        const isFs = document.fullscreenElement === this.wrapper;
        fsBtn.innerHTML = `<span style="width: 24px; height: 24px;">${isFs ? ICONS.fsExit : ICONS.fsEnter}</span>`;
      });

      // Hide controls when playing and idle
      const resetIdle = () => {
        clearTimeout(this.idleTimer);
        this.wrapper.classList.remove('is-idle');
        if (this.isPlaying && !this.isPaused) {
          this.idleTimer = setTimeout(() => {
            this.wrapper.classList.add('is-idle');
          }, 3000);
        }
      };

      this.wrapper.addEventListener('mousemove', resetIdle);
      this.wrapper.addEventListener('touchstart', () => resetIdle(), { passive: true });

      // Store references
      this.elements = {
        wrapper: this.wrapper,
        poster,
        pauseOverlay,
        clickLayer,
        controls,
        progressFill,
        timeDisplay,
        playBtn,
        muteBtn,
        fsBtn,
        centerPlay,
        progress,
      };

      // Click on wrapper for focus
      this.wrapper.addEventListener('click', () => {
        resetIdle();
        if (document.activeElement !== this.wrapper) {
          this.wrapper.focus();
        }
      });

      // Replace iframe
      this.iframe.parentNode.replaceChild(this.wrapper, this.iframe);

      // Load YouTube IFrame API and mount player
      this.loadYouTubeAPI(playerTarget, playButtonColor, progressBarColor, ctaConfig, centerPlay, pausePlay);
    }

    loadYouTubeAPI(playerTarget, playButtonColor, progressBarColor, ctaConfig, centerPlay, pausePlay) {
      if (window.YT && window.YT.Player) {
        this.mountPlayer(playerTarget, playButtonColor, progressBarColor, ctaConfig, centerPlay, pausePlay);
        return;
      }

      if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        const script = document.createElement('script');
        script.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(script);
      }

      window.onYouTubeIframeAPIReady = () => {
        this.mountPlayer(playerTarget, playButtonColor, progressBarColor, ctaConfig, centerPlay, pausePlay);
      };
    }

    mountPlayer(playerTarget, playButtonColor, progressBarColor, ctaConfig, centerPlay, pausePlay) {
      this.playerInstance = new YT.Player(playerTarget.id, {
        host: 'https://www.youtube-nocookie.com',
        videoId: this.videoId,
        playerVars: {
          controls: 0,
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          enablejsapi: 1,
          iv_load_policy: 3,
          cc_load_policy: 0,
          fs: 0
        },
        events: {
          onReady: (e) => {
            this.isMuted = e.target.isMuted?.() || false;
          },
          onStateChange: (e) => {
            this.isPlaying = e.data === YT.PlayerState.PLAYING;
            this.isPaused = e.data === YT.PlayerState.PAUSED;
            this.isEnded = e.data === YT.PlayerState.ENDED;

            if ([YT.PlayerState.PLAYING, YT.PlayerState.PAUSED, YT.PlayerState.BUFFERING].includes(e.data)) {
              this.hasStarted = true;
              this.elements.poster.classList.add('has-started');
            }

            this.elements.wrapper.classList.toggle('is-playing', this.isPlaying);
            this.elements.wrapper.classList.toggle('is-paused', this.isPaused);
            this.elements.wrapper.classList.toggle('is-ended', this.isEnded);
            this.elements.wrapper.classList.toggle('has-started', this.hasStarted);

            // Pause overlay visibility
            this.elements.pauseOverlay.style.pointerEvents = (this.isPaused || this.isEnded) ? 'auto' : 'none';
            this.elements.pauseOverlay.style.opacity = (this.isPaused || this.isEnded) ? '1' : '0';

            // Update play button icon
            this.elements.playBtn.innerHTML = `<span style="width: 24px; height: 24px;">${this.isPlaying ? ICONS.pause : ICONS.play}</span>`;

            // Start/stop watch timer
            if (this.isPlaying) {
              this.startWatchTimer();
            } else {
              clearInterval(this.watchInterval);
              this.elements.wrapper.classList.remove('is-idle');
              clearTimeout(this.idleTimer);
            }

            // Track events
            if (this.isPlaying) {
              this.track('video_played');
            }
            if (this.isEnded) {
              this.track('video_completed');
            }
          }
        }
      });

      // Update UI periodically
      this.watchInterval = setInterval(() => {
        if (this.playerInstance && typeof this.playerInstance.getCurrentTime === 'function') {
          const current = this.playerInstance.getCurrentTime() || 0;
          const duration = this.playerInstance.getDuration() || 0;

          // Update progress bar
          const progress = duration ? (current / duration) * 100 : 0;
          this.elements.progressFill.style.width = `${progress}%`;

          // Update time display
          this.elements.timeDisplay.textContent = `${this.formatTime(current)} / ${this.formatTime(duration)}`;

          // Track progress milestones
          this.trackProgressMilestones(current, duration);
        }
      }, 250);
    }

    formatTime(seconds) {
      if (!seconds || isNaN(seconds)) return '0:00';
      const total = Math.floor(seconds);
      return Math.floor(total / 60) + ':' + String(total % 60).padStart(2, '0');
    }

    trackProgressMilestones(current, duration) {
      const pct = duration ? (current / duration) * 100 : 0;

      if (pct >= 25 && !this.pct25) {
        this.pct25 = true;
        this.track('video_progress', { progress: 25 });
      }
      if (pct >= 50 && !this.pct50) {
        this.pct50 = true;
        this.track('video_progress', { progress: 50 });
      }
      if (pct >= 75 && !this.pct75) {
        this.pct75 = true;
        this.track('video_progress', { progress: 75 });
      }
    }

    checkAndStartPlayback() {
      const ctaConfig = this.config?.ctaConfig || {};
      const captureMode = ctaConfig.captureMode || 'smart_pause';

      if (this.isKnownUser()) {
        this.startPlayback();
      } else if (captureMode === 'instant_unlock') {
        this.showGateOverlay();
      } else {
        this.startPlayback();
      }
    }

    startPlayback() {
      if (this.playerInstance) {
        this.playerInstance.playVideo();
      }
    }

    showGateOverlay() {
      const ctaConfig = this.config?.ctaConfig || {};
      const form = ctaConfig.form || {};
      const buttonColor = ctaConfig.buttonColor || this.config?.brandingConfig?.primaryColor || '#ef4444';

      this.gateOverlay = document.createElement('div');
      this.gateOverlay.style.cssText = `
        position: absolute; top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.95); display: flex; flex-direction: column;
        align-items: center; justify-content: center; z-index: 100; padding: 32px;
      `;

      this.gateOverlay.innerHTML = `
        <div style="text-align: center; max-width: 400px; width: 100%;">
          <div style="font-size: 48px; margin-bottom: 16px;">🔒</div>
          <h3 style="color: white; margin: 0 0 8px 0; font-size: 24px;">${form.headline || 'Unlock this content'}</h3>
          <p style="color: rgba(255,255,255,0.7); margin: 0 0 24px 0; font-size: 14px;">${form.description || 'Enter your email to continue watching'}</p>
          <form id="yt-shell-gate-form">
            <input type="email" name="email" placeholder="Email address" required
              style="width: 100%; padding: 14px 16px; border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; font-size: 14px; background: rgba(255,255,255,0.1); color: white; margin-bottom: 12px; box-sizing: border-box;">
            <button type="submit" style="width: 100%; padding: 14px; background: ${buttonColor}; color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer;">
              ${form.buttonText || 'Continue'}
            </button>
            ${ctaConfig.mode === 'soft' ? '<button type="button" onclick="this.closest(\\'div\\').closest(\\'div\\').remove()" style="margin-top: 12px; background: none; border: none; color: rgba(255,255,255,0.5); cursor: pointer; font-size: 13px;">Skip for now</button>' : ''}
          </form>
        </div>
      `;

      this.wrapper.appendChild(this.gateOverlay);

      this.gateOverlay.querySelector('#yt-shell-gate-form').onsubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const email = formData.get('email');

        try {
          await fetch(LEADS_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              installationId: this.siteId,
              videoId: this.videoId,
              email,
              url: window.location.href,
            }),
          });

          this.markUserAsKnown(email);
          this.gateOverlay.remove();
          this.startPlayback();
        } catch (err) {
          alert('Something went wrong. Please try again.');
        }
      };
    }

    track(event, data = {}) {
      const payload = {
        installationId: this.siteId,
        videoId: this.videoId,
        event,
        url: window.location.href,
        ...data,
      };

      if (navigator.sendBeacon) {
        navigator.sendBeacon(TRACK_ENDPOINT, JSON.stringify(payload));
      } else {
        fetch(TRACK_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          keepalive: true,
        });
      }

      // Send to GA4 if available
      const ga4Id = this.config?.resolvedGA4Id;
      if (ga4Id && typeof gtag === 'function') {
        gtag('event', event, data);
      }

      // Send to Meta Pixel if available
      const pixelId = this.config?.resolvedPixelId;
      if (pixelId && typeof fbq === 'function') {
        const eventMap = {
          'video_played': 'ViewContent',
          'video_completed': 'CompleteRegistration',
        };
        const mappedEvent = eventMap[event] || event;
        fbq('trackCustom', event, data);
      }
    }

    destroy() {
      clearInterval(this.watchInterval);
      clearTimeout(this.idleTimer);
      if (this.isPlaying) {
        this.track('video_session_ended', { watch_time: this.watchedTime });
      }
    }
  }

  class YouTubeShell {
    constructor() {
      this.players = [];
      this.siteId = null;
      this.initialized = false;
      this.init();
    }

    async init() {
      log.info('YouTube Shell initializing...');

      let script = document.currentScript;
      if (!script) {
        const scripts = document.querySelectorAll('script[src*="player"]');
        if (scripts.length > 0) script = scripts[0];
      }

      this.siteId = script?.getAttribute('data-site-id') || window.YT_SHELL_SITE_ID;

      if (!this.siteId) {
        log.error('Missing data-site-id attribute');
        return;
      }

      log.info('Initialized', { siteId: this.siteId });

      // Setup YouTube IFrame API if not already loaded
      if (!window.YT) {
        window.onYouTubeIframeAPIReady = () => this.findAndProcess();
        if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
          const script = document.createElement('script');
          script.src = 'https://www.youtube.com/iframe_api';
          document.head.appendChild(script);
        }
      } else {
        this.findAndProcess();
      }

      // Handle dynamic content
      this.setupMutationObserver();

      window.addEventListener('beforeunload', () => {
        this.players.forEach(p => p.destroy());
      });
    }

    findAndProcess() {
      log.debug('Searching for YouTube iframes...');
      const iframes = document.querySelectorAll('iframe[src*="youtube.com"], iframe[src*="youtu.be"]');
      log.debug('Found', iframes.length, 'iframes');

      iframes.forEach(iframe => {
        if (iframe.classList.contains('yt-shell-processed')) return;

        const parent = iframe.parentElement;
        if (parent?.classList.contains('cysp-shell')) return;

        if (iframe.src.includes('youtube.com/embed/') && !iframe.src.includes('autoplay=')) {
          log.info('Processing iframe:', iframe.src);
          iframe.classList.add('yt-shell-processed');
          const player = new YouTubeShellPlayer(iframe, this.siteId);
          this.players.push(player);
        }
      });
    }

    setupMutationObserver() {
      const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          for (const node of mutation.addedNodes) {
            if (node.nodeType !== Node.ELEMENT_NODE) continue;
            if (node.tagName === 'IFRAME') this.processIframe(node);
            const iframes = node.querySelectorAll?.('iframe[src*="youtube.com"], iframe[src*="youtu.be"]');
            iframes?.forEach(iframe => this.processIframe(iframe));
          }
        }
      });

      observer.observe(document.body, { childList: true, subtree: true });
    }

    processIframe(iframe) {
      if (iframe.classList.contains('yt-shell-processed')) return;
      if (iframe.parentElement?.classList.contains('cysp-shell')) return;

      setTimeout(() => {
        if (iframe.src.includes('youtube.com/embed/') && !iframe.src.includes('autoplay=')) {
          iframe.classList.add('yt-shell-processed');
          const player = new YouTubeShellPlayer(iframe, this.siteId);
          this.players.push(player);
        }
      }, 100);
    }
  }

  // Initialize
  window.ytShellInstance = null;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.ytShellInstance = new YouTubeShell();
    });
  } else {
    window.ytShellInstance = new YouTubeShell();
  }
})();