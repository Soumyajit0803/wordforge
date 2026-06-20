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
  isGuest: boolean;
};

// const generateGuestName = () => {
//   const adjectives = ["Sneaky", "Mighty", "Cosmic", "Quantum", "Hyper"];
//   const nouns = ["Axolotl", "Godzilla", "Capybara", "Kraken", "Dragon"];
//   const random = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
//   return `${random(adjectives)} ${random(nouns)}`;
// };

export function usePlayer() {
  const { data: session, status } = useSession();
  // const guestName = generateGuestName();
  // const newGuest = {
  //   name: guestName,
  //   id: crypto.randomUUID() + "-" + guestName,
  //   isGuest: true,
  // };
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
