let fpsInterval, now, then, elapsed;

export function start_data_stream(updates_per_second, data_channel, orientation_data) {
    fpsInterval = 1000 / updates_per_second;
    then = Date.now();
    send_data_stream(data_channel, orientation_data);
}

function send_data_stream(data_channel, orientation_data) {
    requestAnimationFrame(() => send_data_stream(data_channel));
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

function sendData(data_to_send, data_channel) {
    if (data_channel && data_channel.readyState === "open") {
        data_channel.send(data_to_send);
    } else {
        console.log("Data channel not ready yet");
    }
}