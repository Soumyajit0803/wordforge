import { NextResponse } from "next/server";
import { db } from "@/app/db/index";
import { users } from "@/app/db/schema";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    // 1. Verify the user is actually logged in
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Grab the data sent from your AccountPage form
    const body = await request.json();
    const { name, image } = body;

    // 3. Basic validation so they don't delete their name entirely
    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 });
    }

    // 4. Update the user record in your database
    await db
      .update(users)
      .set({
        name: name.trim(),
        image: image || session.user.image, // Keep old image if a new one isn't provided
      })
      .where(eq(users.id, session.user.id));

    // 5. Send back a success signal!
    return NextResponse.json({ success: true, name, image });
    
  } catch (error) {
    console.error("Failed to update profile:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}