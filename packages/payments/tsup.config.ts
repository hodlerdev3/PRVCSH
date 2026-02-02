import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/types/index.ts',
    'src/merchant/index.ts',
    'src/invoices/index.ts',
    'src/links/index.ts',
    'src/pdf/index.ts',
    'src/email/index.ts',
    'src/webhooks/index.ts',
    'src/events/index.ts',
    'src/queue/index.ts',
    'src/refunds/index.ts',
    'src/sdk/index.ts',
    'src/react/index.ts',
    'src/checkout/index.ts',
  ],
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  treeshake: true,
  minify: false,
  target: 'es2022',
  outDir: 'dist',
});
