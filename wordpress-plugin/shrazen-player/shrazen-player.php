<?php
/**
 * Plugin Name: Shrazen Player
 * Plugin URI: https://shrazen.com
 * Description: Replace YouTube embeds with a custom branded player. Supports lead gates, analytics, and white-label branding.
 * Version: 1.0.0
 * Author: Shrazen
 * Author URI: https://shrazen.com
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: shrazen-player
 * Domain Path: /languages
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Plugin constants
define('SHRAZEN_VERSION', '1.0.0');
define('SHRAZEN_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('SHRAZEN_PLUGIN_URL', plugin_dir_url(__FILE__));

/**
 * Main Shrazen Player class
 */
class Shrazen_Player {

    private $api_endpoint = 'https://player.shrazen.com';
    private $options;

    /**
     * Initialize the plugin
     */
    public function __construct() {
        $this->options = get_option('shrazen_settings', array());

        // Hook into WordPress
        add_action('init', array($this, 'load_textdomain'));
        add_action('wp_head', array($this, 'render_styles'), 999);
        add_action('wp_footer', array($this, 'render_script'), 999);
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_init', array($this, 'register_settings'));

        // AJAX handlers for settings
        add_action('wp_ajax_shrazen_get_installations', array($this, 'ajax_get_installations'));
        add_action('wp_ajax_shrazen_save_settings', array($this, 'ajax_save_settings'));
        add_action('wp_ajax_shrazen_create_installation', array($this, 'ajax_create_installation'));
    }

    /**
     * Load plugin textdomain for translations
     */
    public function load_textdomain() {
        load_plugin_textdomain(
            'shrazen-player',
            false,
            dirname(plugin_basename(__FILE__)) . '/languages'
        );
    }

    /**
     * Get the current installation ID
     */
    private function get_installation_id() {
        return isset($this->options['installation_id']) ? $this->options['installation_id'] : '';
    }

