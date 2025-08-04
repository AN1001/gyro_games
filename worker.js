export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    if (url.pathname.startsWith("/api/")) {
      // TODO: Add your custom /api/* logic here.
      return new Response("Ok");
    }
    if (['/main.html', '/index.js', '/style.css'].includes(url.pathname)) {
      return env.ASSETS.fetch(request);
    } 
    if (url.pathname === '/') {
      return env.ASSETS.fetch('https://assets.local/main.html')
    }
    
    return new Response("Not found", { status: 404 });
  }
};
