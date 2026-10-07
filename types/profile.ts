export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  created_at: string;
}

export function profileDisplayName(profile: Pick<Profile, "full_name" | "email"> | null | undefined) {
  if (!profile) return "Customer";
  return profile.full_name?.trim() || profile.email?.split("@")[0] || "Customer";
}

export function profileInitials(profile: Pick<Profile, "full_name" | "email"> | null | undefined) {
  const name = profileDisplayName(profile);
  return name.slice(0, 2).toUpperCase();
}
