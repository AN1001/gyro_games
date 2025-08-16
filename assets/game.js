const main_area = document.getElementById("game");
const local_orientation_data = { alpha: 0, beta: 0, gamma: 0 };
let neutral_alpha = 0;

export function update_orientation_data(orientation_data) {
  local_orientation_data.alpha = orientation_data.alpha;
  local_orientation_data.beta = orientation_data.beta;
  local_orientation_data.gamma = orientation_data.gamma;
}

export function init_game() {
  //main_area.style.display = "block";
  const scene = new THREE.Scene();

  // Create a camera (field of view, aspect ratio, near, far clipping planes)
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

  // Create a renderer
  const canvas = document.getElementById('game');
  const renderer = new THREE.WebGLRenderer({ canvas: canvas });
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);

  // Create a cube
  const materials = [
    new THREE.MeshBasicMaterial({ color: 0x00ff00 }), // Right
    new THREE.MeshBasicMaterial({ color: 0x00ff00 }), // Left
    new THREE.MeshBasicMaterial({ color: 0xff0000 }), // Top (red)
    new THREE.MeshBasicMaterial({ color: 0x00ff00 }), // Bottom
    new THREE.MeshBasicMaterial({ color: 0x00ff00 }), // Front
    new THREE.MeshBasicMaterial({ color: 0x00ff00 })  // Back
  ];

  const cube = new THREE.Mesh(new THREE.BoxGeometry(), materials);
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

    console.log(get_steer_direction(local_orientation_data.alpha, neutral_alpha), get_acceleration(local_orientation_data.gamma));

    renderer.render(scene, camera);
  }

  animate();
}

export function init_controller() {
  //main_area.style.display = "block";
}

function get_acceleration(gamma){
  if(gamma>0){
    return Math.max((gamma-90)/30, -1);
  } else {
    return Math.min((gamma+90)/45, 1)
  }
}

export function get_steer_direction(alpha, neutral_alpha){
    let diff = alpha-neutral_alpha;
    if(diff>180){
        return diff-360
    }
    return diff
}

function set_neutral(){
    neutral_alpha = local_orientation_data.alpha;
}
document.getElementById('set_neutral').addEventListener('click', set_neutral);