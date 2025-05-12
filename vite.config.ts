
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import fs from 'fs';
import type { Connect } from 'vite';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    // Asegurarse de que los archivos WASM se sirven con el tipo MIME correcto
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
    // Middleware personalizado para servir archivos WASM con el tipo MIME correcto
    middlewares: [
      (req: Connect.IncomingMessage, res: Connect.ServerResponse, next: Connect.NextFunction) => {
        if (req.url && req.url.endsWith('.wasm')) {
          // Establecer el tipo MIME correcto para archivos WASM
          res.setHeader('Content-Type', 'application/wasm');
        }
        next();
      }
    ]
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
    // Plugin personalizado para copiar archivos WASM al directorio de salida
    {
      name: 'copy-wasm-files',
      buildStart() {
        console.log('Copiando archivos WASM a public/wasm/...');
      }
    }
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Asegurarse de que los archivos WASM se tratan correctamente
  optimizeDeps: {
    exclude: ['web-ifc'],
  },
  // Configurar correctamente los tipos MIME
  assetsInclude: ['**/*.wasm'],
}));
