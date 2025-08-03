if (
    DeviceMotionEvent &&
    typeof DeviceMotionEvent.requestPermission === "function"
) {
    DeviceMotionEvent.requestPermission();
}

var accelerometer_x = 0;
var accelerometer_y = 0;
var accelerometer_z = 0;
var orientation_x = 0;
var orientation_y = 0;
var orientation_z = 0;

window.addEventListener("devicemotion", updateMotion);
window.addEventListener("deviceorientation", updateOrientation);

function updateMotion(event) {
    accelerometer_x = event.acceleration.x;
    document.getElementById("Accelerometer_x").innerHTML = accelerometer_x;
}

function updateOrientation(event) {
    orientation_a = event.alpha;
    document.getElementById("Orientation_a").innerHTML = orientation_a;
}


