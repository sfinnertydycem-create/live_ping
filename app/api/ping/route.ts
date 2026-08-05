export const runtime = "edge";

export async function GET() {
  return new Response(null, {
    status: 204,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "Server-Timing": "edge;dur=0",
    },
  });
}
