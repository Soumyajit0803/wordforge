// NO "use client" directive here! This is purely a Server Component.

import { Metadata } from "next";
import AccountClient from "./AccountClient"; 

// 1. Export your metadata safely on the server
export function generateMetadata(): Metadata {
  return {
    title: "WordForge | My Account",
    description: "Manage your account settings.",
  };
}

// 2. Render your interactive client component
export default function Page() {
  return (
    <>
      <AccountClient />
    </>
  );
}