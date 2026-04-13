const CLIENT_ID = import.meta.env.VITE_STRAVA_CLIENT_ID;
const CLIENT_SECRET = import.meta.env.VITE_STRAVA_CLIENT_SECRET;
const REDIRECT_URI = import.meta.env.VITE_STRAVA_REDIRECT_URI;

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

export async function exchangeStravaCode(code: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_at: number;
  athlete: { id: number };
}> {
  const res = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) throw new Error("Token-Austausch fehlgeschlagen");
  return res.json();
}

export async function refreshStravaToken(refreshToken: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_at: number;
}> {
  const res = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) throw new Error("Token-Refresh fehlgeschlagen");
  return res.json();
}

export async function fetchStravaActivities(
  accessToken: string,
  onProgress?: (count: number) => void,
): Promise<any[]> {
  const all: any[] = [];
  let page = 1;

  const days = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60;
  const fixDate = Math.floor(new Date("2026-04-01T00:00:00").getTime() / 1000);
  let after;

  if (days < fixDate) {
    after = fixDate;
  } else {
    after = days;
  }

  while (true) {
    const res = await fetch(
      `https://www.strava.com/api/v3/athlete/activities?per_page=100&page=${page}&after=${after}`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    if (!res.ok) throw new Error("Strava API Fehler");
    const batch = await res.json();
    if (!batch.length) break;
    all.push(...batch);
    onProgress?.(all.length);
    if (batch.length < 100) break;
    page++;
  }
  return all;
}

export function mapStravaActivity(raw: any, userId: string) {
  return {
    user_id: userId,
    type: raw.sport_type ?? raw.type ?? "Unknown",
    title: raw.name ?? null,
    date: raw.start_date_local
      ? raw.start_date_local.split("T")[0]
      : new Date().toISOString().split("T")[0],
    minutes: raw.moving_time ? Math.round(raw.moving_time / 60) : 0,
    distance: raw.distance
      ? parseFloat((raw.distance / 1000).toFixed(2))
      : null,
    calories: raw.calories ?? null,
    elevation_gain: raw.total_elevation_gain ?? null,
    avg_heart_rate: raw.average_heartrate
      ? Math.round(raw.average_heartrate)
      : null,
    max_heart_rate: raw.max_heartrate ? Math.round(raw.max_heartrate) : null,
    avg_speed: raw.average_speed
      ? parseFloat((raw.average_speed * 3.6).toFixed(2))
      : null,
    summary_polyline: raw.map?.summary_polyline ?? null,
    start_latlng:
      raw.start_latlng?.length === 2
        ? `(${raw.start_latlng[0]},${raw.start_latlng[1]})`
        : null,
    city: raw.location_city ?? null,
    source: "strava",
    external_id: String(raw.id),
    raw_data: raw,
    synced_at: new Date().toISOString(),
    note: "",
  };
}
