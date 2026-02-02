import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'types/index': 'src/types/index.ts',
    'governance/index': 'src/governance/index.ts',
    'voting/index': 'src/voting/index.ts',
    'timelock/index': 'src/timelock/index.ts',
    'delegation/index': 'src/delegation/index.ts',
  },
  format: ['cjs', 'esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  treeshake: true,
  external: ['@solana/web3.js'],
});
