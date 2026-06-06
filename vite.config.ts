// Minimal Vite config with React and tsconfig path support.
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  resolve: {
    alias: {
      // Some @tanstack packages publish a broken/partial `exports` map on certain versions.
      // Force the resolver to use the legacy build which is present in node_modules.
      '@tanstack/query-core': path.resolve(
        __dirname,
        'node_modules/@tanstack/query-core/build/legacy/index.js',
      ),
      // Force-resolve seroval to the ESM production build present in node_modules.
      seroval: path.resolve(
        __dirname,
        'node_modules/seroval/dist/esm/production/index.mjs',
      ),
      'seroval-plugins/web': path.resolve(
        __dirname,
        'node_modules/seroval-plugins/web/index.ts',
      ),
    },
  },
  // Keep `tanstackStart` for compatibility if needed by other tooling.
  tanstackStart: {
    server: { entry: 'server' },
  },
});
