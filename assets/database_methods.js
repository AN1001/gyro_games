const API_BASE_URL = "https://gyrogames.arnavium.workers.dev/api/";

export async function store_offer(BODY) {
    const options = {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(BODY) // Convert the object to a JSON string
    };

    return fetch(API_BASE_URL, options)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.text(); // or response.text() if not JSON
        })
        .then(data => {
            return data;
        })
        .catch(error => {
            console.error("Error:", error);
            return "ERR";
        });
}

export async function get_offer(CODE) {
    const options = {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "SDP_CODE": CODE,
        }
    };

    return fetch(API_BASE_URL, options)
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
            return undefined;
        });
}

export async function store_answer(code, offer, answer) {
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
        body: JSON.stringify(BODY)
    };

    return fetch(API_BASE_URL, options)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.text();
        })
        .then(data => {
            return data;
        })
        .catch(error => {
            console.error("Error:", error);
            return "ERR";
        });
}

export async function get_answer(CODE) {
    const options = {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "SDP_CODE": CODE,
        }
    };

    const response = await fetch(API_BASE_URL, options);

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    // Get raw text first for debugging
    const responseText = await response.text();
    const data = JSON.parse(responseText);
    const sdpAnswer = data.SDP_ANSWER;

    if (!sdpAnswer) {
        throw new Error("Missing SDP_ANSWER in response");
    }

    if (typeof sdpAnswer !== 'string') {
        return sdpAnswer;
    } else {
        return JSON.parse(sdpAnswer);
    }

}