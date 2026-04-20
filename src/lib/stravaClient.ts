import type { Activity, StravaTokenResponse } from "../types/types";

const CLIENT_ID = import.meta.env.VITE_STRAVA_CLIENT_ID;
const REDIRECT_URI = import.meta.env.VITE_STRAVA_REDIRECT_URI;
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

type NewActivity = Omit<Activity, "id">;

const STRAVA_TYPE_MAP: Record<string, string> = {
  Run: "Laufen",
  VirtualRun: "Laufen",
  Ride: "Radfahren",
  VirtualRide: "Radfahren",
  Swim: "Schwimmen",
  WeightTraining: "Krafttraining",
  Walk: "Spazieren",
  Hike: "Wandern",
  RockClimbing: "Klettern",
} as const;

function mapStravaType(stravaType: string): string {
  return STRAVA_TYPE_MAP[stravaType] ?? "Sonstiges";
}

export function getStravaAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: "code",
    approval_prompt: "auto",
    scope: "activity:read_all",
  });
  return `https://www.strava.com/oauth/authorize?${params}`;
}

export async function exchangeStravaCode(code: string): Promise<StravaTokenResponse> {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/strava-token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ code }),
  });

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Token-Austausch fehlgeschlagen: ${text}`);
  }

  return res.json();
}

export async function refreshStravaToken(refreshToken: string): Promise<StravaTokenResponse> {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/strava-token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Token-Refresh fehlgeschlagen: ${text}`);
  }

  return res.json();
}

export async function fetchStravaActivities(
  accessToken: string,
): Promise<any[]> {
  const days = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60;
  const fixDate = Math.floor(new Date("2026-04-01T00:00:00").getTime() / 1000);
  const after = days < fixDate ? fixDate : days;

  const res = await fetch(
    `https://www.strava.com/api/v3/athlete/activities?per_page=100&after=${after}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );

  if (!res.ok) {
    throw new Error(`Strava API Fehler: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

export function mapStravaActivity(
  raw: Record<string, unknown>,
  userId: string,
): NewActivity {
  const movingTime =
    typeof raw.moving_time === "number" ? raw.moving_time : 0;
  const distance =
    typeof raw.distance === "number" ? raw.distance : null;
  const startDate =
    typeof raw.start_date_local === "string" ? raw.start_date_local : null;
  const sportType =
    typeof raw.sport_type === "string"
      ? raw.sport_type
      : typeof raw.type === "string"
        ? raw.type
        : "Sonstiges";

  return {
    user_id: userId,
    type: mapStravaType(sportType),
    title: typeof raw.name === "string" ? raw.name : null,
    date: startDate
      ? startDate.split("T")[0]
      : new Date().toISOString().split("T")[0],
    minutes: String(Math.round(movingTime / 60)),
    distance:
      distance !== null
        ? String(parseFloat((distance / 1000).toFixed(2)))
        : null,
    source: "strava",
    external_id: String(raw.id),
    raw_data: raw,
    note: null,
  };
}