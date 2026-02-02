import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/types/index.ts',
    'src/pool/index.ts',
    'src/swap/index.ts',
    'src/liquidity/index.ts',
    'src/router/index.ts',
  ],
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  treeshake: true,
  external: ['@solana/web3.js'],
});