    /**
     * Render inline styles
     */
    public function render_styles() {
        if (is_admin()) return;

        $primary_color = isset($this->options['primary_color']) ? $this->options['primary_color'] : '#ef4444';
        $border_radius = isset($this->options['border_radius']) ? $this->options['border_radius'] : '0';
        ?>
        <style>
            /* Shrazen Player - Strictly Square by Default */
            .shrazen-wrapper {
                position: relative;
                width: 100%;
                aspect-ratio: 16 / 9;
                background: #050505;
                border-radius: <?php echo intval($border_radius); ?>px;
                overflow: hidden;
                isolation: isolate;
            }

            .shrazen-wrapper:focus {
                outline: none;
            }

            .shrazen-stage {
                position: absolute;
                inset: 0;
                background: #000;
            }

            /* Oversized iframe trick for click-through controls */
            .shrazen-player-slot {
                position: absolute;
                top: -50%;
                left: 0;
                width: 100%;
                height: 200%;
                z-index: 1;
                transition: opacity 0.4s ease;
            }

            .shrazen-player-slot iframe {
                width: 100%;
                height: 100%;
                pointer-events: none;
            }

            .shrazen-poster {
                position: absolute;
                inset: 0;
                z-index: 4;
                background-color: #000;
                background-size: cover;
                background-position: center;
                cursor: pointer;
                transition: opacity 0.4s ease, visibility 0.4s ease;
            }

            .shrazen-poster::before {
                content: "";
                position: absolute;
                inset: 0;
                background: rgba(0, 0, 0, 0.2);
            }

            .shrazen-wrapper.has-started .shrazen-poster {
                opacity: 0;
                visibility: hidden;
                pointer-events: none;
            }

            /* Central Play Button */
            .shrazen-center-play {
                position: absolute;
                top: 50%;
                left: 50%;
                width: 76px;
                height: 52px;
                transform: translate(-50%, -50%);
                border-radius: 14px;
                background: rgba(30, 30, 30, 0.8);
                border: 1px solid rgba(255, 255, 255, 0.1);
                z-index: 2;
                transition: transform 0.2s ease, background 0.2s ease, border-color 0.2s ease;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .shrazen-center-play::before {
                content: "";
                width: 0;
                height: 0;
                border-style: solid;
                border-width: 12px 0 12px 20px;
                border-color: transparent transparent transparent white;
                margin-left: 4px;
            }

            .shrazen-poster:hover .shrazen-center-play {
                transform: translate(-50%, -50%) scale(1.05);
                background: <?php echo esc_attr($primary_color); ?>;
                border-color: <?php echo esc_attr($primary_color); ?>;
            }

            .shrazen-pause-overlay {
                position: absolute;
                inset: 0;
                z-index: 3;
                opacity: 0;
                pointer-events: none;
                transition: opacity 0.3s ease;
            }

            .shrazen-wrapper.is-paused .shrazen-pause-overlay,
            .shrazen-wrapper.is-ended .shrazen-pause-overlay {
                opacity: 1;
                pointer-events: auto;
            }

            .shrazen-click-layer {
                position: absolute;
                inset: 0;
                z-index: 2;
                cursor: pointer;
            }

            /* Top Bar Badge */
            .shrazen-top-bar {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                z-index: 5;
                padding: 20px 22px;
                pointer-events: none;
            }

            .shrazen-badge {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                padding: 8px 14px;
                border-radius: 999px;
                background: rgba(20, 20, 20, 0.8);
                border: 1px solid rgba(255, 255, 255, 0.08);
                color: #fff;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
                font-size: 11px;
                font-weight: 600;
                line-height: 1.1;
                letter-spacing: 0.08em;
                text-transform: uppercase;
            }

            .shrazen-badge-dot {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: <?php echo esc_attr($primary_color); ?>;
            }

            /* Controls */
            .shrazen-controls {
                position: absolute;
                left: 0;
                right: 0;
                bottom: 0;
                z-index: 6;
                padding: 0 16px 12px 16px;
                transition: opacity 0.3s ease, transform 0.3s ease;
                background: linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%);
            }

            .shrazen-wrapper:not(:hover).is-playing.is-idle .shrazen-controls {
                opacity: 0;
                transform: translateY(10px);
                pointer-events: none;
            }

            .shrazen-row {
                display: flex;
                align-items: center;
                gap: 16px;
            }

            .shrazen-progress {
                width: 100%;
                height: 5px;
                margin-bottom: 12px;
                background: rgba(255, 255, 255, 0.2);
                border-radius: 999px;
                overflow: hidden;
                cursor: pointer;
                transition: height 0.2s ease;
            }

            .shrazen-progress:hover {
                height: 8px;
            }

            .shrazen-progress-fill {
                width: 0%;
                height: 100%;
                background: <?php echo esc_attr($primary_color); ?>;
                border-radius: inherit;
            }

            .shrazen-btn {
                appearance: none;
                border: none;
                cursor: pointer;
                color: #fff;
                background: transparent;
                padding: 4px;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0.85;
                transition: opacity 0.2s ease;
            }

            .shrazen-btn:hover {
                opacity: 1;
            }

            .shrazen-btn svg {
                width: 24px;
                height: 24px;
            }

            .shrazen-time {
                color: rgba(255, 255, 255, 0.9);
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
                font-size: 13px;
            }

            .shrazen-spacer {
                flex-grow: 1;
            }

            /* Lead Gate Overlay */
            .shrazen-gate {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.95);
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                z-index: 100;
                padding: 32px;
            }

            .shrazen-gate-content {
                text-align: center;
                max-width: 400px;
                width: 100%;
            }

            .shrazen-gate-icon {
                font-size: 48px;
                margin-bottom: 16px;
            }

            .shrazen-gate h3 {
                color: white;
                margin: 0 0 8px 0;
                font-size: 24px;
            }

            .shrazen-gate p {
                color: rgba(255, 255, 255, 0.7);
                margin: 0 0 24px 0;
                font-size: 14px;
            }

            .shrazen-gate form {
                text-align: left;
            }

            .shrazen-gate input[type="email"],
            .shrazen-gate input[type="text"] {
                width: 100%;
                padding: 14px 16px;
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 8px;
                font-size: 14px;
                background: rgba(255, 255, 255, 0.1);
                color: white;
                margin-bottom: 12px;
                box-sizing: border-box;
            }

            .shrazen-gate input::placeholder {
                color: rgba(255, 255, 255, 0.5);
            }

