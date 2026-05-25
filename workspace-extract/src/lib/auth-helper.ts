import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { db } from "./db";

// Get the authenticated user's ID from the session
export async function getUserId(): Promise<string> {
  const session = await getServerSession(authOptions);
  if (session?.user?.id) {
    return session.user.id;
  }
  throw new Error("Unauthorized - No valid session");
}

// Optional: get user ID or null (doesn't throw)
export async function getUserIdOrNull(): Promise<string | null> {
  try {
    const session = await getServerSession(authOptions);
    return session?.user?.id || null;
  } catch {
    return null;
  }
}
