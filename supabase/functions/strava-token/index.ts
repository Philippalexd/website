import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const STRAVA_CLIENT_ID = Deno.env.get("STRAVA_CLIENT_ID")!;
const STRAVA_CLIENT_SECRET = Deno.env.get("STRAVA_CLIENT_SECRET")!;

const ALLOWED_ORIGINS = [
  "https://philippalexd.github.io",
  "http://localhost:5173",
];

serve(async (req) => {
  const origin = req.headers.get("origin") ?? "";
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : "";

  const headers = {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  try {
    const { code, grant_type, refresh_token } = await req.json();

    const body: Record<string, string> = {
      client_id: STRAVA_CLIENT_ID,
      client_secret: STRAVA_CLIENT_SECRET,
    };

    if (grant_type === "refresh_token") {
      body.grant_type = "refresh_token";
      body.refresh_token = refresh_token;
    } else {
      body.grant_type = "authorization_code";
      body.code = code;
    }

    const res = await fetch("https://www.strava.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      return new Response(JSON.stringify(data), { status: 400, headers });
    }

    return new Response(JSON.stringify(data), { status: 200, headers });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e.message }),
      { status: 500, headers }
    );
  }
});