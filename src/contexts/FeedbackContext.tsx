import { createContext, useContext, useState, ReactNode, useCallback } from "react";

export type FeedbackType = "success" | "error" | "warning" | "info" | "confirm";

export interface FeedbackAction {
  label: string;
  onClick: () => void;
  variant?: "default" | "destructive" | "outline";
}

export interface FeedbackOptions {
  type: FeedbackType;
  title: string;
  message: string;
  primaryAction?: FeedbackAction;
  secondaryAction?: FeedbackAction;
  autoClose?: boolean;
  autoCloseDelay?: number;
}

interface FeedbackContextType {
  feedback: FeedbackOptions | null;
  isOpen: boolean;
  showFeedback: (options: FeedbackOptions) => void;
  closeFeedback: () => void;
}

const FeedbackContext = createContext<FeedbackContextType | undefined>(undefined);

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [feedback, setFeedback] = useState<FeedbackOptions | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const showFeedback = useCallback((options: FeedbackOptions) => {
    setFeedback(options);
    setIsOpen(true);

    if (options.autoClose !== false && options.type !== "confirm") {
      const delay = options.autoCloseDelay ?? 5000;
      setTimeout(() => {
        setIsOpen(false);
        setTimeout(() => setFeedback(null), 200);
      }, delay);
    }
  }, []);

  const closeFeedback = useCallback(() => {
    setIsOpen(false);
    setTimeout(() => setFeedback(null), 200);
  }, []);

  return (
    <FeedbackContext.Provider value={{ feedback, isOpen, showFeedback, closeFeedback }}>
      {children}
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const context = useContext(FeedbackContext);
  if (context === undefined) {
    throw new Error("useFeedback must be used within a FeedbackProvider");
  }
  return context;
}
