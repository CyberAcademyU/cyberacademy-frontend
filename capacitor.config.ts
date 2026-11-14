import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.cyberacademy.app',
  appName: 'CyberAcademy',
  webDir: 'dist/frontend/browser',
  // Assets locales, pero origen HTTPS del mismo sitio que la API para cookies Strict.
  // Requiere cap sync y recompilar el APK; no carga una web remota.
  server: {
    hostname: 'migueltalavera.site',
    androidScheme: 'https'
  },
  android: {
    backgroundColor: '#070709',
    allowMixedContent: false
  }
};

export default config;
