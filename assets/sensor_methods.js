export const accelerometer_data = { x: 0, y: 0, z: 0 };
export const orientation_data = { alpha: 0, beta: 0, gamma: 0 };

export function request_access() {
    if (
        DeviceMotionEvent &&
        typeof DeviceMotionEvent.requestPermission === "function"
    ) {
        DeviceMotionEvent.requestPermission();
    }
}
function updateMotion(event) {
    accelerometer_data.x = event.acceleration.x;
    accelerometer_data.y = event.acceleration.y;
    accelerometer_data.z = event.acceleration.z;
}
function updateOrientation(event) {
    orientation_data.alpha = event.alpha;
    orientation_data.beta = event.beta;
    orientation_data.gamma = event.gamma;
}


window.addEventListener("devicemotion", updateMotion);
window.addEventListener("deviceorientation", updateOrientation);