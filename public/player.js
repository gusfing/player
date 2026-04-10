(function() {
  'use strict';

  const CONFIG_ENDPOINT = '/api/embed';
  const TRACK_ENDPOINT = '/api/track';
  const LEADS_ENDPOINT = '/api/leads';
  
  // Verbose logging utility
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
      this.startTime = null;
      this.watchedTime = 0;
      this.hasTrackedComplete = false;
      this.wrapper = null;
      this.player = null;
      this.overlay = null;
      this.ctaButton = null;
      this.leadForm = null;
      this.ctaShown = false;
      this.ctaTriggered = false;
      this.leadCaptured = false;
      this.isPausedForForm = false;
      this.thumbnail = null;
      this.playButton = null;
      this.ctaContainer = null;
      this.modal = null;
      this.gateOverlay = null;
      this.skipProtectionEnabled = false;
      this.skipProtectionBlockAfter = 30;
      this.apiStatus = 'pending'; // pending, success, error
      
      log.debug('Player created for video:', this.videoId, { siteId: this.siteId });
      this.init();
    }

  extractVideoId() {
    const src = this.iframe?.src || '';
    log.debug('Extracting video ID from:', src);
    // 1) Try embed path first: /embed/{videoId}
    let m = src.match(/embed\/([a-zA-Z0-9_-]+)(?:[?#&]|$)/);
    if (m && m[1]) {
      log.debug('Extracted video ID from embed path:', m[1]);
      return m[1];
    }
    // 2) Fallback to v parameter (older formats)
    m = src.match(/[?&]v=([^&#]+)/);
    if (m && m[1]) {
      log.debug('Extracted video ID from v parameter:', m[1]);
      return m[1];
    }
    log.warn('Video ID not found in embed URL', { src });
    return null;
  }

    async init() {
      if (!this.videoId) {
        log.warn('No video ID found, skipping initialization');
        return;
      }
      
      log.info('Initializing player for video:', this.videoId);
      
      try {
        const domainParam = `?domain=${encodeURIComponent(window.location.host)}`;
        log.debug('Fetching config from:', `${CONFIG_ENDPOINT}/${this.siteId}${domainParam}`);
        const response = await fetch(`${CONFIG_ENDPOINT}/${this.siteId}${domainParam}`);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        this.config = await response.json();
        this.apiStatus = 'success';
        log.info('Config loaded successfully', { videoId: this.videoId });
        
        if (this.config.error) {
          log.error('API returned error:', this.config.error, this.config.message);
          // Notify debug panel
          if (window.ytShellInstance?.debugPanel) {
            window.ytShellInstance.debugPanel.addEvent('api_error', {
              error: this.config.error,
              message: this.config.message
            }, 'error', 'error');
          }
          return;
        }
        
        this.applyConfig();
      } catch (e) {
        this.apiStatus = 'error';
        log.error('Failed to load config:', e.message);
        
        // Notify debug panel of API error
        if (window.ytShellInstance?.debugPanel) {
          window.ytShellInstance.debugPanel.addEvent('api_error', {
            error: e.message,
            type: 'network'
          }, 'error', 'error');
        }
      }
    }

    isKnownUser() {
      const key = `yt_shell_lead_${this.siteId}`;
      const data = localStorage.getItem(key);
      if (!data) return false;
      
      try {
        const parsed = JSON.parse(data);
        if (!parsed.lastSubmittedAt) return false;
        
        const skipIfKnown = this.config?.ctaConfig?.rules?.skipIfKnownUser !== false;
        const reTriggerDays = this.config?.ctaConfig?.rules?.reTriggerAfterDays || 7;
        const lastSubmit = new Date(parsed.lastSubmittedAt);
        const daysSince = (Date.now() - lastSubmit.getTime()) / (1000 * 60 * 60 * 24);
        
        // Skip if: user is known AND within re-trigger window
        return skipIfKnown && daysSince < reTriggerDays;
      } catch {
        return false;
      }
    }

    markUserAsKnown(email) {
      const key = `yt_shell_lead_${this.siteId}`;
      localStorage.setItem(key, JSON.stringify({
        email: email,
        lastSubmittedAt: new Date().toISOString()
      }));
    }

    applyConfig() {
      log.info('Applying config for video:', this.videoId);
      
      // Check if iframe exists in DOM
      if (!document.body.contains(this.iframe)) {
        log.error('Iframe no longer exists in DOM');
        return;
      }
      
      const rect = this.iframe.getBoundingClientRect();
      const width = rect.width || 640;
      const height = rect.height || 360;
      
      log.debug('Iframe dimensions:', { width, height });
      
      // Check if iframe is visible
      if (rect.width === 0 || rect.height === 0) {
        log.warn('Iframe has zero dimensions - might be hidden or lazy loaded');
      }
      
      const ctaConfig = this.config?.ctaConfig || {};
      const captureMode = ctaConfig.captureMode || 'smart_pause';
      
      log.debug('CTA Config:', { captureMode, enabled: ctaConfig.enabled });
      
      this.wrapper = document.createElement('div');
      this.wrapper.className = 'yt-shell-wrapper';
      this.wrapper.style.cssText = `
        position: relative;
        width: ${width}px;
        height: ${height}px;
        max-width: 100%;
        background: #000;
        overflow: hidden;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      `;

      this.thumbnail = document.createElement('div');
      this.thumbnail.className = 'yt-shell-thumbnail';
      this.thumbnail.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-image: url(https://i.ytimg.com/vi/${this.videoId}/maxresdefault.jpg);
        background-size: cover;
        background-position: center;
        cursor: pointer;
        transition: transform 0.2s ease;
      `;

      this.playButton = document.createElement('div');
      this.playButton.className = 'yt-shell-play';
      this.playButton.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 68px;
        height: 48px;
        background: ${this.config?.brandingConfig?.primaryColor || '#FF0000'};
        border-radius: 12px;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      `;
      this.playButton.innerHTML = `
        <svg width="20" height="24" viewBox="0 0 20 24" fill="white" style="margin-left: 3px;">
          <path d="M0 0L20 12L0 24V0Z"/>
        </svg>
      `;

      this.playButton.onmouseenter = () => {
        this.playButton.style.transform = 'translate(-50%, -50%) scale(1.1)';
        this.playButton.style.boxShadow = '0 6px 16px rgba(0,0,0,0.4)';
      };
      this.playButton.onmouseleave = () => {
        this.playButton.style.transform = 'translate(-50%, -50%) scale(1)';
        this.playButton.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
      };

      this.ctaContainer = document.createElement('div');
      this.ctaContainer.className = 'yt-shell-cta';
      this.ctaContainer.style.cssText = `
        position: absolute;
        bottom: 16px;
        left: 16px;
        right: 16px;
        display: flex;
        gap: 8px;
        opacity: 0;
        transition: opacity 0.3s ease;
      `;

      if (ctaConfig.enabled) {
        this.createCTAButtons(this.ctaContainer);
      }

      this.thumbnail.appendChild(this.playButton);
      this.wrapper.appendChild(this.thumbnail);
      this.wrapper.appendChild(this.ctaContainer);

      const handlePlay = (e) => {
        e.stopPropagation();
        
        if (this.isKnownUser()) {
          // User has submitted recently, skip gate
          this.startPlayback();
        } else if (captureMode === 'instant_unlock') {
          this.showGateOverlay();
        } else {
          this.startPlayback();
        }
      };

      this.thumbnail.onclick = handlePlay;
      this.playButton.onclick = handlePlay;

      this.iframe.parentNode.replaceChild(this.wrapper, this.iframe);
    }

    showGateOverlay() {
      const ctaConfig = this.config?.ctaConfig || {};
      const form = ctaConfig.form || {};
      const buttonColor = ctaConfig.buttonColor || this.config?.brandingConfig?.primaryColor || '#2563eb';
      
      this.gateOverlay = document.createElement('div');
      this.gateOverlay.className = 'yt-shell-gate';
      this.gateOverlay.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.85) 100%);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        padding: 32px;
        box-sizing: border-box;
      `;

      // Calculate social proof count
      const socialProof = ctaConfig.socialProof || {};
      let socialProofHtml = '';
      if (socialProof.enabled) {
        const baseCount = socialProof.baseCount || 0;
        const incrementPerDay = socialProof.incrementPerDay || 0;
        const installDate = new Date(this.config?.createdAt || Date.now());
        const daysSinceInstall = Math.floor((Date.now() - installDate.getTime()) / (1000 * 60 * 60 * 24));
        const currentCount = baseCount + (daysSinceInstall * incrementPerDay);
        const displayText = (socialProof.text || 'Join {count} others').replace('{count}', currentCount.toLocaleString());
        socialProofHtml = `<p style="color: rgba(255,255,255,0.6); font-size: 13px; margin: 0 0 20px 0;">${displayText}</p>`;
      }

      this.gateOverlay.innerHTML = `
        <div style="text-align: center; max-width: 400px; width: 100%;">
          <div style="font-size: 48px; margin-bottom: 16px;">🔒</div>
          ${socialProofHtml}
          <h3 style="color: white; margin: 0 0 8px 0; font-size: 24px;">${form.headline || 'Get Started'}</h3>
          <p style="color: rgba(255,255,255,0.7); margin: 0 0 24px 0; font-size: 14px;">${form.description || 'Enter your details to continue watching'}</p>
          <form id="yt-shell-gate-form" style="text-align: left;">
            ${(form.fields || ['email']).map(field => `
              <div style="margin-bottom: 12px;">
                <input type="${field === 'email' ? 'email' : field === 'phone' ? 'tel' : 'text'}" 
                       name="${field}" 
                       placeholder="${field.charAt(0).toUpperCase() + field.slice(1)}" 
                       ${field === 'email' ? 'required' : ''}
                       style="width: 100%; padding: 14px 16px; border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; font-size: 14px; background: rgba(255,255,255,0.1); color: white; box-sizing: border-box;">
              </div>
            `).join('')}
            <button type="submit" style="
              width: 100%;
              padding: 14px;
              background: ${buttonColor};
              color: white;
              border: none;
              border-radius: 8px;
              font-size: 16px;
              font-weight: 600;
              cursor: pointer;
              margin-top: 8px;
            ">${form.ctaText || 'Unlock Video'}</button>
          </form>
          <p style="color: rgba(255,255,255,0.4); font-size: 12px; margin-top: 16px;">Your data is secure and will only be used to contact you.</p>
        </div>
      `;

      this.wrapper.appendChild(this.gateOverlay);

      const formEl = this.gateOverlay.querySelector('#yt-shell-gate-form');
      formEl.onsubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        const data = {
          installationId: this.siteId,
          videoId: this.videoId,
          email: formData.get('email'),
          name: formData.get('name') || null,
          phone: formData.get('phone') || null,
          url: window.location.href,
          domain: window.location.host,
        };

        try {
          const response = await fetch(LEADS_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });
          
          const result = await response.json();
          
          this.markUserAsKnown(data.email);
          
          if (this.gateOverlay) {
            this.gateOverlay.style.opacity = '0';
            this.gateOverlay.style.transition = 'opacity 0.3s ease';
            setTimeout(() => {
              if (this.gateOverlay && this.gateOverlay.parentNode) {
                this.gateOverlay.parentNode.removeChild(this.gateOverlay);
              }
            }, 300);
          }
          
          this.startPlayback();
        } catch (err) {
          alert('Something went wrong. Please try again.');
        }
      };
    }

    createCTAButtons(container) {
      const cta = this.config.ctaConfig || {};
      const form = cta.form || {};
      const buttonColor = cta.buttonColor || this.config?.brandingConfig?.primaryColor || '#2563eb';
      
      const ctaBtn = document.createElement('button');
      ctaBtn.className = 'yt-shell-cta-primary';
      ctaBtn.style.cssText = `
        padding: 12px 24px;
        background: ${buttonColor};
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        text-decoration: none;
        display: inline-block;
        transition: opacity 0.2s ease, transform 0.2s ease;
      `;
      ctaBtn.textContent = form.ctaText || 'Get Access';
      ctaBtn.onclick = (e) => {
        e.stopPropagation();
        this.trackCTA('lead_capture');
        if (this.isPlaying) {
          this.pauseForLeadForm();
        } else {
          this.showLeadForm();
        }
      };
      container.appendChild(ctaBtn);
      this.ctaButton = ctaBtn;

      this.thumbnail.onmouseenter = () => {
        container.style.opacity = '1';
      };
      this.thumbnail.onmouseleave = () => {
        container.style.opacity = '0';
      };
    }

    showLeadForm() {
      const modal = document.createElement('div');
      modal.className = 'yt-shell-modal';
      modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 999999;
        backdrop-filter: blur(4px);
      `;

      const form = document.createElement('div');
      form.style.cssText = `
        background: white;
        border-radius: 16px;
        padding: 32px;
        max-width: 400px;
        width: 90%;
        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      `;
      const formConfig = this.config?.ctaConfig?.form || {};
      const buttonColor = this.config?.ctaConfig?.buttonColor || this.config?.brandingConfig?.primaryColor || '#2563eb';
      const fields = formConfig.fields || ['email'];
      
      let fieldsHtml = '';
      if (fields.includes('name')) {
        fieldsHtml += `
          <div style="margin-bottom: 16px;">
            <input type="text" name="name" placeholder="Full name"
              style="width: 100%; padding: 12px 16px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 14px; box-sizing: border-box;">
          </div>
        `;
      }
      if (fields.includes('email')) {
        fieldsHtml += `
          <div style="margin-bottom: 16px;">
            <input type="email" name="email" placeholder="Email address" required
              style="width: 100%; padding: 12px 16px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 14px; box-sizing: border-box;">
          </div>
        `;
      }
      if (fields.includes('phone')) {
        fieldsHtml += `
          <div style="margin-bottom: 16px;">
            <input type="tel" name="phone" placeholder="Phone number"
              style="width: 100%; padding: 12px 16px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 14px; box-sizing: border-box;">
          </div>
        `;
      }

      form.innerHTML = `
        <h3 style="margin: 0 0 8px 0; color: #1a1a1a; font-size: 20px;">${formConfig.headline || 'Get Started'}</h3>
        <p style="margin: 0 0 24px 0; color: #666; font-size: 14px;">${formConfig.description || 'Enter your details to continue'}</p>
        <form id="yt-shell-lead-form">
          ${fieldsHtml}
          <button type="submit" style="
            width: 100%;
            padding: 14px;
            background: ${buttonColor};
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
          ">${formConfig.buttonText || 'Submit'}</button>
        </form>
        <button class="yt-shell-close" style="
          position: absolute;
          top: 12px;
          right: 12px;
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #999;
          padding: 8px;
          line-height: 1;
        ">×</button>
      `;

      modal.appendChild(form);
      document.body.appendChild(modal);
      this.modal = modal;

      modal.onclick = (e) => {
        if (e.target === modal) {
          document.body.removeChild(modal);
          if (this.isPausedForForm) {
            this.resumeFromLeadForm();
          }
        }
      };

      form.querySelector('.yt-shell-close').onclick = () => {
        document.body.removeChild(modal);
        if (this.isPausedForForm) {
          this.resumeFromLeadForm();
        }
      };

      form.querySelector('#yt-shell-lead-form').onsubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = {
          installationId: this.siteId,
          videoId: this.videoId,
          email: formData.get('email'),
          name: formData.get('name') || null,
          phone: formData.get('phone') || null,
          url: window.location.href,
          domain: window.location.host,
        };

        try {
          await fetch(LEADS_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });
          
          this.markUserAsKnown(data.email);
          this.leadCaptured = true;
          
          form.innerHTML = `
            <div style="text-align: center; padding: 20px 0;">
              <div style="font-size: 48px; margin-bottom: 16px;">✓</div>
              <h3 style="margin: 0 0 8px 0; color: #1a1a1a;">${formConfig.thankYouMessage || 'Thanks! Enjoy the video.'}</h3>
            </div>
          `;
          
          setTimeout(() => {
            if (modal.parentNode) {
              document.body.removeChild(modal);
            }
            if (this.isPausedForForm) {
              this.resumeFromLeadForm();
            } else if (this.config?.ctaConfig?.onSubmit?.action === 'redirect' && this.config?.ctaConfig?.onSubmit?.redirectUrl) {
              window.location.href = this.config.ctaConfig.onSubmit.redirectUrl;
            }
          }, 2000);
        } catch (err) {
          alert('Something went wrong. Please try again.');
        }
      };
    }

    pauseForLeadForm() {
      this.isPausedForForm = true;
      if (this.player && this.player.src) {
        const currentSrc = this.player.src;
        this.player.src = currentSrc.replace('autoplay=1', 'autoplay=0');
      }
      this.showLeadForm();
    }

    resumeFromLeadForm() {
      this.isPausedForForm = false;
      if (this.player && this.player.src) {
        const currentSrc = this.player.src;
        this.player.src = currentSrc.replace('autoplay=0', 'autoplay=1');
      }
    }

    startPlayback() {
      if (this.thumbnail) this.thumbnail.style.cursor = 'default';
      if (this.playButton) this.playButton.style.display = 'none';

      this.player = document.createElement('iframe');
      this.player.style.cssText = 'position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;';
      this.player.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      
      // Handle auto-play muted setting
      const autoPlayMuted = this.config?.ctaConfig?.autoPlayMuted || false;
      const muteParam = autoPlayMuted ? '&mute=1' : '';
      this.player.src = `https://www.youtube.com/embed/${this.videoId}?autoplay=1${muteParam}&rel=0`;

      this.wrapper.appendChild(this.player);
      this.wrapper.appendChild(this.ctaContainer);

      this.isPlaying = true;
      this.startTime = Date.now();
      this.track('video_played', {
        content_name: `YouTube Video: ${this.videoId}`,
        content_category: 'Video',
      });

      this.startWatchTimer();
      this.initSkipProtection();
    }

    startWatchTimer() {
      this.watchInterval = setInterval(() => {
        if (this.isPlaying) {
          this.watchedTime += 1;
          
          const totalSeconds = this.watchedTime;
          
          if (totalSeconds === 25 && !this.tracked25) {
            this.tracked25 = true;
            this.track('video_progress', { progress: 25 });
          }
          if (totalSeconds === 50 && !this.tracked50) {
            this.tracked50 = true;
            this.track('video_progress', { progress: 50 });
          }
          if (totalSeconds === 75 && !this.tracked75) {
            this.tracked75 = true;
            this.track('video_progress', { progress: 75 });
          }
          if (totalSeconds >= 100 && !this.hasTrackedComplete) {
            this.hasTrackedComplete = true;
            this.track('video_completed', { watch_time: this.watchedTime });
          }

          this.checkCTATrigger(totalSeconds);
          this.checkSkipProtection(totalSeconds);
        }
      }, 1000);
    }

    initSkipProtection() {
      const cta = this.config?.ctaConfig;
      const skipProtection = cta?.skipProtection;
      
      if (!skipProtection?.enabled) return;
      
      this.skipProtectionBlockAfter = skipProtection.blockAfterSeconds || 30;
      this.skipProtectionEnabled = true;
    }

    checkSkipProtection(currentSeconds) {
      if (!this.skipProtectionEnabled || !this.player) return;
      
      const blockAfter = this.skipProtectionBlockAfter || 30;
      
      // Try to seek back if user is past the block point
      if (currentSeconds > blockAfter) {
        this.seekToBlockPoint();
      }
    }

    seekToBlockPoint() {
      if (!this.player || !this.player.contentWindow) return;
      
      const blockAfter = this.skipProtectionBlockAfter || 30;
      
      // Use postMessage to control the YouTube player
      try {
        this.player.contentWindow.postMessage(
          JSON.stringify({ event: 'command', func: 'seekTo', args: [blockAfter, true] }),
          'https://www.youtube.com'
        );
      } catch (e) {
        // Fallback: reload iframe without autoplay
        const currentSrc = this.player.src;
        if (!currentSrc.includes('autoplay=0')) {
          this.player.src = currentSrc.replace('autoplay=1', 'autoplay=0');
          setTimeout(() => {
            this.player.src = currentSrc.replace('autoplay=0', 'autoplay=1');
          }, 100);
        }
      }
    }

    checkCTATrigger(watchedSeconds) {
      const cta = this.config?.ctaConfig;
      if (!cta?.enabled || this.ctaTriggered) return;

      const trigger = cta?.trigger || {};
      const triggerType = trigger.type || 'time';
      const triggerValue = trigger.value || 30;

      let shouldShow = false;

      if (triggerType === 'time') {
        shouldShow = watchedSeconds >= triggerValue;
      } else if (triggerType === 'percentage') {
        const estimatedDuration = this.config?.estimatedDuration || 300;
        const percentage = (watchedSeconds / estimatedDuration) * 100;
        shouldShow = percentage >= triggerValue;
      }

      if (shouldShow) {
        this.ctaTriggered = true;
        this.track('gate_shown');
        if (this.ctaContainer) {
          this.ctaContainer.style.opacity = '1';
        }
      }
    }

    trackEvent(event, data = {}) {
      const payload = {
        installationId: this.siteId,
        videoId: this.videoId,
        event,
        url: window.location.href,
        referrer: document.referrer,
        domain: window.location.host,
        timestamp: new Date().toISOString(),
        ...data,
      };

      if (navigator.sendBeacon) {
        navigator.sendBeacon(
          TRACK_ENDPOINT,
          JSON.stringify(payload)
        );
      } else {
        fetch(TRACK_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          keepalive: true,
        });
      }
    }

    trackCTA(type) {
      this.track('cta_clicked', { cta_type: type });
    }

    track(event, data = {}) {
      const ga4Status = this.sendToGA4(event, data);
      const pixelStatus = this.sendToPixel(event, data);
      
      // Log to debug panel if enabled
      if (window.ytShellInstance?.debugPanel) {
        window.ytShellInstance.debugPanel.addEvent(event, data, ga4Status, pixelStatus);
      }
      
      if (this.config?.debugEnabled) {
        this.logDebug(event, data, ga4Status, pixelStatus);
      }
    }

    sendToGA4(event, data = {}) {
      const ga4Id = this.config?.resolvedGA4Id;
      
      if (!ga4Id) {
        return 'not_configured';
      }

      try {
        if (typeof gtag === 'function') {
          gtag('event', event, {
            ...data,
            debug: true,
          });
          return 'sent';
        }
        return 'pending';
      } catch (e) {
        console.error('GA4 tracking error:', e);
        return 'failed';
      }
    }

    sendToPixel(event, data = {}) {
      const pixelId = this.config?.resolvedPixelId;
      
      if (!pixelId) {
        return 'not_configured';
      }

      try {
        if (typeof fbq === 'function') {
          // Map internal events to Meta Pixel events
          const pixelEventMap = {
            'lead_submit': 'Lead',
            'video_played': 'ViewContent',
            'video_completed': 'CompleteRegistration',
            'debug_test': 'DebugTest',
          };
          
          const mappedEvent = pixelEventMap[event] || event;
          
          // Use trackCustom for non-standard events
          if (pixelEventMap[event]) {
            fbq('track', mappedEvent, { ...data, debug: true });
          } else {
            fbq('trackCustom', this.toCamelCase(event), { ...data, debug: true });
          }
          return 'sent';
        }
        return 'pending';
      } catch (e) {
        console.error('Meta Pixel tracking error:', e);
        return 'failed';
      }
    }

    toCamelCase(str) {
      return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    }

    logDebug(event, data, ga4Status, pixelStatus) {
      const debugLog = {
        event,
        data,
        ga4Status,
        pixelStatus,
        timestamp: Date.now(),
      };

      // Send to parent window (for dashboard) or store locally
      if (window.parent !== window) {
        window.parent.postMessage({
          type: 'YT_SHELL_DEBUG',
          payload: debugLog,
        }, '*');
      }

      // Also log to console for devs
      console.log('[YT Shell Debug]', debugLog);
    }

    // Legacy function for backwards compatibility
    fireMetaPixel(event, data = {}) {
      this.track(event, data);
    }

    destroy() {
      if (this.watchInterval) {
        clearInterval(this.watchInterval);
      }
      if (this.isPlaying) {
        this.trackEvent('video_session_ended', { watch_time: this.watchedTime });
        this.track('video_session_ended', { watch_time: this.watchedTime });
      }
    }
  }

  class YouTubeShell {
    constructor() {
      this.players = [];
      this.siteId = null;
      this.initialized = false;
      this.debugPanel = null;
      this.mutationObserver = null;
      this.init();
    }

    async init() {
      log.info('YouTube Shell initializing...');
      
      let script = document.currentScript;
      if (!script) {
        log.warn('No currentScript found - searching for player script...');
        // Try to find the script by our identifier (async/deferred scripts don't set currentScript)
        const scripts = document.querySelectorAll('script[src*="player"]');
        if (scripts.length > 0) {
          script = scripts[0];
          log.debug('Found player script:', script.src);
        }
      }

      this.siteId = script?.getAttribute('data-site-id');
      if (!this.siteId) {
        // Plan B: last-resort fallback from global window variable
        if (typeof window !== 'undefined' && window.YT_SHELL_SITE_ID) {
          this.siteId = window.YT_SHELL_SITE_ID;
          log.info('Plan B: using window.YT_SHELL_SITE_ID for siteId', { siteId: this.siteId });
        } else {
          log.error('Missing data-site-id attribute on script tag');
          return;
        }
      }

      log.info('YouTube Shell initialized', { siteId: this.siteId, url: window.location.href });

      // Check if debug mode is enabled
      const debugEnabled = this.isDebugMode();
      
      if (debugEnabled) {
        log.info('Debug mode enabled');
        this.debugPanel = new YTDebugPanel(this.siteId, this);
        this.debugPanel.init();
      }

      // Find and process existing iframes
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          this.findAndReplace();
          this.setupMutationObserver();
        });
      } else {
        this.findAndReplace();
        this.setupMutationObserver();
      }

      window.addEventListener('beforeunload', () => {
        log.debug('Page unloading, destroying players');
        this.players.forEach(p => p.destroy());
      });

      // Setup lazy loading for iframes that appear later
      if ('IntersectionObserver' in window) {
        this.setupLazyLoading();
      }

      // Listen for test events from dashboard
      window.addEventListener('message', (event) => {
        if (event.data?.type === 'YT_SHELL_DEBUG_TEST') {
          log.debug('Received test event request');
          this.fireTestEvent();
        }
      });
      
      // Also listen on document for jQuery-loaded iframes
      this.setupDynamicIframeDetection();
    }

    isDebugMode() {
      const urlParams = new URLSearchParams(window.location.search);
      const hasDebugParam = urlParams.get('debug') === 'true';
      const hasLocalStorage = localStorage.getItem(`yt_debug_${this.siteId}`) === 'true';
      return hasDebugParam || hasLocalStorage;
    }

    fireTestEvent() {
      if (!this.players.length) {
        if (this.debugPanel) {
          this.debugPanel.addEvent('test_event', { 
            error: 'No player on page',
            url: window.location.href 
          }, 'skipped', 'skipped');
        }
        return;
      }

      const player = this.players[0];
      player.track('debug_test', {
        source: 'debug_panel',
        url: window.location.href,
        timestamp: Date.now(),
      });

      if (this.debugPanel) {
        this.debugPanel.showTestSent();
      }
    }

    onTrack(event, data, ga4Status, pixelStatus) {
      if (this.debugPanel) {
        this.debugPanel.addEvent(event, data, ga4Status, pixelStatus);
      }
    }

    findAndReplace() {
      log.debug('Searching for YouTube iframes...');
      const iframes = document.querySelectorAll('iframe[src*="youtube.com"], iframe[src*="youtu.be"]');
      log.debug('Found', iframes.length, 'iframes with YouTube URLs');
      
      let processed = 0;
      iframes.forEach(iframe => {
        // Check if already processed with a valid wrapper
        const parent = iframe.parentElement;
        const alreadyFixed = parent?.classList?.contains('yt-shell-wrapper');
        
        if (alreadyFixed) {
          log.debug('Skipping already fixed iframe (wrapper exists)');
          return;
        }
        
        // Check if it's an embed iframe
        if (iframe.src.includes('youtube.com/embed/') && !iframe.src.includes('autoplay=')) {
          log.info('Processing YouTube iframe:', iframe.src);
          iframe.classList.add('yt-shell-processed');
          const player = new YouTubeShellPlayer(iframe, this.siteId);
          this.players.push(player);
          processed++;
        } else {
          log.debug('Skipping iframe (not an embed or has autoplay):', iframe.src.substring(0, 100));
        }
      });
      
      log.info('Processed', processed, 'YouTube embeds');
      
      if (processed === 0 && iframes.length > 0) {
        log.warn('Found iframes but none matched embed pattern. Check iframe src format.');
      }
    }
    
    setupMutationObserver() {
      log.debug('Setting up MutationObserver for dynamic iframes');
      
      this.mutationObserver = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          for (const node of mutation.addedNodes) {
            if (node.nodeType !== Node.ELEMENT_NODE) continue;
            
            // Check if the node itself is an iframe
            if (node.tagName === 'IFRAME') {
              this.processIframe(node);
              continue;
            }
            
            // Check for iframes inside the added node
            const iframes = node.querySelectorAll?.('iframe[src*="youtube.com"], iframe[src*="youtu.be"]');
            iframes?.forEach(iframe => this.processIframe(iframe));
          }
        }
      });
      
      this.mutationObserver.observe(document.body, { 
        childList: true, 
        subtree: true 
      });
      
      log.debug('MutationObserver active');
    }
    
    processIframe(iframe) {
      if (iframe.classList.contains('yt-shell-processed')) return;
      
      // Give time for src to be set
      setTimeout(() => {
        if (iframe.src.includes('youtube.com/embed/') && !iframe.src.includes('autoplay=')) {
          log.info('Processing dynamically added iframe:', iframe.src);
          iframe.classList.add('yt-shell-processed');
          const player = new YouTubeShellPlayer(iframe, this.siteId);
          this.players.push(player);
        }
      }, 100);
    }
    
    setupDynamicIframeDetection() {
      // For WordPress/Elementor which may use JavaScript to load content
      // Poll for new iframes every 2 seconds for the first 30 seconds
      let pollCount = 0;
      const maxPolls = 15;
      
      const pollInterval = setInterval(() => {
        pollCount++;
        const existingCount = this.players.length;
        this.findAndReplace();
        
        if (pollCount >= maxPolls || this.players.length > existingCount) {
          clearInterval(pollInterval);
          if (pollCount >= maxPolls) {
            log.debug('Dynamic iframe polling stopped after', maxPolls, 'checks');
          }
        }
      }, 2000);
      
      log.debug('Started dynamic iframe polling');
    }

    setupLazyLoading() {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const iframe = entry.target;
            if (!iframe.classList.contains('yt-shell-processed')) {
              iframe.classList.add('yt-shell-processed');
              const player = new YouTubeShellPlayer(iframe, this.siteId);
              this.players.push(player);
              observer.unobserve(iframe);
            }
          }
        });
      }, { rootMargin: '200px' });

      document.querySelectorAll('iframe[src*="youtube.com"], iframe[src*="youtu.be"]').forEach(iframe => {
        observer.observe(iframe);
      });
    }
  }

  // Create global instance for debug panel access
  window.ytShellInstance = null;
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.ytShellInstance = new YouTubeShell();
    });
  } else {
    window.ytShellInstance = new YouTubeShell();
  }

  // YTDebugPanel Class - Real-time debug panel like GA DebugView
  class YTDebugPanel {
    constructor(siteId, shellInstance) {
      this.siteId = siteId;
      this.shell = shellInstance;
      this.panel = null;
      this.events = [];
      this.isMinimized = false;
      this.maxEvents = 50;
    }

    init() {
      this.checkScriptStatus();
      this.checkAPIStatus();
      this.render();
      this.bindEvents();
      
      // Periodically check status
      setInterval(() => {
        this.checkScriptStatus();
        this.checkAPIStatus();
        this.updateStatusUI();
      }, 5000);
      
      console.log('[YT Shell Debug] Debug panel initialized. Events will appear here.');
    }

    checkScriptStatus() {
      // Check GA4
      this.ga4Loaded = typeof window.gtag === 'function';
      this.ga4Blocked = this.isAdBlockerDetected() && !this.ga4Loaded;
      this.ga4Id = this.shell.players[0]?.config?.resolvedGA4Id || null;
      
      // Check Meta Pixel
      this.pixelLoaded = typeof window.fbq === 'function';
      this.pixelBlocked = this.isAdBlockerDetected() && !this.pixelLoaded;
      this.pixelId = this.shell.players[0]?.config?.resolvedPixelId || null;
    }
    
    checkAPIStatus() {
      const player = this.shell.players[0];
      if (player) {
        this.apiStatus = player.apiStatus || 'pending';
      } else {
        this.apiStatus = 'no_player';
      }
    }

    isAdBlockerDetected() {
      try {
        const test = document.createElement('div');
        test.innerHTML = '&nbsp;';
        test.className = 'adsbox ad-banner';
        test.style.position = 'absolute';
        test.style.left = '-9999px';
        document.body.appendChild(test);
        const blocked = test.offsetHeight === 0 || test.offsetWidth === 0;
        document.body.removeChild(test);
        return blocked;
      } catch (e) {
        return false;
      }
    }

    render() {
      // Remove existing panel if any
      const existing = document.getElementById('yt-shell-debug-panel');
      if (existing) existing.remove();

      // Create panel
      this.panel = document.createElement('div');
      this.panel.id = 'yt-shell-debug-panel';
      this.panel.innerHTML = this.getPanelHTML();
      document.body.appendChild(this.panel);

      // Bind button events
      this.bindPanelEvents();
    }

    getPanelHTML() {
      const ga4Status = this.getStatusBadge(this.ga4Loaded, this.ga4Blocked, this.ga4Id, 'GA4');
      const pixelStatus = this.getStatusBadge(this.pixelLoaded, this.pixelBlocked, this.pixelId, 'Pixel');

      return `
        <style>
          #yt-shell-debug-panel {
            position: fixed;
            bottom: 16px;
            right: 16px;
            width: 360px;
            max-width: calc(100vw - 32px);
            background: #1a1a1a;
            border: 1px solid #333;
            border-radius: 12px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, monospace;
            font-size: 12px;
            color: #fff;
            z-index: 2147483647;
            box-shadow: 0 8px 32px rgba(0,0,0,0.5);
            overflow: hidden;
          }
          #yt-shell-debug-panel * {
            box-sizing: border-box;
          }
          .yt-debug-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 10px 12px;
            background: #252525;
            border-bottom: 1px solid #333;
          }
          .yt-debug-title {
            display: flex;
            align-items: center;
            gap: 8px;
            font-weight: 600;
          }
          .yt-debug-dot {
            width: 8px;
            height: 8px;
            background: #22c55e;
            border-radius: 50%;
            animation: yt-debug-pulse 2s infinite;
          }
          @keyframes yt-debug-pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
          .yt-debug-actions {
            display: flex;
            gap: 4px;
          }
          .yt-debug-btn {
            background: transparent;
            border: none;
            color: #888;
            cursor: pointer;
            padding: 4px;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .yt-debug-btn:hover {
            background: #333;
            color: #fff;
          }
          .yt-debug-content {
            max-height: 300px;
            overflow-y: auto;
          }
          .yt-debug-content::-webkit-scrollbar {
            width: 6px;
          }
          .yt-debug-content::-webkit-scrollbar-track {
            background: #1a1a1a;
          }
          .yt-debug-content::-webkit-scrollbar-thumb {
            background: #444;
            border-radius: 3px;
          }
          .yt-debug-section {
            padding: 10px 12px;
            border-bottom: 1px solid #333;
          }
          .yt-debug-section:last-child {
            border-bottom: none;
          }
          .yt-debug-section-title {
            color: #888;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 8px;
          }
          .yt-debug-status-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 4px 0;
          }
          .yt-debug-status-label {
            color: #888;
          }
          .yt-debug-status-badge {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 11px;
          }
          .yt-debug-status-badge.loaded {
            background: rgba(34, 197, 94, 0.2);
            color: #22c55e;
          }
          .yt-debug-status-badge.blocked {
            background: rgba(234, 179, 8, 0.2);
            color: #eab308;
          }
          .yt-debug-status-badge.not-configured {
            background: rgba(107, 114, 128, 0.2);
            color: #9ca3af;
          }
          .yt-debug-status-icon {
            font-size: 10px;
          }
          .yt-debug-event {
            padding: 8px 0;
            border-bottom: 1px solid #222;
          }
          .yt-debug-event:last-child {
            border-bottom: none;
          }
          .yt-debug-event-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 4px;
          }
          .yt-debug-event-name {
            font-weight: 500;
            color: #fff;
          }
          .yt-debug-event-name.test {
            color: #60a5fa;
          }
          .yt-debug-event-time {
            color: #666;
            font-size: 10px;
          }
          .yt-debug-event-results {
            display: flex;
            gap: 12px;
            font-size: 11px;
          }
          .yt-debug-result {
            display: flex;
            align-items: center;
            gap: 4px;
          }
          .yt-debug-result.sent { color: #22c55e; }
          .yt-debug-result.failed { color: #ef4444; }
          .yt-debug-result.pending { color: #eab308; }
          .yt-debug-result.skipped { color: #888; }
          .yt-debug-result.not-configured { color: #666; }
          .yt-debug-api-status {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 6px 8px;
            background: rgba(255,255,255,0.05);
            border-radius: 6px;
          }
          .yt-debug-api-status.success { background: rgba(34, 197, 94, 0.1); }
          .yt-debug-api-status.error { background: rgba(239, 68, 68, 0.1); }
          .yt-debug-api-icon {
            font-size: 14px;
          }
          .yt-debug-api-text {
            font-size: 11px;
            color: #888;
          }
          .yt-debug-warning {
            display: flex;
            align-items: flex-start;
            gap: 6px;
            margin-top: 8px;
            padding: 8px;
            background: rgba(234, 179, 8, 0.1);
            border: 1px solid rgba(234, 179, 8, 0.3);
            border-radius: 6px;
            font-size: 10px;
            color: #eab308;
            line-height: 1.4;
          }
          .yt-debug-warning-icon {
            flex-shrink: 0;
          }
          .yt-debug-empty {
            padding: 20px;
            text-align: center;
            color: #666;
          }
          .yt-debug-footer {
            display: flex;
            gap: 8px;
            padding: 10px 12px;
            background: #252525;
            border-top: 1px solid #333;
          }
          .yt-debug-footer-btn {
            flex: 1;
            padding: 8px 12px;
            border: none;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 500;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            transition: all 0.2s;
          }
          .yt-debug-footer-btn.primary {
            background: #3b82f6;
            color: #fff;
          }
          .yt-debug-footer-btn.primary:hover {
            background: #2563eb;
          }
          .yt-debug-footer-btn.primary.sent {
            background: #22c55e;
          }
          .yt-debug-footer-btn.secondary {
            background: #333;
            color: #fff;
          }
          .yt-debug-footer-btn.secondary:hover {
            background: #444;
          }
          .yt-debug-footer-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
          .yt-debug-toggle {
            position: absolute;
            bottom: 16px;
            right: 16px;
            width: 48px;
            height: 48px;
            background: #1a1a1a;
            border: 1px solid #333;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            z-index: 2147483647;
            box-shadow: 0 4px 16px rgba(0,0,0,0.3);
          }
          .yt-debug-toggle:hover {
            background: #252525;
          }
          .yt-debug-minimized #yt-shell-debug-panel {
            display: none;
          }
          .yt-debug-minimized .yt-debug-toggle {
            display: flex;
          }
          .yt-debug-toggle svg {
            width: 20px;
            height: 20px;
            color: #888;
          }
        </style>
        
        <!-- Minimized Toggle -->
        <div class="yt-debug-minimized">
          <div class="yt-debug-toggle" onclick="document.getElementById('yt-shell-debug-panel').style.display='block'; this.parentElement.classList.remove('yt-debug-minimized')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
              <path d="M12 16v-4M12 8h.01"/>
            </svg>
          </div>
        </div>
        
        <!-- Main Panel -->
        <div class="yt-debug-header">
          <div class="yt-debug-title">
            <div class="yt-debug-dot"></div>
            <span>YT Shell Debug</span>
          </div>
          <div class="yt-debug-actions">
            <button class="yt-debug-btn" onclick="document.getElementById('yt-shell-debug-panel').parentElement.classList.add('yt-debug-minimized')" title="Minimize">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M5 12h14"/>
              </svg>
            </button>
            <button class="yt-debug-btn" onclick="document.getElementById('yt-shell-debug-panel').remove(); if(window.ytShellInstance) window.ytShellInstance.debugPanel = null" title="Close">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>
        
        <div class="yt-debug-content">
          <!-- API Status -->
          <div class="yt-debug-section" id="yt-debug-api-section">
            <div class="yt-debug-section-title">Connection</div>
            <div class="yt-debug-api-status" id="yt-debug-api-status">
              ${this.getAPIStatusHTML()}
            </div>
          </div>
          
          <!-- Script Status -->
          <div class="yt-debug-section">
            <div class="yt-debug-section-title">Tracking Scripts</div>
            ${ga4Status}
            ${pixelStatus}
            ${(this.ga4Blocked || this.pixelBlocked) ? `
              <div class="yt-debug-warning">
                <span class="yt-debug-warning-icon">&#9888;</span>
                <span>AdBlocker detected! Try incognito mode to test tracking.</span>
              </div>
            ` : ''}
          </div>
          
          <!-- Events -->
          <div class="yt-debug-section" id="yt-debug-events">
            <div class="yt-debug-section-title">Events (${this.events.length})</div>
            <div id="yt-debug-events-list">
              ${this.events.length === 0 ? '<div class="yt-debug-empty">No events yet. Interact with the player.</div>' : ''}
              ${this.events.slice().reverse().map(e => this.renderEvent(e)).join('')}
            </div>
          </div>
        </div>
        
        <div class="yt-debug-footer">
          <button class="yt-debug-footer-btn primary" id="yt-debug-test-btn">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
            Test Event
          </button>
          <button class="yt-debug-footer-btn secondary" id="yt-debug-copy-btn" ${this.events.length === 0 ? 'disabled' : ''}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2"/>
              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
            </svg>
            Copy
          </button>
          <button class="yt-debug-footer-btn secondary" id="yt-debug-clear-btn" ${this.events.length === 0 ? 'disabled' : ''}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
            </svg>
          </button>
        </div>
      `;
    }

    getStatusBadge(loaded, blocked, id, label) {
      let statusClass, statusText, icon;
      
      if (loaded) {
        statusClass = 'loaded';
        statusText = 'Loaded';
        icon = '&#10003;';
      } else if (blocked) {
        statusClass = 'blocked';
        statusText = 'AdBlocker';
        icon = '&#9888;';
      } else {
        statusClass = 'not-configured';
        statusText = id ? 'Missing' : 'Not Set';
        icon = id ? '&#9888;' : '&#8212;';
      }
      
      return `
        <div class="yt-debug-status-row">
          <span class="yt-debug-status-label">${label}:</span>
          <span class="yt-debug-status-badge ${statusClass}">
            <span class="yt-debug-status-icon">${icon}</span>
            ${statusText}
            ${id ? `<span style="opacity:0.7;margin-left:4px">${id}</span>` : ''}
          </span>
        </div>
      `;
    }
    
    getAPIStatusHTML() {
      const status = this.apiStatus || 'pending';
      const playerCount = this.shell.players.length;
      
      let icon, text, className;
      
      switch (status) {
        case 'success':
          icon = '&#10003;';
          text = `Connected (${playerCount} player${playerCount !== 1 ? 's' : ''})`;
          className = 'success';
          break;
        case 'error':
          icon = '&#10005;';
          text = 'Connection failed';
          className = 'error';
          break;
        case 'no_player':
          icon = '&#8212;';
          text = 'No YouTube embeds found';
          className = '';
          break;
        default:
          icon = '...';
          text = 'Connecting...';
          className = '';
      }
      
      return `
        <div class="yt-debug-api-status ${className}">
          <span class="yt-debug-api-icon">${icon}</span>
          <span class="yt-debug-api-text">${text}</span>
        </div>
      `;
    }
    
    updateStatusUI() {
      const apiStatusEl = document.getElementById('yt-debug-api-status');
      if (apiStatusEl) {
        apiStatusEl.innerHTML = this.getAPIStatusHTML();
        apiStatusEl.className = `yt-debug-api-status ${this.apiStatus === 'success' ? 'success' : this.apiStatus === 'error' ? 'error' : ''}`;
      }
    }

    renderEvent(event) {
      const time = new Date(event.timestamp).toLocaleTimeString();
      const isTest = event.name === 'debug_test';
      
      return `
        <div class="yt-debug-event">
          <div class="yt-debug-event-header">
            <span class="yt-debug-event-name ${isTest ? 'test' : ''}">${event.name}</span>
            <span class="yt-debug-event-time">${time}</span>
          </div>
          <div class="yt-debug-event-results">
            <span class="yt-debug-result ${event.ga4Status}">GA ${this.getResultIcon(event.ga4Status)}</span>
            <span class="yt-debug-result ${event.pixelStatus}">PX ${this.getResultIcon(event.pixelStatus)}</span>
          </div>
        </div>
      `;
    }

    getResultIcon(status) {
      switch (status) {
        case 'sent': return '&#10003;';
        case 'failed': return '&#10005;';
        case 'pending': return '...';
        case 'skipped': return '&#8212;';
        default: return '&#8212;';
      }
    }

    bindEvents() {
      // Re-check script status periodically
      setInterval(() => this.checkScriptStatus(), 5000);
    }

    bindPanelEvents() {
      const testBtn = document.getElementById('yt-debug-test-btn');
      const copyBtn = document.getElementById('yt-debug-copy-btn');
      const clearBtn = document.getElementById('yt-debug-clear-btn');

      if (testBtn) {
        testBtn.addEventListener('click', () => {
          this.shell.fireTestEvent();
        });
      }

      if (copyBtn) {
        copyBtn.addEventListener('click', () => {
          this.copyLogs();
        });
      }

      if (clearBtn) {
        clearBtn.addEventListener('click', () => {
          this.clearEvents();
        });
      }
    }

    addEvent(name, data, ga4Status, pixelStatus) {
      this.events.push({
        name,
        data,
        ga4Status,
        pixelStatus,
        timestamp: Date.now(),
      });

      // Keep only last N events
      if (this.events.length > this.maxEvents) {
        this.events = this.events.slice(-this.maxEvents);
      }

      this.updateUI();
    }

    updateUI() {
      const eventsList = document.getElementById('yt-debug-events-list');
      const eventsCount = document.querySelector('.yt-debug-section-title');
      
      if (eventsList) {
        if (this.events.length === 0) {
          eventsList.innerHTML = '<div class="yt-debug-empty">No events yet. Interact with the player.</div>';
        } else {
          eventsList.innerHTML = this.events.slice().reverse().map(e => this.renderEvent(e)).join('');
        }
      }
      
      if (eventsCount) {
        eventsCount.textContent = `Events (${this.events.length})`;
      }

      // Update clear/copy buttons
      const clearBtn = document.getElementById('yt-debug-clear-btn');
      const copyBtn = document.getElementById('yt-debug-copy-btn');
      if (clearBtn) clearBtn.disabled = this.events.length === 0;
      if (copyBtn) copyBtn.disabled = this.events.length === 0;
    }

    showTestSent() {
      const testBtn = document.getElementById('yt-debug-test-btn');
      if (testBtn) {
        testBtn.classList.add('sent');
        testBtn.innerHTML = `
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
          Sent!
        `;
        setTimeout(() => {
          testBtn.classList.remove('sent');
          testBtn.innerHTML = `
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
            Test Event
          `;
        }, 2000);
      }
    }

    copyLogs() {
      const text = this.events.map(e => {
        return `[${new Date(e.timestamp).toLocaleTimeString()}] ${e.name} | GA4: ${e.ga4Status} | Pixel: ${e.pixelStatus}`;
      }).join('\n');
      
      navigator.clipboard.writeText(text).then(() => {
        const btn = document.getElementById('yt-debug-copy-btn');
        if (btn) {
          btn.textContent = 'Copied!';
          setTimeout(() => {
            btn.innerHTML = `
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2"/>
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
              </svg>
              Copy
            `;
          }, 1500);
        }
      });
    }

    clearEvents() {
      this.events = [];
      this.updateUI();
    }
  }
})();
