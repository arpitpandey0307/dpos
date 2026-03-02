import { cn } from "@/lib/utils";

interface BadgeProps {
  label: string;
  className?: string;
  size?: "sm" | "md";
}

export function Badge({ label, className, size = "sm" }: BadgeProps) {
  const sizes = { sm: "text-[10px] px-2 py-0.5", md: "text-xs px-2.5 py-1" };
  return (
    <span className={cn("inline-flex items-center rounded-full font-medium", sizes[size], className)}>
      {label}
    </span>
  );
}
