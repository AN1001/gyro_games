//Handle Sensor Data
let accelerometer_data = { x: 0, y: 0, z: 0 };
let orientation_data = { alpha: 0, beta: 0, gamma: 0 };

document.addEventListener('DOMContentLoaded', function() {
    // Function to check if the device is mobile
    function isMobileDevice() {
        return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    }

    // Get all relevant elements
    const pc_code_box = document.getElementById('pc_code_box');
    const mobile_code_box = document.getElementById('mobile_code_box');
    const generatedCode = document.getElementById('generated_code');
    const genCode = document.getElementById('gen_code');
    const enterCode = document.getElementById('enter-code');
    const addCode = document.getElementById('add_code');
    const linkButton = document.getElementById('link_button');
    const Orientation = document.getElementById('orientation');
    const received_data = document.getElementById('received-data-holder');

    if (isMobileDevice()) {
        // Mobile behavior - only show enter-code and add_code
        if (pc_code_box) pc_code_box.style.display = 'none';
        if (received_data) received_data.style.display = 'none';
        if (enterCode) enterCode.style.display = 'block';
        if (addCode) addCode.style.display = 'block';
        
        // Hide all other elements
        if (generatedCode) generatedCode.style.display = 'none';
        if (genCode) genCode.style.display = 'none';
        if (linkButton) linkButton.style.display = 'none';
        
        // No click handlers for mobile
    } else {
        // PC behavior
        if (mobile_code_box) mobile_code_box.style.display = 'none';
        if (Orientation) Orientation.style.display = 'none';
        if (enterCode) enterCode.style.display = 'none';
        if (addCode) addCode.style.display = 'none';
        if (generatedCode) generatedCode.style.display = 'block';
        
        // Initially show gen_code and hide link_button on PC
        if (genCode) genCode.style.display = 'block';
        if (linkButton) linkButton.style.display = 'none';

        // When gen_code is clicked, hide it and show link_button
        if (genCode && linkButton) {
            genCode.addEventListener('click', function() {
                this.style.display = 'none';
                linkButton.style.display = 'block';
            });
            
            // No action when link_button is clicked (per request)
            linkButton.addEventListener('click', function(e) {
                e.preventDefault(); // Prevent any default behavior
                // No other action - button stays visible
            });
        }
    }
});
function request_access() {
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
        document.getElementById("generated_code").textContent = peerConnection.iceConnectionState;
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

let generateOffer = async () => {
    // Create a data channel (only needed by the offerer)
    dataChannel = peerConnection.createDataChannel("dataChannel");
    setupDataChannelHandlers(dataChannel);

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    const DATA = { "SDP_OFFER": peerConnection.localDescription }
    console.log(`Offer: ${JSON.stringify(peerConnection.localDescription)}`);
    let generated_code = await store_offer(DATA);
    document.getElementById("generated_code").textContent = generated_code;
}

let generateAnswer = async () => {
    request_access();
    code = document.getElementById('enter-code').value;
    offer = await get_offer(code);

    peerConnection.onicecandidate = async (event) => {
        if (!event.candidate) {
            console.log("ICE final added")
            code = document.getElementById('enter-code').value;
            let offer = await get_offer(code);

            let state = await store_answer(code, offer, peerConnection.localDescription.toJSON());
            if (state == "Ok") {
                console.log(`Store answer success`)
                document.getElementById("enter-code").value = '✅';
            } else {
                document.getElementById('generated_code').textContent = "Invalid Code";
            }
        }
    };

    if(offer!="ERR"){
        await peerConnection.setRemoteDescription(offer);
        let answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
    } else {
        console.log("Invalid Code")
        document.getElementById("enter-code").value = '';
        document.getElementById("enter-code").placeholder = 'Invalid';
    }
}

let SDP_link_start = async () => {
    console.log('Link Started');

    let CODE = document.getElementById('generated_code').textContent;
    let answer = await get_answer(CODE);
    console.log('answer:', JSON.stringify(answer));
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
        on_receive_data(event.data);
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

        document.getElementById("Orientation_a").textContent = orientation_data.alpha.toFixed(2);
        sendData(orientation_data.alpha);
    }
}

init();

window.addEventListener('beforeunload', () => {
    if (dataChannel) dataChannel.close();
    if (peerConnection) peerConnection.close();
});

const updates_per_second = 10;
start_data_stream(updates_per_second);

document.getElementById('gen_code').addEventListener('click', generateOffer);
document.getElementById('add_code').addEventListener('click', generateAnswer);
document.getElementById('link_button').addEventListener('click', SDP_link_start);

async function store_offer(BODY) {
    const url = "https://gyrogames.arnavium.workers.dev/api/";
    const options = {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(BODY) // Convert the object to a JSON string
    };

    return fetch(url, options)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.text(); // or response.text() if not JSON
        })
        .then(data => {
            console.log("Success:", data);
            return data;
        })
        .catch(error => {
            console.error("Error:", error);
            return "ERR";
        });
}

async function get_offer(CODE) {
    const url = "https://gyrogames.arnavium.workers.dev/api/";
    const options = {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "SDP_CODE": CODE,
        }
    };

    return fetch(url, options)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json(); // or response.text() if not JSON
        })
        .then(data => {
            console.log("Success");
            return data["SDP_OFFER"];
        })
        .catch(error => {
            console.error("Error:", error);
            return "ERR";
        });
}

async function store_answer(code, offer, answer) {
    const url = "https://gyrogames.arnavium.workers.dev/api/";
    const BODY = {
        "SDP_OFFER": offer,
        "SDP_ANSWER": answer
    }
    const options = {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "SDP_CODE": code,
        },
        body: JSON.stringify(BODY) // Convert the object to a JSON string
    };

    return fetch(url, options)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.text(); // or response.text() if not JSON
        })
        .then(data => {
            console.log("Success:", data);
            return data;
        })
        .catch(error => {
            console.error("Error:", error);
            return "Error";
        });
}

async function get_answer(CODE) {
    const url = "https://gyrogames.arnavium.workers.dev/api/";
    const options = {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "SDP_CODE": CODE,
        }
    };

    try {
        const response = await fetch(url, options);

        // First check HTTP status
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        // Get raw text first for debugging
        const responseText = await response.text();
        console.log("Raw API response:", responseText);

        // Parse once
        const data = JSON.parse(responseText);

        // Handle SDP_ANSWER
        const sdpAnswer = data.SDP_ANSWER;

        if (!sdpAnswer) {
            throw new Error("Missing SDP_ANSWER in response");
        }

        // Case 1: Already parsed object
        if (typeof sdpAnswer !== 'string') {
            return sdpAnswer;
        }

        // Case 2: String that needs parsing
        try {
            return JSON.parse(sdpAnswer);
        } catch (parseError) {
            console.warn("SDP_ANSWER wasn't valid JSON, returning raw:", sdpAnswer);
            return sdpAnswer;
        }

    } catch (error) {
        console.error("get_answer failed:", error);
        return {
            error: true,
            message: error.message,
            rawError: error // Preserve original error
        };
    }
}

function on_receive_data(data) {
    document.getElementById('received-data').textContent = Number.parseFloat(data).toFixed(2);
}
