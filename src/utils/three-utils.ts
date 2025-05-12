
import * as THREE from 'three';

/**
 * Ajusta la cámara para enfocar un objeto 3D específico en la escena.
 * 
 * @param camera - La cámara a ajustar
 * @param controls - Los controles de órbita
 * @param object - El objeto a enfocar
 * @param fitOffset - Factor de offset para el ajuste
 */
export const fitCameraToObject = (
  camera: THREE.PerspectiveCamera, // Cambiado de THREE.Camera a THREE.PerspectiveCamera
  controls: any,
  object: THREE.Object3D,
  fitOffset = 1.2
) => {
  const box = new THREE.Box3();
  box.setFromObject(object);
  
  const center = new THREE.Vector3();
  box.getCenter(center);
  
  const size = new THREE.Vector3();
  box.getSize(size);
  
  // Calcular tamaño máximo y posición
  const maxSize = Math.max(size.x, size.y, size.z);
  const fitHeightDistance = maxSize / (2 * Math.tan(Math.PI * camera.fov / 360));
  const fitWidthDistance = fitHeightDistance / camera.aspect;
  const distance = fitOffset * Math.max(fitHeightDistance, fitWidthDistance);
  
  // Aplicar a los controles
  if (controls) {
    controls.target.copy(center);
    controls.maxDistance = distance * 10;
    
    // Posicionar la cámara en un ángulo isométrico
    const direction = new THREE.Vector3(1, 0.8, 1);
    direction.normalize();
    
    camera.position.copy(center.clone().add(direction.multiplyScalar(distance)));
    camera.lookAt(center);
    
    // Actualizar controles
    controls.update();
  }
};

/**
 * Crea un sistema de coordenadas visible en la escena.
 * 
 * @param size - Tamaño de los ejes
 * @returns Objeto 3D con los ejes
 */
export const createCoordinateSystem = (size = 1) => {
  const group = new THREE.Group();
  
  // Eje X - rojo
  const xAxis = new THREE.ArrowHelper(
    new THREE.Vector3(1, 0, 0),
    new THREE.Vector3(0, 0, 0),
    size,
    0xff0000
  );
  group.add(xAxis);
  
  // Eje Y - verde
  const yAxis = new THREE.ArrowHelper(
    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3(0, 0, 0),
    size,
    0x00ff00
  );
  group.add(yAxis);
  
  // Eje Z - azul
  const zAxis = new THREE.ArrowHelper(
    new THREE.Vector3(0, 0, 1),
    new THREE.Vector3(0, 0, 0),
    size,
    0x0000ff
  );
  group.add(zAxis);
  
  // Etiquetas
  const createLabel = (text: string, position: THREE.Vector3, color: string) => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    canvas.width = 64;
    canvas.height = 32;
    
    context.fillStyle = 'rgba(0, 0, 0, 0)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    context.font = '24px Arial';
    context.fillStyle = color;
    context.textAlign = 'center';
    context.fillText(text, canvas.width / 2, canvas.height / 2);
    
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(material);
    sprite.position.copy(position);
    sprite.scale.set(0.5, 0.25, 1);
    
    return sprite;
  };
  
  group.add(createLabel('X', new THREE.Vector3(size + 0.1, 0, 0), '#ff0000'));
  group.add(createLabel('Y', new THREE.Vector3(0, size + 0.1, 0), '#00ff00'));
  group.add(createLabel('Z', new THREE.Vector3(0, 0, size + 0.1), '#0000ff'));
  
  return group;
};

/**
 * Configura un renderizador con ajustes optimizados
 * 
 * @param renderer - El renderizador a configurar
 * @param container - Elemento contenedor HTML
 */
export const setupRenderer = (
  renderer: THREE.WebGLRenderer,
  container: HTMLElement
) => {
  // Configurar tamaño
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limitar para mejor rendimiento
  
  // Habilitar sombras
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  
  // Configurar color de fondo y tono
  renderer.setClearColor(0x222222);
  renderer.outputEncoding = THREE.sRGBEncoding;
  
  // Añadir al contenedor
  container.appendChild(renderer.domElement);
  
  return renderer;
};
