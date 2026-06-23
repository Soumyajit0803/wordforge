import { Metadata } from "next";
import CreateChallengeClient from "./CreateChallengeClient";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { cookies } from "next/headers";

export function generateMetadata(): Metadata {
  return {
    title: "ForgeWord | Create Challenge",
    description: "Create a word challenge.",
  };
}

export default async function Page() {
  const session = await getServerSession(authOptions);
  let userId = session?.user?.id || "";
  let isGuest = false;

  // 2. If no active session, check for the guest cookie
  if (!userId) {
    const cookieStore = await cookies();
    const guestProfileStr = cookieStore.get("guest_profile")?.value;

    if (guestProfileStr) {
      try {
        const guestProfile = JSON.parse(guestProfileStr);
        userId = guestProfile.id;
        isGuest = true;
      } catch (e) {
        console.error("Failed to parse guest cookie", e);
      }
    }
  }
  return (
    <>
      <CreateChallengeClient challengerId = {userId} />
    </>
  );
}
