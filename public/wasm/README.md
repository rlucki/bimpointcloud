
# WebAssembly Files for IFC.js

This directory contains the WebAssembly modules required by web-ifc-viewer.

Required files:
- web-ifc.wasm
- web-ifc-mt.wasm
- web-ifc.worker.js
- web-ifc-mt.worker.js

These files should be copied from the web-ifc-viewer or web-ifc distribution packages.

## How to get these files

Option 1: Copy from node_modules:
```
cp node_modules/web-ifc/*.wasm public/wasm/
cp node_modules/web-ifc/*.worker.js public/wasm/
```

Option 2: Download from CDN:
- https://unpkg.com/web-ifc@0.0.x/dist/web-ifc.wasm
- https://unpkg.com/web-ifc@0.0.x/dist/web-ifc-mt.wasm
- https://unpkg.com/web-ifc@0.0.x/dist/web-ifc.worker.js
- https://unpkg.com/web-ifc@0.0.x/dist/web-ifc-mt.worker.js

Replace x with the version number that matches your web-ifc-viewer dependency.
