
# WebAssembly Files for IFC.js

Este directorio debe contener los módulos WebAssembly requeridos por web-ifc-viewer.

Archivos necesarios:
- web-ifc.wasm
- web-ifc-mt.wasm
- web-ifc.worker.js
- web-ifc-mt.worker.js

## Cómo obtener estos archivos

Opción 1: Copiar desde node_modules:
```
cp node_modules/web-ifc/*.wasm public/wasm/
cp node_modules/web-ifc/*.worker.js public/wasm/
```

Opción 2: Descargar desde CDN:
- https://unpkg.com/web-ifc@0.0.x/dist/web-ifc.wasm
- https://unpkg.com/web-ifc@0.0.x/dist/web-ifc-mt.wasm
- https://unpkg.com/web-ifc@0.0.x/dist/web-ifc.worker.js
- https://unpkg.com/web-ifc@0.0.x/dist/web-ifc-mt.worker.js

Reemplaza x con el número de versión que coincida con tu dependencia web-ifc-viewer.
