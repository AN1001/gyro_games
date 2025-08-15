import { orientation_data, accelerometer_data } from './sensor_methods.js';

const main_area = document.getElementById("game");

export function init_game() {
  main_area.style.display = "block";
  const scene = new THREE.Scene();

  // Create a camera (field of view, aspect ratio, near, far clipping planes)
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

  // Create a renderer
  const canvas = document.getElementById('game');
  const renderer = new THREE.WebGLRenderer({ canvas: canvas });
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);

  // Create a cube
  const geometry = new THREE.BoxGeometry();
  const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
  const cube = new THREE.Mesh(geometry, material);
  scene.add(cube);

  // Position the camera
  camera.position.z = 5;

  function animate() {
    requestAnimationFrame(animate);

    cube.rotation.x = orientation_data.alpha;
    cube.rotation.y = orientation_data.beta;

    renderer.render(scene, camera);
  }

  animate(orientation_data);
}

export function init_controller() {
  main_area.style.display = "block";
}