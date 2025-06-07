"use client";
import { useEffect } from "react";

export type ToastType = "success" | "error";

interface ToastProps {
  message: string | null;
  type: ToastType;
  onClose: () => void;
}

export const Toast = ({ message, type, onClose }: ToastProps) => {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;

  const maxLen = 60;
  const isLong = message.length > maxLen;
  const displayMsg = isLong ? message.slice(0, maxLen) + "…" : message;
  return (
    <div className={`toast ${type}`} title={isLong ? message : undefined}>
      {displayMsg}
    </div>
  );
};
