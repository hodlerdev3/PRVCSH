import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'types/index': 'src/types/index.ts',
    'relayer/index': 'src/relayer/index.ts',
    'verifier/index': 'src/verifier/index.ts',
    'lockbox/index': 'src/lockbox/index.ts',
  },
  format: ['cjs', 'esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  treeshake: true,
  external: ['@solana/web3.js', 'ethers'],
});
