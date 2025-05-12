
/**
 * Script para descargar los archivos WASM necesarios para el visualizador IFC
 * 
 * Este script puede ejecutarse con: node scripts/download-wasm-files.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const wasmFiles = [
  {
    url: 'https://raw.githubusercontent.com/IFCjs/web-ifc/main/web-ifc.wasm',
    destination: path.join(__dirname, '../public/wasm/web-ifc.wasm')
  },
  {
    url: 'https://raw.githubusercontent.com/IFCjs/web-ifc/main/web-ifc-mt.wasm',
    destination: path.join(__dirname, '../public/wasm/web-ifc-mt.wasm')
  }
];

// Crear el directorio si no existe
const wasmDir = path.join(__dirname, '../public/wasm');
if (!fs.existsSync(wasmDir)) {
  fs.mkdirSync(wasmDir, { recursive: true });
}

// Función para descargar un archivo
const downloadFile = (url, destination) => {
  return new Promise((resolve, reject) => {
    console.log(`Descargando ${url} a ${destination}...`);
    
    const file = fs.createWriteStream(destination);
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Error al descargar: ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log(`✓ Archivo descargado correctamente: ${destination}`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(destination, () => {}); // Eliminar archivo parcial
      console.error(`✗ Error al descargar: ${err.message}`);
      reject(err);
    });
  });
};

// Descargar todos los archivos WASM
const downloadAllFiles = async () => {
  console.log('Iniciando descarga de archivos WASM necesarios para IFC.js...');
  
  for (const file of wasmFiles) {
    try {
      await downloadFile(file.url, file.destination);
    } catch (error) {
      console.error(`Error al descargar ${file.url}: ${error.message}`);
    }
  }
  
  console.log('Proceso de descarga completado.');
  console.log('Si la descarga fue exitosa, los archivos WASM están listos para ser utilizados.');
};

// Ejecutar la descarga
downloadAllFiles();
