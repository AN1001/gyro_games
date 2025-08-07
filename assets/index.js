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

let createOffer = async () => {
    // Create a data channel (only needed by the offerer)
    dataChannel = peerConnection.createDataChannel("dataChannel");
    setupDataChannelHandlers(dataChannel);

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    document.getElementById('offer-sdp').value = JSON.stringify(peerConnection.localDescription);
    console.log(offer);

    const DATA = { "SDP_OFFER": peerConnection.localDescription }
    console.log(`Offer: ${JSON.stringify(peerConnection.localDescription)}`);
    let generated_code = await store_offer(DATA);
    document.getElementById("generated_code").textContent = generated_code;
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

let createAnswer = async () => {
    let offer = JSON.parse(document.getElementById('offer-sdp').value);
    code = document.getElementById('enter-code').value;
    let offer2 = await get_offer(code);
    console.log(JSON.stringify(offer),JSON.stringify(offer2))

    peerConnection.onicecandidate = async (event) => {
        if (event.candidate) {
            console.log('Adding answer candidate...:', event.candidate);
            document.getElementById('answer-sdp').value = JSON.stringify(peerConnection.localDescription);
        }
    };

    await peerConnection.setRemoteDescription(offer2);

    let answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    document.getElementById('answer-sdp').value = JSON.stringify(peerConnection.localDescription);
    let state = await store_answer(code, offer, peerConnection.localDescription.toJSON());
    if (state == "Ok") {
        console.log(`Answer: ${JSON.stringify(answer)}`)
    } else {
        document.getElementById('generated_code').textContent = "Invalid Code";
    }
}

let generateAnswer = async () => {
    code = document.getElementById('enter-code').value;
    //TODO error handle
    offer = await get_offer(code);

    await peerConnection.setRemoteDescription(offer);
    let answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    let state = await store_answer(code, offer, answer);
    if (state == "Ok") {
        console.log(`Answer: ${JSON.stringify(answer)}`)
    } else {
        document.getElementById('generated_code').textContent = "Invalid Code";
    }
}

let addAnswer = async () => {
    console.log('Add answer triggered');
    let answer = JSON.parse(document.getElementById('answer-sdp').value);
    let CODE = document.getElementById('generated_code').textContent;
    let answer2 = await get_answer(CODE);
    console.log(JSON.stringify(answer),JSON.stringify(answer2))

    console.log('answer:', answer);
    if (!peerConnection.currentRemoteDescription) {
        peerConnection.setRemoteDescription(answer);
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

        document.getElementById("Orientation_a").textContent = orientation_data.alpha;
        //sendData(orientation_data.alpha);
        sendData(Date.now());
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
            return "Error";
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
            return "Error";
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

async function get_answer_old(CODE) {
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
        return response.json();
    })
    .then(data => {
        console.log("Success");
        // Check if SDP_ANSWER is a string that needs parsing
        if (typeof data["SDP_ANSWER"] === 'string') {
            try {
                return JSON.parse(data["SDP_ANSWER"]);
            } catch (e) {
                console.warn("SDP_ANSWER wasn't valid JSON:", data["SDP_ANSWER"]);
                return data["SDP_ANSWER"]; // return as-is if not JSON
            }
        }
        // If it's already an object, return directly
        return data["SDP_ANSWER"];
    })
    .catch(error => {
        console.error("Error:", error);
        return { error: error.message }; // Better to return error object
    });
}

function on_receive_data(data) {
    document.getElementById('received-data').textContent = data;
}