"use strict";
import { orientation_data, accelerometer_data, request_access } from './sensor_methods.js';
import { store_offer, get_offer, store_answer, get_answer } from './database_methods.js';
import { start_data_stream } from './streaming_methods.js';
import { init_controller, init_game, update_orientation_data } from './game.js';

const enterCode = document.getElementById('enter-code');
const received_data_text = document.getElementById('received-data');

function isMobile() {
    const regex = /Mobi|Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
    return regex.test(navigator.userAgent);
}

class webRTC_session {
    constructor() {
        this.peer_connection = null;
        this.data_channel = null;
        // ice_gathering_completion could be a problem if multiple answers generated
        this.ice_gathering_completion = null;
        this.CURRENT_CODE = null;
        this.iceCandidates = [];

        this.init();
        window.addEventListener('beforeunload', () => this.cleanup());
    }

    async init() {
        console.log("Initializing WebRTC for data transmission...");

        this.peer_connection = new RTCPeerConnection({
            iceServers: [
                { urls: "stun:stun.l.google.com:19302" },
                { urls: "stun:stun1.l.google.com:19302" },
                { urls: "stun:stun2.l.google.com:19302" }
            ],
            iceTransportPolicy: "all",
            iceCandidatePoolSize: 0
        });

        this.setupEventHandlers();
    }

    setupEventHandlers() {
        this.peer_connection.oniceconnectionstatechange = () => {
            document.getElementById("ice_connection_state_data").textContent = this.peer_connection.iceConnectionState;
            if (this.peer_connection.iceConnectionState === 'failed') {
                this.handleConnectionFailure();
            }
        };

        this.peer_connection.onicecandidateerror = (event) => {
            console.error("ICE candidate error:", event);
        };

        this.peer_connection.ondatachannel = (event) => {
            console.log("Data channel received!");
            this.data_channel = event.channel;
            this.setupDataChannelHandlers(this.data_channel);
        };

    }

    handleConnectionFailure() {
        //TODO
    }

    async generateOffer() {
        this.data_channel = this.peer_connection.createDataChannel("data_channel");
        this.setupDataChannelHandlers(this.data_channel);

        const offer = await this.peer_connection.createOffer();
        await this.peer_connection.setLocalDescription(offer);
        // Wait for ICE gathering to finish
        this.ice_gathering_completion = new Promise((resolve) => {
            if (this.peer_connection.iceGatheringState === "complete") {
                resolve();
            } else {
                this.peer_connection.onicegatheringstatechange = () => {
                    if (this.peer_connection.iceGatheringState === "complete") {
                        resolve();
                    }
                };
            }
        });
        await this.ice_gathering_completion;

        const DATA = { "SDP_OFFER": this.peer_connection.localDescription }
        console.log(`Offer: ${JSON.stringify(this.peer_connection.localDescription)}`);
        this.CURRENT_CODE = await store_offer(DATA);
        document.getElementById('generated_code').textContent = this.CURRENT_CODE;
    }

    async generateAnswer() {
        await request_access();

        this.CURRENT_CODE = enterCode.value;
        const offer = await get_offer(this.CURRENT_CODE);

        if (offer) {
            await this.peer_connection.setRemoteDescription(offer);
            let answer = await this.peer_connection.createAnswer();
            // Set local description (triggers ICE gathering)
            await this.peer_connection.setLocalDescription(answer);

            // Wait for ICE gathering to finish
            this.ice_gathering_completion = new Promise((resolve) => {
                if (this.peer_connection.iceGatheringState === "complete") {
                    resolve();
                } else {
                    this.peer_connection.onicegatheringstatechange = () => {
                        if (this.peer_connection.iceGatheringState === "complete") {
                            resolve();
                        }
                    };
                }
            });
            await this.ice_gathering_completion;

            console.log("Final SDP with all candidates:", this.peer_connection.localDescription.sdp);
            const state = await store_answer(this.CURRENT_CODE, offer, this.peer_connection.localDescription.toJSON());

            if (state === "Ok") {
                console.log(`Store answer success`);
                enterCode.value = '✅';
            } else {
                this.show_invalid_code();
            }
        } else {
            this.show_invalid_code();
        }
    };

    async SDP_link_start() {
        console.log('Link Started');

        let CODE = this.CURRENT_CODE;
        let answer = await get_answer(CODE);
        console.log('answer:', JSON.stringify(answer));
        if (!this.peer_connection.currentRemoteDescription) {
            this.peer_connection.setRemoteDescription(answer);
        }
    }

    // Helper functions
    setupDataChannelHandlers(channel) {
        channel.onopen = () => {
            console.log("Data channel opened!");
            const updates_per_second = 10;
            start_data_stream(updates_per_second, channel, orientation_data);
            // You can now send data through the channel
            if (isMobile()) {
                init_controller();
            } else {
                init_game(orientation_data);
            }
        };

        channel.onclose = () => {
            console.log("Data channel closed!");
        };

        channel.onmessage = (event) => {
            on_receive_data(event.data);
        };

    }
    show_invalid_code() {
        console.log("Invalid Code");
        enterCode.value = 'Invalid';
        window.setTimeout(function () {
            enterCode.value = '';
        }, 500);
        enterCode.placeholder = 'Invalid';
    }
    cleanup() {
        if (this.data_channel) {
            this.data_channel.close();
            this.data_channel = null;
        }
        if (this.peer_connection) {
            this.peer_connection.close();
            this.peer_connection = null;
        }
    }
}

const session = new webRTC_session();
document.getElementById('gen_code').addEventListener('click', () => session.generateOffer());
document.getElementById('add_code').addEventListener('click', () => session.generateAnswer());
document.getElementById('link_button').addEventListener('click', () => session.SDP_link_start());

function on_receive_data(received_orientation_data) {
    received_orientation_data = JSON.parse(received_orientation_data);
    received_data_text.textContent = Number.parseFloat(received_orientation_data.alpha).toFixed(2);
    update_orientation_data(received_orientation_data);
}

