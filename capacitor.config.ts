import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "app.lovable.lifeflow",
  appName: "LifeFlow AI",
  webDir: "dist",
  bundledWebRuntime: false,
  android: {
    allowMixedContent: false,
  },
  plugins: {
    LocalNotifications: {
      // Reliable Alarmy-style alarm channel: high importance, uses default
      // system alarm sound as fallback, respects Do Not Disturb bypass on
      // supported devices. Per-notification sound is overridden at schedule
      // time from the user's chosen ringtone.
      smallIcon: "ic_stat_icon_config_sample",
      iconColor: "#2E8B8B",
      sound: "alarm.wav",
    },
  },
};

export default config;