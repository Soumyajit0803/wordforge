// hooks/usePlayer.ts
"use client";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import Cookies from "js-cookie";

type User = {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

type Player = {
  user: User;
  name?:string;
  isGuest: boolean;
};

export function usePlayer() {
  const { data: session, status } = useSession();
  const [player, setPlayer] = useState<Player | null>(null);

  useEffect(() => {
    if (status === "loading") return;

    if (status === "authenticated" && session?.user) {
      setPlayer({ user: session.user, isGuest: false });
    } else if (status === "unauthenticated") {
      // Read from Cookie instead of localStorage
      let storedGuest = Cookies.get("guest_profile");

      if (!storedGuest) {
        // Set cookie to expire in 30 days
        console.log("No guest profile found. Please visit later.")
      } else {
        setPlayer(JSON.parse(storedGuest));
      }
    }
  }, [session, status]);

  return { player, isLoading: status === "loading" };
}
