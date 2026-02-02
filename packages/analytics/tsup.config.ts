import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    aggregator: 'src/aggregator/index.ts',
    charts: 'src/charts/index.ts',
    ui: 'src/ui/index.tsx',
  },
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ['react', '@solana/web3.js'],
  treeshake: true,
});
