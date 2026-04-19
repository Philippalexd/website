export interface Profile {
  id: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string;
}

export interface Activity {
  id: string;
  user_id: string;
  type: string;
  date: string;
  minutes: string;
  distance: string | null;
  note: string | null;
  source: string | null;
  external_id: string | null;
  raw_data: any;
  title: string | null;
}

export interface Group {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
}

export interface UserRank {
  user_id: string;
  display_name: string;
  total_minutes: number;
  total_km: number;
  total_points: number;
}

export interface GroupRank {
  group_id: string;
  group_name: string;
  total_minutes: number;
  total_km: number;
  total_points: number;
}

export interface Strava {
  connected: boolean;
  accessToken: string | null;
  athleteId: string | null;
  lastSyncAt: string | null;
};

export interface StravaTokenResponse{
  access_token: string;
  refresh_token: string;
  expires_at: number;
  athlete: {id:number; [key: string]: unknown};
}