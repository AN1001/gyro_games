var worker_default = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/")) {
      const body = await request.json();
      if("SDP_OFFER" in body){
        const CODE = crypto.randomUUID().substring(0,3)
        await write_sdp_offer(body, env, CODE);
        return new Response(CODE);
      }
    }
    if (["/main.html", "/index.js", "/style.css"].includes(url.pathname)) {
      return env.ASSETS.fetch(request);
    }
    if (url.pathname === "/") {
      return env.ASSETS.fetch("https://assets.local/main.html");
    }
    return new Response("Not found", { status: 404 });
  }
};
export {
  worker_default as default
};

async function write_sdp_offer(body, env, CODE){
    console.log("written")
    await env.WEB_RTC_CACHE.put(CODE, JSON.stringify(body), {expirationTtl:600});
}
