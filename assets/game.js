const main_area = document.getElementById("game");
const local_orientation_data = { alpha: 0, beta: 0, gamma: 0, neutral: 0 };

export function update_orientation_data(orientation_data) {
  local_orientation_data.alpha = orientation_data.alpha;
  local_orientation_data.beta = orientation_data.beta;
  local_orientation_data.gamma = orientation_data.gamma;
  local_orientation_data.neutral = orientation_data.neutral;
}

export function init_game() {
  main_area.style.display = "block";
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87CEEB); // Sky blue

  // Camera setup
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(5, 5, 5);
  camera.lookAt(0, 0, 0);

  // Renderer setup
  const canvas = document.getElementById('game');
  const renderer = new THREE.WebGLRenderer({ canvas: canvas });
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);

  // Lighting
  const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(10, 10, 5);
  scene.add(directionalLight);

  // Create the ground plane
  const planeGeometry = new THREE.PlaneGeometry(100, 100);
  const planeMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 }); // Forest green
  const plane = new THREE.Mesh(planeGeometry, planeMaterial);
  plane.rotation.x = -Math.PI / 2;
  scene.add(plane);

  // Create simple circular race track

  const trackPoints = [
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(15, 0, 5),
    new THREE.Vector3(20, 0, 15),
    new THREE.Vector3(10, 0, 25),
    new THREE.Vector3(-5, 0, 30),
    new THREE.Vector3(-15, 0, 20),
    new THREE.Vector3(-20, 0, 5),
    new THREE.Vector3(-10, 0, -5),
  ];

  // Create a smooth curve through these points
  const curve = new THREE.CatmullRomCurve3(trackPoints);
  curve.closed = true; // Makes it loop back to start
  curve.tension = 0.5; // Controls how tight/loose the curves are (0-1)

  // Sample points along the curve
  const trackWidth = 5
  const trackMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });

  // Create track cross-section shape
  const trackShape = new THREE.Shape();
  trackShape.moveTo(0, -trackWidth / 2);
  trackShape.lineTo(0.1, -trackWidth / 2);
  trackShape.lineTo(0.1, trackWidth / 2);
  trackShape.lineTo(0, trackWidth / 2);
  trackShape.closePath();

  // Extrude the shape along the curve
  const extrudeSettings = {
    steps: 100,
    bevelEnabled: false,
    extrudePath: curve
  };

  const trackGeometry = new THREE.ExtrudeGeometry(trackShape, extrudeSettings);
  const track = new THREE.Mesh(trackGeometry, trackMaterial);
  track.position.y = 0.05;
  scene.add(track);



  // Create the car
  const car = new THREE.Group();

  // Simple car body (half as wide)
  const bodyGeometry = new THREE.BoxGeometry(1, 0.5, 1);
  const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x4444ff }); // Blue
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.position.y = 0.5;
  car.add(body);

  // Wheels
  const wheelGeometry = new THREE.CylinderGeometry(0.25, 0.25, 0.15, 12);
  const wheelMaterial = new THREE.MeshLambertMaterial({ color: 0x222222 }); // Dark gray

  // Front wheels (closer together due to narrower car)
  const frontLeftWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
  frontLeftWheel.rotation.z = Math.PI / 2;
  frontLeftWheel.position.set(-0.6, 0.25, 0.4);
  car.add(frontLeftWheel);

  const frontRightWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
  frontRightWheel.rotation.z = Math.PI / 2;
  frontRightWheel.position.set(0.6, 0.25, 0.4);
  car.add(frontRightWheel);

  // Back wheels (closer together due to narrower car)
  const backLeftWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
  backLeftWheel.rotation.z = Math.PI / 2;
  backLeftWheel.position.set(-0.6, 0.25, -0.4);
  car.add(backLeftWheel);

  const backRightWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
  backRightWheel.rotation.z = Math.PI / 2;
  backRightWheel.position.set(0.6, 0.25, -0.4);
  car.add(backRightWheel);

  car.position.y = 0;
  scene.add(car);

  // Movement variables
  const moveSpeed = 0.15;
  const rotationSpeed = 0.03;
  let cubeRotation = 0; // Current rotation of the cube

  const cameraLag = 0.08; // How much lag the camera has (lower = more lag)

  // Handle window resize
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  function animate() {
    requestAnimationFrame(animate);

    // Handle car-like movement

    // Move forward in the direction the car is facing
    car.position.x += Math.sin(cubeRotation) * moveSpeed * get_acceleration(local_orientation_data.gamma);
    car.position.z += Math.cos(cubeRotation) * moveSpeed * get_acceleration(local_orientation_data.gamma);

    cubeRotation -= rotationSpeed * get_steer_direction(local_orientation_data.alpha, local_orientation_data.neutral);

    // Apply rotation to car
    car.rotation.y = cubeRotation;

    // Keep car within plane bounds
    const maxDistance = 45;
    car.position.x = Math.max(-maxDistance, Math.min(maxDistance, car.position.x));
    car.position.z = Math.max(-maxDistance, Math.min(maxDistance, car.position.z));

    // Update camera with simple lag
    const cameraDistance = 5;
    const cameraHeight = 3;

    // Calculate target position behind the car
    const targetX = car.position.x - Math.sin(cubeRotation) * cameraDistance;
    const targetZ = car.position.z - Math.cos(cubeRotation) * cameraDistance;
    const targetY = car.position.y + cameraHeight;

    // Smoothly move camera towards target position
    camera.position.x += (targetX - camera.position.x) * cameraLag;
    camera.position.y += (targetY - camera.position.y) * cameraLag;
    camera.position.z += (targetZ - camera.position.z) * cameraLag;

    // Always look at the car
    camera.lookAt(car.position);

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
    return (360 - diff) / 30
  }
  return -diff / 30
}
