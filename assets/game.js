const main_area = document.getElementById("game");
const local_orientation_data = { alpha: 0, beta: 0, gamma: 0, neutral: 0 };

export function update_orientation_data(orientation_data) {
  local_orientation_data.alpha = orientation_data.alpha;
  local_orientation_data.beta = orientation_data.beta;
  local_orientation_data.gamma = orientation_data.gamma;
  local_orientation_data.neutral = orientation_data.neutral;
}

export function init_game() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87CEEB); // Sky blue

  // Camera setup
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(5, 5, 5);
  camera.lookAt(0, 0, 0);

  // Renderer setup
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.body.appendChild(renderer.domElement);

  // Lighting
  const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(10, 10, 5);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;
  scene.add(ambientLight);
  scene.add(directionalLight);

  // Create the ground plane
  const planeGeometry = new THREE.PlaneGeometry(100, 100);
  const planeMaterial = new THREE.MeshLambertMaterial({ color: 0x90EE90 }); // Light green
  const plane = new THREE.Mesh(planeGeometry, planeMaterial);
  plane.rotation.x = -Math.PI / 2;
  plane.receiveShadow = true;
  scene.add(plane);

  // Create the cube
  const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
  const cubeMaterial = new THREE.MeshLambertMaterial({ color: 0xff6b35 }); // Orange
  const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
  cube.position.y = 0.5; // Position above the plane
  cube.castShadow = true;
  scene.add(cube);

  // Movement variables
  const moveSpeed = 0.15;
  const rotationSpeed = 0.03;
  let cubeRotation = 0; // Current rotation of the cube
  const keys = {
    up: false,
    down: false,
    left: false,
    right: false
  };

  // Keyboard event listeners
  document.addEventListener('keydown', (event) => {
    switch (event.code) {
      case 'ArrowUp':
        keys.up = true;
        event.preventDefault();
        break;
      case 'ArrowDown':
        keys.down = true;
        event.preventDefault();
        break;
      case 'ArrowLeft':
        keys.left = true;
        event.preventDefault();
        break;
      case 'ArrowRight':
        keys.right = true;
        event.preventDefault();
        break;
    }
  });

  document.addEventListener('keyup', (event) => {
    switch (event.code) {
      case 'ArrowUp':
        keys.up = false;
        event.preventDefault();
        break;
      case 'ArrowDown':
        keys.down = false;
        event.preventDefault();
        break;
      case 'ArrowLeft':
        keys.left = false;
        event.preventDefault();
        break;
      case 'ArrowRight':
        keys.right = false;
        event.preventDefault();
        break;
    }
  });

  function animate() {
    requestAnimationFrame(animate);

    // Handle car-like movement
    let isMoving = false;

    if (keys.up) {
      // Move forward in the direction the cube is facing
      cube.position.x += Math.sin(cubeRotation) * moveSpeed;
      cube.position.z += Math.cos(cubeRotation) * moveSpeed;
      isMoving = true;
    }
    if (keys.down) {
      // Move backward
      cube.position.x -= Math.sin(cubeRotation) * moveSpeed;
      cube.position.z -= Math.cos(cubeRotation) * moveSpeed;
      isMoving = true;
    }

    // Only allow steering when moving
    if (isMoving) {
      if (keys.left) {
        cubeRotation += rotationSpeed;
      }
      if (keys.right) {
        cubeRotation -= rotationSpeed;
      }
    }

    // Apply rotation to cube
    cube.rotation.y = cubeRotation;

    // Keep cube within plane bounds
    const maxDistance = 45;
    cube.position.x = Math.max(-maxDistance, Math.min(maxDistance, cube.position.x));
    cube.position.z = Math.max(-maxDistance, Math.min(maxDistance, cube.position.z));

    // Update camera to follow the cube (optional - you can remove this for fixed camera)
    camera.position.x = cube.position.x + 5;
    camera.position.z = cube.position.z + 5;
    camera.lookAt(cube.position);

    renderer.render(scene, camera);
  }

  animate();
}

export function init_controller() {
  //main_area.style.display = "block";
}

function get_acceleration(gamma) {
  if (gamma > 0) {
    return Math.max((gamma - 90) / 30, -1);
  } else {
    return Math.min((gamma + 90) / 45, 1)
  }
}

function get_steer_direction(alpha, neutral_alpha) {
  let diff = alpha - neutral_alpha;
  if (diff > 180) {
    return 360 - diff
  }
  return -diff
}
