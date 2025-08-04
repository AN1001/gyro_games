export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Let Cloudflare handle static assets automatically
    if (['/index.html', '/', '/script.js', '/style.css'].includes(url.pathname)) {
      return env.ASSETS.fetch(request);
    }
    
    return new Response("Not found", { status: 404 });
  }
};
