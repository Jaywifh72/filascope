Deno.serve(async (req) => {
  return new Response(
    JSON.stringify({ success: true, message: 'Test function works', time: new Date().toISOString() }),
    { headers: { 'Content-Type': 'application/json' } }
  );
});
