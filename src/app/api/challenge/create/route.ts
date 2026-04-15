import { NextResponse } from "next/server";
import { db } from "@/app/db/index";
import { challenges } from "@/app/db/schema";
import { getServerSession } from "next-auth/next"; 
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(request: Request) {
  try {
    // 1. Verify the user is actually logged in
    const session = await getServerSession(authOptions);

    const body = await request.json();
    const { wordForB } = body; 

    if (!wordForB || wordForB.length !== 5) {
      return NextResponse.json({ error: "Invalid word length" }, { status: 400 });
    }

    // 2. Use the secure ID from the session
    const secureCreatorId = session?.user?.id || null;

    // 3. Single atomic insert into the merged challenges table
    const [newChallenge] = await db
      .insert(challenges)
      .values({ 
        wordForB: wordForB.toUpperCase(), // Store uppercase for consistency
        creatorId: secureCreatorId,
        status: "pending" // Explicitly set to pending, waiting for Player B
      })
      .returning({ id: challenges.id });

    // 4. Return the new UUID link
    return NextResponse.json({ challengeId: newChallenge.id });

  } catch (error) {
    console.error("Failed to create challenge:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}