import React from "react";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export default function Logo({ className = "", size = "md" }: LogoProps) {
  const sizeClasses = {
    sm: "h-8",
    md: "h-12",
    lg: "h-16",
  };

  return (
    <div className={`flex items-center ${className}`}>
      <img
        src="/logo.jpeg"
        alt="IMX Logo"
        className={`${sizeClasses[size]} w-auto object-contain`}
      />
    </div>
  );
}
