"use client";
import { useEffect } from "react";

export default function Toast({
  message,
  type = "info",
  onClose,
  duration = 3000,
}: {
  message: string | null;
  type?: "info" | "success" | "error";
  onClose: () => void;
  duration?: number;
}) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onClose, duration);
    return () => clearTimeout(t);
  }, [message, duration, onClose]);

  if (!message) return null;

  const color =
    type === "success" ? "bg-green-600" : type === "error" ? "bg-red-600" : "bg-gray-800";

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
      <div className={`text-white px-4 py-2 rounded-md shadow ${color}`}>{message}</div>
    </div>
  );
}


