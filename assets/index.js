if (
    DeviceMotionEvent &&
    typeof DeviceMotionEvent.requestPermission === "function"
) {
    DeviceMotionEvent.requestPermission();
}
document.getElementById('request_access').addEventListener('click', function () {
    DeviceMotionEvent.requestPermission();
});

//Handle Sensor Data
let accelerometer_data = { x: 0, y: 0, z: 0 };
let orientation_data = { alpha: 0, beta: 0, gamma: 0 };

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

//WebRTC
let peerConnection = new RTCPeerConnection({
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" }
    ]
});

let dataChannel;

let init = async () => {
    console.log("Initializing WebRTC for data transmission...");

    peerConnection.oniceconnectionstatechange = () => {
        console.log("ICE connection state:", peerConnection.iceConnectionState);
    };

    peerConnection.onicecandidateerror = (event) => {
        console.error("ICE candidate error:", event);
    };

    peerConnection.ondatachannel = (event) => {
        console.log("Data channel received!");
        dataChannel = event.channel;
        setupDataChannelHandlers(dataChannel);
    };
}

let createOffer = async () => {
    // Create a data channel (only needed by the offerer)
    dataChannel = peerConnection.createDataChannel("dataChannel");
    setupDataChannelHandlers(dataChannel);

    peerConnection.onicecandidate = async (event) => {
        if (event.candidate) {
            document.getElementById('offer-sdp').value = JSON.stringify(peerConnection.localDescription);
        }
    };

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
}

let generateOffer = async () => {
    // Create a data channel (only needed by the offerer)
    dataChannel = peerConnection.createDataChannel("dataChannel");
    setupDataChannelHandlers(dataChannel);

    peerConnection.onicecandidate = async (event) => {
        if (event.candidate) {
            const DATA = { "SDP_OFFER": peerConnection.localDescription }
            store_offer(DATA);
        }
    };

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
}

let createAnswer = async () => {
    let offer = JSON.parse(document.getElementById('offer-sdp').value);

    peerConnection.onicecandidate = async (event) => {
        if (event.candidate) {
            console.log('Adding answer candidate...:', event.candidate);
            document.getElementById('answer-sdp').value = JSON.stringify(peerConnection.localDescription);
        }
    };

    await peerConnection.setRemoteDescription(offer);

    let answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
}

let addAnswer = async () => {
    console.log('Add answer triggered');
    let answer = JSON.parse(document.getElementById('answer-sdp').value);
    console.log('answer:', answer);
    if (!peerConnection.currentRemoteDescription) {
        peerConnection.setRemoteDescription(answer);
    }
}

// Helper function to set up data channel event handlers
function setupDataChannelHandlers(channel) {
    channel.onopen = () => {
        console.log("Data channel opened!");
        // You can now send data through the channel
    };

    channel.onclose = () => {
        console.log("Data channel closed!");
    };

    channel.onmessage = (event) => {
        console.log("Received data:", event.data);
        // Display received data in the UI
        document.getElementById('received-data').textContent = event.data;
        console.log(event.data);
    };
}

// Function to send data through the data channel
function sendData(data_to_send) {
    if (dataChannel && dataChannel.readyState === "open") {
        dataChannel.send(data_to_send);
    } else {
        console.log("Data channel not ready yet");
    }
}

var fpsInterval, startTime, now, then, elapsed;
function start_data_stream(updates_per_second) {
    fpsInterval = 1000 / updates_per_second;
    then = Date.now();
    startTime = then;
    send_data_stream();
}
function send_data_stream() {
    requestAnimationFrame(send_data_stream);
    now = Date.now();
    elapsed = now - then;

    if (elapsed > fpsInterval) {
        then = now - (elapsed % fpsInterval);

        document.getElementById("Orientation_a").textContent = orientation_data.alpha;
        sendData(orientation_data.alpha);
    }
}

init();

document.getElementById('create-offer').addEventListener('click', createOffer);
document.getElementById('create-answer').addEventListener('click', createAnswer);
document.getElementById('add-answer').addEventListener('click', addAnswer);

window.addEventListener('beforeunload', () => {
    if (dataChannel) dataChannel.close();
    if (peerConnection) peerConnection.close();
});

start_data_stream(10);


document.getElementById('gen_code').addEventListener('click', generateOffer);

async function store_offer(BODY) {
    const url = "https://gyrogames.arnavium.workers.dev/api/";
    const options = {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(BODY) // Convert the object to a JSON string
    };

    fetch(url, options)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.text(); // or response.text() if not JSON
        })
        .then(data => {
            console.log("Success:", data);
        })
        .catch(error => {
            console.error("Error:", error);
        });
}