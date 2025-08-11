"use strict";
import {
    store_offer,
    get_offer,
    store_answer,
    get_answer
} from './database_methods.js';

//Handle Sensor Data
let accelerometer_data = { x: 0, y: 0, z: 0 };
let orientation_data = { alpha: 0, beta: 0, gamma: 0 };
let CURRENT_CODE = undefined;

const enterCode = document.getElementById('enter-code');
const received_data_text = document.getElementById('received-data');

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
const peerConnection = new RTCPeerConnection({
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" }
    ],
    iceTransportPolicy: "all",
    iceCandidatePoolSize: 0
});

window.addEventListener('beforeunload', () => {
    if (peerConnection) peerConnection.close();
});

let init = async () => {
    console.log("Initializing WebRTC for data transmission...");

    peerConnection.oniceconnectionstatechange = () => {
        console.log("ICE connection state:", peerConnection.iceConnectionState);
        document.getElementById("ice_connection_state_data").textContent = peerConnection.iceConnectionState;
    };

    peerConnection.onicecandidateerror = (event) => {
        console.error("ICE candidate error:", event);
    };

    peerConnection.onicecandidate = (e) => {
        if (e.candidate) {
            console.log("New candidate:", e.candidate.candidate); // Should show LAN IPs
        } else {
            console.log("All candidates gathered");
        }
    };

    peerConnection.ondatachannel = (event) => {
        console.log("Data channel received!");
        const data_channel = event.channel;
        setupDataChannelHandlers(data_channel);
    };
}

let generateOffer = async () => {
    const data_channel = peerConnection.createDataChannel("data_channel");
    setupDataChannelHandlers(data_channel);

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    await new Promise((resolve) => {
        if (peerConnection.iceGatheringState === "complete") {
            resolve();
        } else {
            peerConnection.onicegatheringstatechange = () => {
                if (peerConnection.iceGatheringState === "complete") {
                    console.log("ICE gathering complete");
                    resolve();
                }
            };
        }
    });

    const DATA = { "SDP_OFFER": peerConnection.localDescription }
    console.log(`Offer: ${JSON.stringify(peerConnection.localDescription)}`);
    let generated_code = await store_offer(DATA);
    document.getElementById('generated_code').textContent = generated_code;
    CURRENT_CODE = generated_code;
}

let generateAnswer = async () => {
    try {
        await request_access();

        CURRENT_CODE = enterCode.value;
        const offer = await get_offer(CURRENT_CODE);

        if (offer) {
            await peerConnection.setRemoteDescription(offer);
            let answer = await peerConnection.createAnswer();
            // Set local description (triggers ICE gathering)
            await peerConnection.setLocalDescription(answer);

            // Wait for ICE gathering to finish
            await new Promise((resolve) => {
                if (peerConnection.iceGatheringState === "complete") {
                    resolve();
                } else {
                    peerConnection.onicegatheringstatechange = () => {
                        if (peerConnection.iceGatheringState === "complete") {
                            console.log("ICE gathering complete");
                            resolve();
                        }
                    };
                }
            });

            console.log("Final SDP with all candidates:", peerConnection.localDescription.sdp);
            const state = await store_answer(CURRENT_CODE, offer, peerConnection.localDescription.toJSON());

            if (state === "Ok") {
                console.log(`Store answer success`);
                enterCode.value = '✅';
            } else {
                show_invalid_code();
            }
        } else {
            show_invalid_code();
        }
    } catch (err) {
        console.error(err);
        document.getElementById('error_box').value = err;
    }
};

function show_invalid_code() {
    console.log("Invalid Code");
    enterCode.value = 'Invalid';
    window.setTimeout(function () {
        enterCode.value = '';
    }, 500);
    enterCode.placeholder = 'Invalid';
}

let SDP_link_start = async () => {
    console.log('Link Started');

    let CODE = CURRENT_CODE;
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
        const updates_per_second = 10;
        start_data_stream(updates_per_second, channel);
        // You can now send data through the channel
    };

    channel.onclose = () => {
        console.log("Data channel closed!");
    };

    channel.onmessage = (event) => {
        on_receive_data(event.data);
    };

}

function sendData(data_to_send, data_channel) {
    if (data_channel && data_channel.readyState === "open") {
        data_channel.send(data_to_send);
    } else {
        console.log("Data channel not ready yet");
    }
}

let fpsInterval, now, then, elapsed;
function start_data_stream(updates_per_second, data_channel) {
    fpsInterval = 1000 / updates_per_second;
    then = Date.now();
    send_data_stream(data_channel);

    window.addEventListener('beforeunload', () => {
        if (data_channel) data_channel.close();
    });
}
function send_data_stream(data_channel) {
    requestAnimationFrame(send_data_stream);
    now = Date.now();
    elapsed = now - then;

    if (elapsed > fpsInterval) {
        then = now - (elapsed % fpsInterval);

        if (orientation_data.alpha) {
            document.getElementById("Orientation_a").textContent = orientation_data.alpha.toFixed(2);
            sendData(orientation_data.alpha, data_channel);
        }
    }
}

init();


document.getElementById('gen_code').addEventListener('click', generateOffer);
document.getElementById('add_code').addEventListener('click', generateAnswer);
document.getElementById('link_button').addEventListener('click', SDP_link_start);

function on_receive_data(data) {
    received_data_text.textContent = Number.parseFloat(data).toFixed(2);
}
