import { useAuth, useSession } from "@clerk/react";
import { useEffect } from "react";
import { grantLoginCoins, loadData, saveData } from "../lib/store";

/**
 * Mounted only inside the authenticated AppShell, never in GitHub Pages demo.
 * A bonus needs both a newly authenticated Clerk session AND a 7-day gap
 * since the previous awarded login. Session restoration/refresh doesn't pay.
 */
export function LoginCoinReward() {
  const { isLoaded, userId, sessionId } = useAuth();
  const { session } = useSession();

  useEffect(() => {
    const startedAt = session?.createdAt;
    if (!isLoaded || !userId || !sessionId || !startedAt) return;
    const current = loadData();
    const next = grantLoginCoins(current, userId, sessionId, startedAt);
    if (next !== current) saveData(next);
  }, [isLoaded, userId, sessionId, session?.createdAt]);

  return null;
}
