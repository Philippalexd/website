export interface Profile {
  id: string;
  display_name: string;
  bio: string;
  avatar_url: string;
}

export interface Activity {
  id: string;
  date: string;
  type: string;
  minutes: string;
  distance: string | null;
  note: string | null;
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
