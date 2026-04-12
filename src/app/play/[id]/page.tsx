import PlayArea from "@/components/PlayArea/PlayArea";
import { db } from "@/app/db/index"; // Adjust this path if your db is located elsewhere
import { challenges, games, users } from "@/app/db/schema"; // Adjust this to your schema file
import { eq } from "drizzle-orm";

export async function generateMetadata() {
  return {
    title: "WordForge | Play Challenge",
    description: "Take on the word challenge and see if you can guess the target word!",
  };
}

export default async function ChallengePage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = await params;
  console.log("The URL ID is:", id);
  // 1. Fetch data based on the URL parameter (id)
  const challengeResult = await db
    .select({
      word: games.targetWord,
      creatorId: challenges.creatorId,
    })
    .from(challenges)
    .innerJoin(games, eq(challenges.gameId, games.id))
    .where(eq(challenges.id, id))
    .limit(1);

  // 2. Check if the challenge exists
  if (!challengeResult || challengeResult.length === 0) {
    return (
      <div
        style={{ textAlign: "center", padding: "4rem 1rem", color: "#787c7e" }}
      >
        <h2>Challenge Not Found</h2>
        <p>This link might be invalid or has expired.</p>
      </div>
    );
  }

  const challengeData = challengeResult[0];
  const [challengerName] = await db
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, challengeData.creatorId));

  // 3. Render the client component, passing the fetched data
  return (
    <PlayArea
      targetWord={challengeData.word}
      challengeId= {id}
      // Note: If creatorId is a UUID, you might want to join the 'users' table
      // in the query above to get their actual display name!
      challengerName={challengerName?.name?.split(' ')[0] || "Unknown Challenger"}
    />
  );
}
