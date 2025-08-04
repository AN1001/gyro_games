import main from "main.html";

export default {
	async fetch(request, env, ctx) {
		const url = new URL(request.url);
		console.log(`Hello ${navigator.userAgent} at path ${url.pathname}!`);

		if (url.pathname === "/api") {
			// You could also call a third party API here
			const data = await import("./data.js");
			return Response.json(data);
		}
		return new Response(main, {
			headers: {
				"content-type": "text/html",
			},
		});
	},
};
