import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: [
    'react',
    'react-native',
    'expo',
    'expo-modules-core',
    'expo-secure-store',
    'expo-local-authentication',
    'expo-notifications',
    'expo-camera',
    'expo-barcode-scanner',
  ],
  treeshake: true,
});
