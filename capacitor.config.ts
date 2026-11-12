import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.cyberacademy.app',
  appName: 'CyberAcademy',
  webDir: 'dist/frontend/browser',
  // La app carga los archivos compilados dentro del WebView. El origen que ve
  // el backend es https://localhost, así que debe estar en CORS_ALLOWED_ORIGINS.
  server: {
    androidScheme: 'https'
  },
  android: {
    backgroundColor: '#070709',
    allowMixedContent: false
  }
};

export default config;
