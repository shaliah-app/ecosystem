import { cn } from "@/lib/utils";

interface IconProps {
  name: string;
  variant?: "outlined" | "rounded" | "sharp";
  size?: number;
  className?: string;
}

export function Icon({
  name,
  variant = "outlined",
  size = 24,
  className
}: IconProps) {
  const variantClass = `material-symbols-${variant}`;

  return (
    <span
      className={cn(variantClass, className)}
      style={{ fontSize: size }}
      aria-hidden="true"
    >
      {name}
    </span>
  );
}