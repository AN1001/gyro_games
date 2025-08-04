// Import your main HTML file (as before)
import main from "./main.html";
import css from "./style.css";
import js from "./index.js";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    console.log(`Request from ${request.headers.get("user-agent")} at ${url.pathname}`);

    // Handle API calls (optional)
    if (url.pathname === "/api") {
      console.log("API call made");
      return new Response(JSON.stringify({ message: "API response" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // Serve CSS file
    if (url.pathname === "/style.css") {
      return new Response(css, {
        headers: { "Content-Type": "text/css" },
      });
    }

    // Serve JS file
    if (url.pathname === "/index.js") {
      return new Response(js, {
        headers: { "Content-Type": "application/javascript" },
      });
    }

    // Default: Serve main.html
    return new Response(main, {
      headers: { "Content-Type": "text/html" },
    });
  },
};
