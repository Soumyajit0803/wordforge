import { NextResponse } from "next/server";
import { db } from "@/app/db/index";
import { challenges } from "@/app/db/schema";
import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const { challengeId, isCreator, guesses } = body;

    // Cloud saves are only for logged-in users. Guests stay in local memory.
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ success: true, message: "Guest mode" });
    }

    if (!challengeId || !guesses) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    // Prepare the exact column to update
    const updatePayload = isCreator 
      ? { playerA_Guesses: guesses }
      : { playerB_Guesses: guesses };

    // Fire and forget update
    await db.update(challenges)
      .set(updatePayload)
      .where(eq(challenges.id, challengeId));

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Progress save failed:", error);
    return NextResponse.json({ error: "Failed to save progress." }, { status: 500 });
  }
}