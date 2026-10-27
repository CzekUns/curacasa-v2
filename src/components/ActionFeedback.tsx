import { useEffect, useState } from "react";
import { Check, Sparkles } from "lucide-react";

type Feedback = { id: number; text: string } | null;

/** Subtle, accessible confirmation shared by preset import and completions. */
export function useActionFeedback() {
  const [feedback, setFeedback] = useState<Feedback>(null);
  useEffect(() => {
    if (!feedback) return;
    const timer = window.setTimeout(() => setFeedback(null), 2000);
    return () => window.clearTimeout(timer);
  }, [feedback]);
  function announce(text: string) {
    setFeedback({ id: Date.now() + Math.random(), text });
  }
  return { feedback, announce };
}

export function ActionFeedback({ feedback }: { feedback: Feedback }) {
  return (
    <div className="action-feedback-region" role="status" aria-live="polite" aria-atomic="true">
      {feedback ? (
        <div className="action-feedback" key={feedback.id}>
          <span className="action-feedback__icon" aria-hidden="true">
            <Check size={24} strokeWidth={3} />
          </span>
          <span>{feedback.text}</span>
          <Sparkles className="action-feedback__sparkle" size={17} aria-hidden="true" />
        </div>
      ) : null}
    </div>
  );
}
