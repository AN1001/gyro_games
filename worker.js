export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Serve HTML
    if (url.pathname === "/") {
      const html = await fetchAsset("./main.html");
      return new Response(html, {
        headers: { "Content-Type": "text/html" },
      });
    }

    // Serve JS (as raw file, not executed)
    if (url.pathname === "/index.js") {
      const js = await fetchAsset("./index.js");
      return new Response(js, {
        headers: { "Content-Type": "application/javascript" },
      });
    }

    // Serve CSS
    if (url.pathname === "/style.css") {
      const css = await fetchAsset("./style.css");
      return new Response(css, {
        headers: { "Content-Type": "text/css" },
      });
    }

    // Fallback: 404 if file not found
    return new Response("Not Found", { status: 404 });
  },
};

// Helper: Fetch a static file (from Workers asset system)
async function fetchAsset(path) {
  // In Workers, files are accessible via `fetch` + special path
  const response = await fetch(`https://${__STATIC_CONTEXT__}/${path}`);
  if (!response.ok) throw new Error(`File not found: ${path}`);
  return await response.text();
}
