
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Add alias for BatchedMesh to fix three-mesh-bvh issue
      'three-mesh-bvh/src/utils/ExtensionUtilities.js': path.resolve(__dirname, 'node_modules/three-mesh-bvh/src/utils/ExtensionUtilities.js')
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      // Add empty exports to handle missing BatchedMesh
      define: {
        'THREE.BatchedMesh': 'undefined',
      }
    }
  }
}));
