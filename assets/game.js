const main_area = document.getElementById("game");
const local_orientation_data = { alpha: 0, beta: 0, gamma: 0 };

export function update_orientation_data(orientation_data){
  local_orientation_data.alpha = orientation_data.alpha;
  local_orientation_data.beta = orientation_data.beta;
  local_orientation_data.gamma = orientation_data.gamma;
}

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
  const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
  const cube = new THREE.Mesh(geometry, material);
  scene.add(cube);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // Soft overall light
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1); // Main light source
  directionalLight.position.set(1, 1, 1);
  scene.add(directionalLight);

  // Position the camera
  camera.position.z = 5;

  function animate() {
    requestAnimationFrame(animate);

    cube.rotation.x = -THREE.MathUtils.degToRad(local_orientation_data.alpha);
    cube.rotation.y = THREE.MathUtils.degToRad(local_orientation_data.gamma);
    cube.rotation.z = THREE.MathUtils.degToRad(local_orientation_data.beta);

    renderer.render(scene, camera);
  }

  animate();
}

export function init_controller() {
  main_area.style.display = "block";
}