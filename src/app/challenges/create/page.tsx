import { Metadata } from "next";
import CreateChallengeClient from "./CreateChallengeClient"; 

export function generateMetadata(): Metadata {
  return {
    title: "WordForge | Create Challenge",
    description: "Create a new word challenge.",
  };
}

export default function Page() {
  return (
    <>
      <CreateChallengeClient />
    </>
  );
}