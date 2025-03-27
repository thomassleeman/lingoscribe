"use client";
import { ReactNode } from "react";

interface ActionButtonProps {
  onClick: () => void;
  icon: ReactNode;
  label: string;
}

export default function ActionButton({
  onClick,
  icon,
  label,
}: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center py-2 px-4 rounded-3xl hover:bg-gray-100 space-x-2 text-gray-600 dark:text-gray-200 hover:text-gray-600 transition duration-300"
    >
      {icon}
      <span className="text-sm">{label}</span>
    </button>
  );
}
