"use client";

import { useEffect, useState } from "react";
import { UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatRoleLabel } from "@/lib/role-routes";
import { createClient } from "@/lib/supabase/client";

type ProfileState = {
  name: string;
  email: string;
  role: string;
};

function nameFromEmail(email: string) {
  return email.split("@")[0].replace(/[._-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function ProfileForm() {
  const [profile, setProfile] = useState<ProfileState>({
    name: "Memuat profil...",
    email: "-",
    role: "-"
  });

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      try {
        const supabase = createClient();
        const {
          data: { user }
        } = await supabase.auth.getUser();
        if (!user || !active) return;

        const { data } = await supabase
          .from("profiles")
          .select("nama_lengkap, role")
          .eq("id", user.id)
          .maybeSingle();

        const email = user.email ?? "-";
        setProfile({
          name: data?.nama_lengkap ?? nameFromEmail(email),
          email,
          role: formatRoleLabel(data?.role ?? "pcl")
        });
      } catch {
        if (!active) return;
        setProfile({
          name: "Profil belum tersedia",
          email: "-",
          role: "-"
        });
      }
    }

    loadProfile();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <ProfileField label="Nama" value={profile.name} />
      <ProfileField label="Email" value={profile.email} />
      <ProfileField label="Peran" value={profile.role} />
      <ProfileField label="Zona waktu" value="Asia/Jakarta" />
      <div className="sm:col-span-2">
        <Button>
          <UserRound className="h-4 w-4" /> Simpan Profil
        </Button>
      </div>
    </div>
  );
}

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{label}</span>
      <Input value={value} readOnly className="font-bold" />
    </label>
  );
}
