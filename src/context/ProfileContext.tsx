import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { sb, getSession } from "../lib/supabaseClient";
import type { Profile } from "../types";

const ProfileContext = createContext<{
  profile: Profile | null;
  refreshProfile: () => Promise<void>;
}>({
  profile: null,
  refreshProfile: async () => {},
});

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);

  async function refreshProfile() {
    const session = await getSession();
    if (!session) {
      setProfile(null);
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
  }

  useEffect(() => {
    refreshProfile();
  }, []);

  return (
    <ProfileContext.Provider value={{ profile, refreshProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfileNull() {
  return useContext(ProfileContext);
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (ctx.profile === null) {
    throw new Error(
      "useProfile darf nur auf geschützten Seiten verwendet werden!",
    );
  }
  return {
    profile: ctx.profile,
    refreshProfile: ctx.refreshProfile,
  };
}
