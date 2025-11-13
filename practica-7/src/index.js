import * as THREE from "three";
import { mat4 } from "gl-matrix";

let info;
//let flyControls;
let t0 = new Date();
let scene, renderer, camera, camcontrols;
let mapa,
  mapsx,
  mapsy,
  scale = 10; 
let moveUp = false;
let moveDown = false;
let minlon = -15.5268,
  maxlon = -15.3946;
let minlat = 28.0380,
  maxlat = 28.1919;

var modelMatrix;

let objetos = [];
const datosEstaciones = []; 

const GUAGUA_MUNICIPAL = 0xFFC300; 
const GUAGUA_GLOBAL = 0x0077FF; 

let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();


var camara = { 
  x: 0, 
  y: 0.5, 
  z: 10, 
  ori: -Math.PI / 2
};
var velocity = 0.1;

init();
animate();
movCamara();

function init() {
  
  info = document.createElement("div");
  info.innerHTML = "three.js - FlyControls";
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.z = 7;

  renderer = new THREE.WebGLRenderer({ antialias: true }); 
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.7); 
  scene.add(ambientLight);


  window.addEventListener('click', onSphereClick, false);
  
  const tx1 = new THREE.TextureLoader().load(
    "src/mapa palmas.png",

    function (texture) {
      
      texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
      
      const txaspectRatio = texture.image.width / texture.image.height;
      mapsy = scale;
      mapsx = mapsy * txaspectRatio;
      Plano(0, 0, 0, mapsx, mapsy);

      mapa.material.map = texture;
      mapa.material.needsUpdate = true;

      fetch("src/export.json") 
        .then((response) => {
          if (!response.ok) {
            throw new Error("Error: " + response.statusText);
          }
          return response.json(); 
        })
        .then((data) => {
          procesarJSONEstaciones(data); 
        })
        .catch((error) => {
          console.error("Error al cargar el archivo JSON:", error);
        });
    }
  );
}

function onSphereClick(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(objetos);

    if (intersects.length > 0) {
        const hitObject = intersects[0].object;
        const info = hitObject.userData;

        let infoText = `Información de la Parada\n`;
        infoText += `Estación: ${info.name || 'N/D'}\n`;
        
        alert(infoText);
    }
}
function movCamara(){
  
  modelMatrix = mat4.create();
  mat4.identity(modelMatrix);

  const eye = [camara.x, camara.y, camara.z];
  const center = [
    camara.x + Math.cos(camara.ori), 
    camara.y, 
    camara.z + Math.sin(camara.ori)
  ];
  mat4.lookAt(modelMatrix, eye, center, [0, 1, 0]);

}
function procesarJSONEstaciones(data) {
  const estaciones = data.elements;

  estaciones.forEach(elemento => {
    if (elemento.type === 'node' && elemento.lat && elemento.lon && elemento.tags && elemento.tags.name) {
      
      const lat = elemento.lat;
      const lon = elemento.lon;

      let color;
      if (elemento.tags.operator && 
        (elemento.tags.operator.includes("Guaguas Municipales S.A.") || 
         elemento.tags.operator.includes("Guaguas Municipales"))){
          color = GUAGUA_MUNICIPAL; 
      } else {
          color = GUAGUA_GLOBAL; 
      }

      let mlon = Map2Range(
        lon,
        minlon,
        maxlon,
        -mapsx / 2,
        mapsx / 2
      );

      let mlat = Map2Range(
        lat,
        minlat,
        maxlat,
        -mapsy / 2,
        mapsy / 2
      );
      
      Esfera(mlon, mlat, 0.01, 0.01, 10, 10, color, elemento.tags); 
    }
  });
}




function Map2Range(val, vmin, vmax, dmin, dmax) {
  let t = 1 - (vmax - val) / (vmax - vmin);
  return dmin + t * (dmax - dmin);
}

function Esfera(px, py, pz, radio, nx, ny, col, data) { 
  let geometry = new THREE.SphereGeometry(radio, nx, ny); 
  let material = new THREE.MeshBasicMaterial({
    color: col,
  });
  let mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(px, py, pz);
  
  mesh.userData = data; 
  
  objetos.push(mesh);
  scene.add(mesh);
}

function Plano(px, py, pz, sx, sy) {
  let geometry = new THREE.PlaneGeometry(sx, sy);
  let material = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }); 
  let mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(px, py, pz);
  scene.add(mesh);
  mapa = mesh;
}

function animate() {
  
  let t1 = new Date();
  let secs = (t1 - t0) / 1000;

  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

document.onkeydown = onKeyDown;

function onKeyDown(key) {
  switch (key.keyCode) {
    // W - Avanzar
    case 87: {
      camera.position.z-=0.3;
      break;
    }

    // S - Retroceder
    case 83: {
      camera.position.z+=0.3;
      break;
    }

    // A - Rotar a la izquierda
    case 65: {
      camera.position.x -= 0.3;
      break;
    }

    // D - Rotar a la derecha
    case 68: {
      camera.position.x += 0.3;
      break;
    }

    // Flecha arriba - Mover hacia arriba
    case 38: {
      camera.position.y += 0.3;
      break;
    }

    // Flecha abajo - Mover hacia abajo
    case 40: {
      camera.position.y -= 0.3;
      break;
    }
  }
}


