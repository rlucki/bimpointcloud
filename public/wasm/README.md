
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
cp node_modules/web-ifc/dist/*.wasm public/wasm/
cp node_modules/web-ifc/dist/*.worker.js public/wasm/
```

Opción 2: Descargar desde CDN:
- https://unpkg.com/web-ifc@0.0.x/dist/web-ifc.wasm
- https://unpkg.com/web-ifc@0.0.x/dist/web-ifc-mt.wasm
- https://unpkg.com/web-ifc@0.0.x/dist/web-ifc.worker.js
- https://unpkg.com/web-ifc@0.0.x/dist/web-ifc-mt.worker.js

Reemplaza x con el número de versión que coincida con tu dependencia web-ifc-viewer.

## IMPORTANTE: Verificación de archivos

Para verificar que los archivos están correctamente instalados, puedes usar la siguiente solicitud HTTP:

```
HEAD /wasm/web-ifc.wasm
```

Si recibes un estado 200, los archivos están disponibles. Si recibes un 404, necesitas instalar los archivos manualmente.
