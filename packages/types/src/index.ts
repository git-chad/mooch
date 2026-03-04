export type User = {
  id: string;
  display_name: string;
  photo_url: string | null;
  locale: string;
  default_currency: string;
  created_at: string;
  updated_at: string;
};

export type Profile = {
  id: string;
  display_name: string;
  photo_url: string | null;
  locale: string;
  default_currency: string;
  created_at: string;
  updated_at: string;
};

export type Group = {
  id: string;
  name: string;
  emoji: string;
  cover_photo_url: string | null;
  currency: string;
  locale: string;
  invite_code: string;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type GroupMember = {
  group_id: string;
  user_id: string;
  role: "owner" | "admin" | "member";
  joined_at: string;
};
