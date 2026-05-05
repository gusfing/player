# Shrazen Player WordPress Plugin

A WordPress plugin that replaces YouTube embeds with a custom branded player featuring lead gates, analytics, and white-label branding.

## Installation

### Method 1: Upload via WordPress Admin

1. Download the `shrazen-player.php` file
2. Go to **Plugins > Add New > Upload Plugin**
3. Choose the file and click **Install Now**
4. Activate the plugin

### Method 2: Manual Upload

1. Create a folder named `shrazen-player` in `/wp-content/plugins/`
2. Upload `shrazen-player.php` to that folder
3. Go to **Plugins** and activate **Shrazen Player**

## Configuration

1. Go to **Settings > Shrazen Player**
2. Enter your **Installation ID** from your [Shrazen Dashboard](https://player.shrazen.com/dashboard)
3. Customize:
   - **Brand Name** - Shown in the player top bar
   - **Primary Color** - Play button and progress bar color
   - **Border Radius** - Set to 0 for strictly square, or increase for rounded corners
4. Click **Save Changes**

## Features

- **Automatic Enhancement**: All YouTube embeds are automatically upgraded
- **Custom Branding**: Your brand name displayed in the player
- **Lead Capture Gates**: Capture emails before video playback (Pro plan)
- **Analytics**: Track video views and engagement
- **Strictly Square Design**: Clean, modern appearance by default
- **Keyboard Shortcuts**: Space/K to play/pause, M to mute, F for fullscreen
- **Responsive**: Works on all devices

## Supported Platforms

Works with all WordPress themes and page builders:
- Default WordPress editor (Gutenberg)
- Elementor
- Divi
- Beaver Builder
- WP Bakery
- Classic Editor

## How It Works

The plugin uses the YouTube IFrame API to replace standard YouTube embeds with a custom-styled player:

1. Scans page for YouTube iframes
2. Replaces them with a custom shell
3. Loads YouTube video via IFrame API
4. Adds custom controls, branding, and lead capture

## Requirements

- WordPress 5.0 or higher
- PHP 7.4 or higher
- Shrazen account with valid Installation ID

## Support

For questions or issues, visit [shrazen.com](https://shrazen.com) or contact support.

## Changelog

### 1.0.0
- Initial release
- Custom branded player
- Lead capture gates
- Analytics tracking
- Square and rounded corner options