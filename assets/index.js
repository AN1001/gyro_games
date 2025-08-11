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

const pc_code_box = document.getElementById('pc_code_box');
const mobile_code_box = document.getElementById('mobile_code_box');
const generatedCode = document.getElementById('generated_code');
const genCode = document.getElementById('gen_code');
const enterCode = document.getElementById('enter-code');
const addCode = document.getElementById('add_code');
const linkButton = document.getElementById('link_button');
const Orientation = document.getElementById('orientation');
const received_data = document.getElementById('received-data-holder');
const received_data_text = document.getElementById('received-data');

document.addEventListener('DOMContentLoaded', function () {
    // Function to check if the device is mobile
    function isMobileDevice() {
        return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    }

    if (isMobileDevice()) {
        if (enterCode) enterCode.style.display = 'block';
        if (addCode) addCode.style.display = 'block';

        [pc_code_box, received_data, generatedCode, genCode, linkButton].forEach(function(el){
            if(el) el.style.display = 'none';
        })

    } else {
        [mobile_code_box, Orientation, enterCode, addCode, linkButton].forEach(function(el){
            if(el) el.style.display = 'none';
        })
        
        if (generatedCode) generatedCode.style.display = 'block';
        if (genCode) genCode.style.display = 'block';

        if (genCode && linkButton) {
            genCode.addEventListener('click', function () {
                this.style.display = 'none';
                linkButton.style.display = 'block';
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
    ],
    iceTransportPolicy: "all",
    iceCandidatePoolSize: 0
});

let dataChannel;

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
    generatedCode.textContent = generated_code;
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
            const state = await store_answer(code, offer, peerConnection.localDescription.toJSON());

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

let fpsInterval, now, then, elapsed;
function start_data_stream(updates_per_second) {
    fpsInterval = 1000 / updates_per_second;
    then = Date.now();
    send_data_stream();
}
function send_data_stream() {
    requestAnimationFrame(send_data_stream);
    now = Date.now();
    elapsed = now - then;

    if (elapsed > fpsInterval) {
        then = now - (elapsed % fpsInterval);

        if (orientation_data.alpha) {
            document.getElementById("Orientation_a").textContent = orientation_data.alpha.toFixed(2);
            sendData(orientation_data.alpha);
        }
    }
}

init();

window.addEventListener('beforeunload', () => {
    if (dataChannel) dataChannel.close();
    if (peerConnection) peerConnection.close();
});

const updates_per_second = 10;
start_data_stream(updates_per_second);

genCode.addEventListener('click', generateOffer);
addCode.addEventListener('click', generateAnswer);
linkButton.addEventListener('click', SDP_link_start);

function on_receive_data(data) {
    received_data_text.textContent = Number.parseFloat(data).toFixed(2);
}
