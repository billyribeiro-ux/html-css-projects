import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import fs from 'node:fs';

// Auto-discover all 40 project index.html entry points for Rollup MPA build
function getProjectEntries() {
  const entries = {
    main: resolve(__dirname, 'index.html')
  };
  const projectsDir = resolve(__dirname, 'projects');
  if (fs.existsSync(projectsDir)) {
    const folders = fs.readdirSync(projectsDir);
    for (const folder of folders) {
      const indexPath = resolve(projectsDir, folder, 'index.html');
      if (fs.existsSync(indexPath)) {
        // Use sanitized key for rollup entry
        const entryKey = folder.replace(/[^a-zA-Z0-9_-]/g, '_');
        entries[entryKey] = indexPath;
      }
    }
  }
  return entries;
}

export default defineConfig({
  root: '.',
  server: {
    port: 5173,
    open: false,
    host: true
  },
  build: {
    rollupOptions: {
      input: getProjectEntries()
    },
    outDir: 'dist',
    emptyOutDir: true
  }
});
