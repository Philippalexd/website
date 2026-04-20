import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { sb } from "../lib/supabaseClient";
import { useSession } from "./SessionContext";
import type { Profile } from "../types/types";

async function fetchProfile(userId: string): Promise<Profile> {
  const { data, error } = await sb
    .from("profiles")
    .select("display_name, bio, avatar_url")
    .eq("id", userId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  let avatar_url = "";
  if (data?.avatar_url) {
    const { data: signed, error: signErr } = await sb.storage
      .from("avatars")
      .createSignedUrl(data.avatar_url, 60 * 10);
    if (signErr) {
      throw new Error(signErr.message);
    }
    if (signed?.signedUrl) avatar_url = signed.signedUrl;
  }

  return {
    id: userId,
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
  const { session } = useSession();
  const queryClient = useQueryClient();

  const { data: profile = null } = useQuery({
    queryKey: ["profile", session?.user.id],
    queryFn: () => fetchProfile(session!.user.id),
    enabled: !!session,
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
