import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { sb } from "../lib/supabaseClient";
import { getSession } from "../lib/auth";
import type { Profile } from "../types";

interface ProfileContextType {
  profile: Profile;
  loading: boolean;
  refreshProfile: () => Promise<void>;
}

const empty: Profile = {
  id: "",
  display_name: "",
  bio: "",
  avatar_url: "",
};

const ProfileContext = createContext<ProfileContextType>({
  profile: empty,
  loading: true,
  refreshProfile: async () => {},
});

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile>(empty);
  const [loading, setLoading] = useState(true);

  async function refreshProfile() {
    const session = await getSession();
    if (!session) {
      setLoading(false);
      return;
    }

    const { data, error } = await sb
      .from("profiles")
      .select("display_name, bio, avatar_url")
      .eq("id", session.user.id)
      .single();

    let avatar_url = "";
    if (!error && data?.avatar_url) {
      const { data: signed, error: signErr } = await sb.storage
        .from("avatars")
        .createSignedUrl(data.avatar_url, 60 * 10);
      if (!signErr && signed?.signedUrl) avatar_url = signed.signedUrl;
    }

    setProfile({
      id: session.user.id,
      display_name: data?.display_name ?? "",
      bio: data?.bio ?? "",
      avatar_url,
    });
    setLoading(false);
  }

  useEffect(() => {
    refreshProfile();
  }, []);

  return (
    <ProfileContext.Provider value={{ profile, loading, refreshProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  return useContext(ProfileContext);
}
