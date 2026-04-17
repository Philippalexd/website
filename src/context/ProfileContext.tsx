import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { sb, getSession } from "../lib/supabaseClient";
import type { Profile } from "../types";

async function fetchProfile(): Promise<Profile | null> {
  const session = await getSession();
  if (!session) return null;

  const { data, error } = await sb
    .from("profiles")
    .select("display_name, bio, avatar_url")
    .eq("id", session.user.id)
    .single();

  if (error) {
    throw new Error("Error: ", error);
  }

  let avatar_url = "";
  if (data?.avatar_url) {
    const { data: signed, error: signErr } = await sb.storage
      .from("avatars")
      .createSignedUrl(data.avatar_url, 60 * 10);
    if (signErr) {
      throw new Error("Error: ", signErr);
    }
    if (signed?.signedUrl) avatar_url = signed.signedUrl;
  }

  return {
    id: session.user.id,
    display_name: data?.display_name ?? "",
    bio: data?.bio ?? "",
    avatar_url: avatar_url,
  };
}

const ProfileContext = createContext<{
  profile: Profile | null;
  refreshProfile: () => Promise<void>;
}>({
  profile: null,
  refreshProfile: async () => {},
});

export function ProfileProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const { data: profile = null } = useQuery({
    queryKey: ["profile"],
    queryFn: fetchProfile,
    staleTime: 1000 * 60 * 5,
  });

  async function refreshProfile() {
    await queryClient.invalidateQueries({ queryKey: ["profile"] });
  }
  return (
    <ProfileContext.Provider value={{ profile, refreshProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  return useContext(ProfileContext);
}
