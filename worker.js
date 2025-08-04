export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Serve HTML
    if (url.pathname === "/") {
      return env.ASSETS.fetch(request);
    }

    // Serve JS/CSS (let Workers Sites handle it)
    if (url.pathname === "/index.js" || url.pathname === "/style.css") {
      return env.ASSETS.fetch(request);
    }

    // Fallback: 404
    return new Response("Not Found", { status: 404 });
  },
};