            .shrazen-gate button[type="submit"] {
                width: 100%;
                padding: 14px;
                background: <?php echo esc_attr($primary_color); ?>;
                color: white;
                border: none;
                border-radius: 8px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
            }

            .shrazen-gate button[type="submit"]:hover {
                opacity: 0.9;
            }

            .shrazen-gate .skip-link {
                display: block;
                margin-top: 12px;
                background: none;
                border: none;
                color: rgba(255, 255, 255, 0.5);
                cursor: pointer;
                font-size: 13px;
            }

            /* Fullscreen */
            .shrazen-wrapper:fullscreen {
                width: 100vw;
                height: 100vh;
                aspect-ratio: auto;
                border-radius: 0;
            }

            /* Responsive */
            @media (max-width: 680px) {
                .shrazen-center-play { width: 60px; height: 42px; border-radius: 10px; }
                .shrazen-top-bar { padding: 12px; }
                .shrazen-controls { padding: 0 10px 8px 10px; }
                .shrazen-progress { margin-bottom: 8px; }
                .shrazen-row { gap: 12px; }
                .shrazen-btn svg { width: 20px; height: 20px; }
                .shrazen-time { font-size: 11px; }
                .shrazen-badge { padding: 6px 10px; font-size: 9px; }
            }
        </style>
        <?php
    }

    /**
     * Render JavaScript
     */
    public function render_script() {
        if (is_admin()) return;

        $installation_id = $this->get_installation_id();
        if (empty($installation_id)) return;

        $api_url = isset($this->options['api_url']) ? $this->options['api_url'] : 'https://player.shrazen.com';
        $primary_color = isset($this->options['primary_color']) ? $this->options['primary_color'] : '#ef4444';
        $brand_name = isset($this->options['brand_name']) ? $this->options['brand_name'] : get_bloginfo('name');
        ?>
        <script>
        (function() {
            'use strict';

            const INSTALLATION_ID = '<?php echo esc_js($installation_id); ?>';
            const CONFIG_ENDPOINT = '<?php echo esc_js($api_url); ?>/api/embed';
            const TRACK_ENDPOINT = '<?php echo esc_js($api_url); ?>/api/track';
            const LEADS_ENDPOINT = '<?php echo esc_js($api_url); ?>/api/leads';
            const BRAND_NAME = '<?php echo esc_js($brand_name); ?>';
            const PRIMARY_COLOR = '<?php echo esc_js($primary_color); ?>';

            // SVG Icons
            const ICONS = {
                play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',
                pause: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>',
                mute: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>',
                unmute: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05l2.45 2.45c.03-.2.05-.41.05-.63zM19 12c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>',
                fsEnter: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>',
                fsExit: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/></svg>',
            };

            let config = null;
            let isKnownUser = false;

            // Check if user has already submitted
            function checkKnownUser() {
                const key = 'shrazen_lead_' + INSTALLATION_ID;
                const data = localStorage.getItem(key);
                if (!data) return false;

                try {
                    const parsed = JSON.parse(data);
                    if (!parsed.lastSubmittedAt) return false;
                    const lastSubmit = new Date(parsed.lastSubmittedAt);
                    const daysSince = (Date.now() - lastSubmit.getTime()) / (1000 * 60 * 60 * 24);
                    return daysSince < 7;
                } catch (e) {
                    return false;
                }
            }

            function markUserAsKnown(email) {
                const key = 'shrazen_lead_' + INSTALLATION_ID;
                localStorage.setItem(key, JSON.stringify({
                    email: email,
                    lastSubmittedAt: new Date().toISOString()
                }));
            }

            async function fetchConfig() {
                try {
                    const domainParam = '?domain=' + encodeURIComponent(window.location.host);
                    const response = await fetch(CONFIG_ENDPOINT + '/' + INSTALLATION_ID + domainParam);
                    if (response.ok) {
                        config = await response.json();
                        isKnownUser = checkKnownUser();
                        return config;
                    }
                } catch (e) {
                    console.error('[Shrazen] Config fetch failed:', e);
                }
                return null;
            }

            async function trackEvent(event, data = {}) {
                const payload = {
                    installationId: INSTALLATION_ID,
                    event: event,
                    url: window.location.href,
                    domain: window.location.host,
                    ...data
                };

                try {
                    if (navigator.sendBeacon) {
                        navigator.sendBeacon(TRACK_ENDPOINT, JSON.stringify(payload));
                    } else {
                        fetch(TRACK_ENDPOINT, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(payload),
                            keepalive: true
                        });
                    }
                } catch (e) {
                    console.error('[Shrazen] Track failed:', e);
                }
            }

            async function submitLead(email, name) {
                try {
                    const response = await fetch(LEADS_ENDPOINT, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            installationId: INSTALLATION_ID,
                            email: email,
                            name: name || null,
                            url: window.location.href,
                            domain: window.location.host
                        })
                    });

                    if (response.ok) {
                        markUserAsKnown(email);
                        return true;
                    }
                } catch (e) {
                    console.error('[Shrazen] Lead submission failed:', e);
                }
                return false;
            }

            function formatTime(seconds) {
                if (!seconds || isNaN(seconds)) return '0:00';
                const total = Math.floor(seconds);
                return Math.floor(total / 60) + ':' + String(total % 60).padStart(2, '0');
            }

            function getVideoId(src) {
                const match = String(src || '').match(/(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:embed\/|watch\?v=|watch\?.+&v=))([^"&?\/\s]{11})/);
                return match && match[1] ? match[1] : '';
            }

            function createShell(iframe, videoId) {
                const shell = document.createElement('div');
                shell.className = 'shrazen-wrapper';
                shell.tabIndex = 0;

                const stage = document.createElement('div');
                stage.className = 'shrazen-stage';

                const slot = document.createElement('div');
                slot.className = 'shrazen-player-slot';

                const playerTarget = document.createElement('div');
                playerTarget.id = 'shrazen-player-' + Math.random().toString(36).slice(2, 10);
                slot.appendChild(playerTarget);

                const clickLayer = document.createElement('div');
                clickLayer.className = 'shrazen-click-layer';

                const poster = document.createElement('div');
                poster.className = 'shrazen-poster';
                poster.style.backgroundImage = 'url(https://i.ytimg.com/vi/' + videoId + '/maxresdefault.jpg)';

                const centerPlay = document.createElement('div');
                centerPlay.className = 'shrazen-center-play';
                poster.appendChild(centerPlay);

                const pauseOverlay = document.createElement('div');
                pauseOverlay.className = 'shrazen-pause-overlay';
                const pausePlay = centerPlay.cloneNode(true);
                pauseOverlay.appendChild(pausePlay);

                const topBar = document.createElement('div');
                topBar.className = 'shrazen-top-bar';
                topBar.innerHTML = '<span class="shrazen-badge"><span class="shrazen-badge-dot"></span>' + BRAND_NAME + '</span>';

                const controls = document.createElement('div');
                controls.className = 'shrazen-controls';
                controls.innerHTML = '<div class="shrazen-progress"><div class="shrazen-progress-fill"></div></div>' +
                    '<div class="shrazen-row">' +
                    '<button type="button" class="shrazen-btn shrazen-play-btn" aria-label="Play">' + ICONS.play + '</button>' +
                    '<span class="shrazen-time">0:00 / 0:00</span>' +
                    '<div class="shrazen-spacer"></div>' +
                    '<button type="button" class="shrazen-btn shrazen-mute-btn" aria-label="Mute">' + ICONS.mute + '</button>' +
                    '<button type="button" class="shrazen-btn shrazen-fs-btn" aria-label="Fullscreen">' + ICONS.fsEnter + '</button>' +
                    '</div>';

                shell.appendChild(stage);
                shell.appendChild(slot);
                shell.appendChild(clickLayer);
                shell.appendChild(poster);
                shell.appendChild(pauseOverlay);
                shell.appendChild(topBar);
                shell.appendChild(controls);

                // Store references
                shell._playerTarget = playerTarget;
                shell._poster = poster;
                shell._centerPlay = centerPlay;
                shell._pauseOverlay = pauseOverlay;
                shell._controls = controls;
                shell._progressFill = controls.querySelector('.shrazen-progress-fill');
                shell._time = controls.querySelector('.shrazen-time');
                shell._playBtn = controls.querySelector('.shrazen-play-btn');
                shell._muteBtn = controls.querySelector('.shrazen-mute-btn');
                shell._fsBtn = controls.querySelector('.shrazen-fs-btn');
                shell._progress = controls.querySelector('.shrazen-progress');

                iframe.parentNode.insertBefore(shell, iframe);
                iframe.remove();

                return shell;
            }

            function mountPlayer(shell, videoId, playerTarget) {
                if (typeof YT === 'undefined') return;

                const player = new YT.Player(playerTarget.id, {
                    host: 'https://www.youtube-nocookie.com',
                    videoId: videoId,
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
                        onReady: function(e) {
                            shell._player = e.target;
                        },
                        onStateChange: function(e) {
                            const isPlaying = e.data === YT.PlayerState.PLAYING;
                            const isPaused = e.data === YT.PlayerState.PAUSED;
                            const isEnded = e.data === YT.PlayerState.ENDED;

                            shell.classList.toggle('has-started', isPlaying || isPaused || isEnded);
                            shell.classList.toggle('is-playing', isPlaying);
                            shell.classList.toggle('is-paused', isPaused);
                            shell.classList.toggle('is-ended', isEnded);

                            shell._pauseOverlay.style.pointerEvents = (isPaused || isEnded) ? 'auto' : 'none';
                            shell._pauseOverlay.style.opacity = (isPaused || isEnded) ? '1' : '0';

                            shell._playBtn.innerHTML = isPlaying ? ICONS.pause : ICONS.play;

                            if (isPlaying) {
                                trackEvent('video_played', { videoId: videoId });
                            }
                            if (isEnded) {
                                trackEvent('video_completed', { videoId: videoId });
                            }
                        }
                    }
                });

                shell._player = player;
                return player;
            }

            function attachEvents(shell, videoId) {
                let player = shell._player;
                let isMuted = false;
                let updateInterval = null;
                let idleTimer = null;

                const resetIdle = function() {
                    clearTimeout(idleTimer);
                    shell.classList.remove('is-idle');
                    if (shell.classList.contains('is-playing')) {
                        idleTimer = setTimeout(function() {
                            shell.classList.add('is-idle');
                        }, 3000);
                    }
                };

                shell.addEventListener('mousemove', resetIdle);
                shell.addEventListener('touchstart', function() { resetIdle(); }, { passive: true });
                shell.addEventListener('click', function() {
                    resetIdle();
                    if (document.activeElement !== shell) {
                        shell.focus();
                    }
                });

                const togglePlay = function() {
                    if (!player || !player.playVideo) return;

                    const ctaConfig = config?.ctaConfig;
                    if (ctaConfig?.enabled && !isKnownUser && ctaConfig.captureMode === 'instant_unlock') {
                        showGateOverlay(shell, videoId);
                        return;
                    }

                    if (shell.classList.contains('is-playing')) {
                        player.pauseVideo();
                    } else {
                        player.playVideo();
                    }
                };

                const toggleMute = function() {
                    if (!player) return;
                    isMuted = !isMuted;
                    if (isMuted) {
                        player.mute();
                    } else {
                        player.unMute();
                    }
                    shell._muteBtn.innerHTML = isMuted ? ICONS.unmute : ICONS.mute;
                };

                const toggleFs = function() {
                    if (document.fullscreenElement === shell) {
                        if (document.exitFullscreen) document.exitFullscreen();
                    } else {
                        if (shell.requestFullscreen) shell.requestFullscreen();
                    }
                };

                const seek = function(e) {
                    if (!player) return;
                    const rect = shell._progress.getBoundingClientRect();
                    const ratio = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1);
                    player.seekTo((player.getDuration() || 0) * ratio, true);
                };

                const seekRelative = function(seconds) {
                    if (!player) return;
                    const current = player.getCurrentTime() || 0;
                    const duration = player.getDuration() || 0;
                    let newTime = Math.max(0, Math.min(duration, current + seconds));
                    player.seekTo(newTime, true);
                };

                // Keyboard shortcuts
                shell.addEventListener('keydown', function(e) {
                    if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
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

                shell._poster.addEventListener('click', togglePlay);
                shell._pauseOverlay.addEventListener('click', togglePlay);
                shell._centerPlay.addEventListener('click', function(e) { e.stopPropagation(); togglePlay(); });
                shell._playBtn.addEventListener('click', function(e) { e.stopPropagation(); togglePlay(); });
                shell._muteBtn.addEventListener('click', function(e) { e.stopPropagation(); toggleMute(); });
                shell._fsBtn.addEventListener('click', function(e) { e.stopPropagation(); toggleFs(); });
                shell._progress.addEventListener('click', function(e) { e.stopPropagation(); seek(e); });

                document.addEventListener('fullscreenchange', function() {
                    const isFs = document.fullscreenElement === shell;
                    shell._fsBtn.innerHTML = isFs ? ICONS.fsExit : ICONS.fsEnter;
                });

                // Update progress bar
                updateInterval = setInterval(function() {
                    if (player && typeof player.getCurrentTime === 'function') {
                        const current = player.getCurrentTime() || 0;
                        const duration = player.getDuration() || 0;
                        const progress = duration ? (current / duration) * 100 : 0;
                        shell._progressFill.style.width = progress + '%';
                        shell._time.textContent = formatTime(current) + ' / ' + formatTime(duration);
                    }
                }, 250);
            }

            function showGateOverlay(shell, videoId) {
                const ctaConfig = config?.ctaConfig || {};
                const form = ctaConfig.form || {};
                const isSoftGate = ctaConfig.mode !== 'hard';

                const gate = document.createElement('div');
                gate.className = 'shrazen-gate';
                gate.innerHTML = '<div class="shrazen-gate-content">' +
                    '<div class="shrazen-gate-icon">🔒</div>' +
                    '<h3>' + (form.headline || 'Unlock this content') + '</h3>' +
                    '<p>' + (form.description || 'Enter your email to continue watching') + '</p>' +
                    '<form>' +
                    '<input type="email" name="email" placeholder="Email address" required>' +
                    '<button type="submit">' + (form.buttonText || 'Continue') + '</button>' +
                    (isSoftGate ? '<button type="button" class="skip-link">Skip for now</button>' : '') +
                    '</form></div>';

                shell.appendChild(gate);

                const formEl = gate.querySelector('form');
                formEl.addEventListener('submit', async function(e) {
                    e.preventDefault();
                    const email = formEl.querySelector('input[name="email"]').value;
                    const success = await submitLead(email);
                    if (success) {
                        gate.remove();
                        if (shell._player && shell._player.playVideo) {
                            shell._player.playVideo();
                        }
                    } else {
                        alert('Something went wrong. Please try again.');
                    }
                });

                const skipBtn = gate.querySelector('.skip-link');
                if (skipBtn) {
                    skipBtn.addEventListener('click', function() {
                        gate.remove();
                        if (shell._player && shell._player.playVideo) {
                            shell._player.playVideo();
                        }
                    });
                }
            }

            function processIframe(iframe) {
                if (iframe.dataset.shrazenReady === '1') return;
                if (iframe.closest('.shrazen-wrapper')) return;

                const videoId = getVideoId(iframe.getAttribute('src'));
                if (!videoId) return;

                iframe.dataset.shrazenReady = '1';
                const shell = createShell(iframe, videoId);

                // Load YouTube API if needed
                if (typeof YT === 'undefined') {
                    const script = document.createElement('script');
                    script.src = 'https://www.youtube.com/iframe_api';
                    document.head.appendChild(script);
                    window.onYouTubeIframeAPIReady = function() {
                        const player = mountPlayer(shell, videoId, shell._playerTarget);
                        if (player) {
                            shell._player = player;
                            attachEvents(shell, videoId);
                        }
                    };
                } else {
                    const player = mountPlayer(shell, videoId, shell._playerTarget);
                    if (player) {
                        shell._player = player;
                        attachEvents(shell, videoId);
                    }
                }
            }

            function init() {
                if (!INSTALLATION_ID) return;

                fetchConfig().then(function() {
                    // Process existing iframes
                    document.querySelectorAll('iframe[src*="youtube.com"], iframe[src*="youtu.be"]').forEach(function(iframe) {
                        if (iframe.src.includes('youtube.com/embed/') && !iframe.src.includes('autoplay=')) {
                            processIframe(iframe);
                        }
                    });

                    // Watch for dynamic iframes
                    const observer = new MutationObserver(function(mutations) {
                        mutations.forEach(function(mutation) {
                            mutation.addedNodes.forEach(function(node) {
                                if (node.nodeType !== 1) return;
                                if (node.tagName === 'IFRAME') {
                                    const src = node.getAttribute('src');
                                    if (src && src.includes('youtube.com/embed/') && !src.includes('autoplay=')) {
                                        processIframe(node);
                                    }
                                }
                                const iframes = node.querySelectorAll ? node.querySelectorAll('iframe[src*="youtube.com"]') : [];
                                iframes.forEach(function(iframe) {
                                    const src = iframe.getAttribute('src');
                                    if (src && src.includes('youtube.com/embed/') && !src.includes('autoplay=')) {
                                        processIframe(iframe);
                                    }
                                });
                            });
                        });
                    });
                    observer.observe(document.body, { childList: true, subtree: true });
                });
            }

            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', init);
            } else {
                init();
            }
        })();
        </script>
        <?php
    }

    /**
     * Add admin menu page
     */
    public function add_admin_menu() {
        add_options_page(
            'Shrazen Player Settings',
            'Shrazen Player',
            'manage_options',
            'shrazen-player',
            array($this, 'render_admin_page')
        );
    }

    /**
     * Register settings
     */
    public function register_settings() {
        register_setting('shrazen_settings', 'shrazen_settings', array($this, 'sanitize_settings'));

        add_settings_section(
            'shrazen_main',
            'Configuration',
            array($this, 'section_description'),
            'shrazen-player'
        );

        add_settings_field(
            'installation_id',
            'Installation ID',
            array($this, 'render_installation_id_field'),
            'shrazen-player',
            'shrazen_main'
        );

        add_settings_field(
            'api_url',
            'API URL',
            array($this, 'render_api_url_field'),
            'shrazen-player',
            'shrazen_main'
        );

        add_settings_field(
            'brand_name',
            'Brand Name',
            array($this, 'render_brand_name_field'),
            'shrazen-player',
            'shrazen_main'
        );

        add_settings_field(
            'primary_color',
            'Primary Color',
            array($this, 'render_primary_color_field'),
            'shrazen-player',
            'shrazen_main'
        );

        add_settings_field(
            'border_radius',
            'Border Radius (px)',
            array($this, 'render_border_radius_field'),
            'shrazen-player',
            'shrazen_main'
        );
    }

    public function section_description() {
        echo '<p>Configure your Shrazen Player settings. Get your Installation ID from your <a href="https://player.shrazen.com/dashboard" target="_blank">Shrazen Dashboard</a>.</p>';
    }

    public function render_installation_id_field() {
        $options = get_option('shrazen_settings', array());
        $value = isset($options['installation_id']) ? $options['installation_id'] : '';
        echo '<input type="text" name="shrazen_settings[installation_id]" value="' . esc_attr($value) . '" class="regular-text" placeholder="e.g., abc123xyz">';
        echo '<p class="description">Find this in your Shrazen Dashboard under Installations.</p>';
    }

    public function render_api_url_field() {
        $options = get_option('shrazen_settings', array());
        $value = isset($options['api_url']) ? $options['api_url'] : 'https://player.shrazen.com';
        echo '<input type="url" name="shrazen_settings[api_url]" value="' . esc_attr($value) . '" class="regular-text">';
        echo '<p class="description">Leave as default unless using a custom domain.</p>';
    }

    public function render_brand_name_field() {
        $options = get_option('shrazen_settings', array());
        $value = isset($options['brand_name']) ? $options['brand_name'] : get_bloginfo('name');
        echo '<input type="text" name="shrazen_settings[brand_name]" value="' . esc_attr($value) . '" class="regular-text">';
        echo '<p class="description">Shown in the player top bar badge.</p>';
    }

    public function render_primary_color_field() {
        $options = get_option('shrazen_settings', array());
        $value = isset($options['primary_color']) ? $options['primary_color'] : '#ef4444';
        echo '<input type="color" name="shrazen_settings[primary_color]" value="' . esc_attr($value) . '"> ';
        echo '<input type="text" name="shrazen_settings[primary_color]" value="' . esc_attr($value) . '" class="small-text" pattern="^#[0-9A-Fa-f]{6}$">';
        echo '<p class="description">Play button and progress bar color.</p>';
    }

    public function render_border_radius_field() {
        $options = get_option('shrazen_settings', array());
        $value = isset($options['border_radius']) ? $options['border_radius'] : '0';
        echo '<input type="number" name="shrazen_settings[border_radius]" value="' . esc_attr($value) . '" class="small-text" min="0" max="50"> px';
        echo '<p class="description">Set to 0 for strictly square, or increase for rounded corners.</p>';
    }

    public function sanitize_settings($input) {
        $sanitized = array();
        $sanitized['installation_id'] = sanitize_text_field($input['installation_id'] ?? '');
        $sanitized['api_url'] = esc_url_raw($input['api_url'] ?? 'https://player.shrazen.com');
        $sanitized['brand_name'] = sanitize_text_field($input['brand_name'] ?? '');
        $sanitized['primary_color'] = preg_match('/^#[0-9A-Fa-f]{6}$/', $input['primary_color'] ?? '') ? $input['primary_color'] : '#ef4444';
        $sanitized['border_radius'] = absint($input['border_radius'] ?? 0);
        return $sanitized;
    }

    public function render_admin_page() {
        if (!current_user_can('manage_options')) return;
        ?>
        <div class="wrap">
            <h1>Shrazen Player Settings</h1>
            <form method="post" action="options.php">
                <?php
                settings_fields('shrazen_settings');
                do_settings_sections('shrazen-player');
                submit_button();
                ?>
            </form>

            <hr>

            <h2>How It Works</h2>
            <ol>
                <li>Get your <strong>Installation ID</strong> from the <a href="https://player.shrazen.com/dashboard" target="_blank">Shrazen Dashboard</a></li>
                <li>Enter the Installation ID above and save</li>
                <li>All YouTube embeds on your site will automatically use the Shrazen Player!</li>
            </ol>

            <h3>Features</h3>
            <ul>
                <li>Custom branding with your brand name and colors</li>
                <li>Lead capture gates (requires Shrazen Pro plan)</li>
                <li>Analytics tracking</li>
                <li>Square (default) or rounded corners</li>
            </ul>
        </div>
        <?php
    }

    // AJAX handlers
    public function ajax_get_installations() {
        check_ajax_referer('shrazen_nonce');

        $response = wp_remote_get('https://player.shrazen.com/api/installations', array(
            'headers' => array(
                'Authorization' => 'Bearer ' . ($this->options['api_key'] ?? '')
            )
        ));

        if (is_wp_error($response)) {
            wp_send_json_error('Failed to fetch installations');
        }

        wp_send_json_success(json_decode(wp_remote_retrieve_body($response), true));
    }

    public function ajax_save_settings() {
        check_ajax_referer('shrazen_nonce');

        if (!current_user_can('manage_options')) {
            wp_send_json_error('Unauthorized');
        }

        $settings = $_POST['settings'] ?? array();
        update_option('shrazen_settings', $settings);

        wp_send_json_success('Settings saved');
    }

    public function ajax_create_installation() {
        check_ajax_referer('shrazen_nonce');

        if (!current_user_can('manage_options')) {
            wp_send_json_error('Unauthorized');
        }

        $domain = parse_url(home_url(), PHP_URL_HOST);

        $response = wp_remote_post('https://player.shrazen.com/api/installations', array(
            'method' => 'POST',
            'headers' => array('Content-Type' => 'application/json'),
            'body' => json_encode(array(
                'domain' => $domain,
                'platform' => 'wordpress'
            ))
        ));

        if (is_wp_error($response)) {
            wp_send_json_error('Failed to create installation');
        }

        $body = json_decode(wp_remote_retrieve_body($response), true);
        $this->options['installation_id'] = $body['id'] ?? '';
        update_option('shrazen_settings', $this->options);

        wp_send_json_success($body);
    }
}

// Initialize
new Shrazen_Player();