import { useAuth } from "@clerk/react";
import { useEffect } from "react";
import { remindersEnabled, remindersConfigured, syncPushReminders } from "../lib/reminders";

/** Clerk-guarded sync, never mounted in the public no-auth demo. */
export function RemindersBackgroundSync() {
  const { getToken, isSignedIn } = useAuth();
  useEffect(() => {
    if (!isSignedIn || !remindersConfigured || !remindersEnabled()) return;
    let timer: number | undefined;
    const run = () => {
      if (!remindersEnabled()) return;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        void syncPushReminders(() => getToken()).catch(() => {
          // The preference remains enabled: a later focus/data update retries.
        });
      }, 500);
    };
    const onVisible = () => { if (document.visibilityState === "visible") run(); };
    run();
    window.addEventListener("focus", run);
    window.addEventListener("curacasa:data-changed", run);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("focus", run);
      window.removeEventListener("curacasa:data-changed", run);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [isSignedIn, getToken]);
  return null;
}
