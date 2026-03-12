Deno.serve((_req) => {
  return new Response("ok", {
    status: 200,
    headers: { "Content-Type": "text/plain" },
  });
});
