export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Let Cloudflare handle static assets automatically
    if (['/main.html', '/index.js', '/style.css'].includes(url.pathname)) {
      return env.ASSETS.fetch(request);
    } 
    if (url.pathname === '/') {
      return env.ASSETS.fetch("main.html")
    }
    
    return new Response("Not found", { status: 404 });
  }
};
