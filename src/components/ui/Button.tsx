import Link from "next/link";
import { cn } from "@/lib/cn";

type Variant = "primary" | "accent" | "outline" | "outline-accent";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary: "bg-primary text-white hover:bg-primary/90",
  accent: "bg-accent text-white hover:bg-accent/90",
  outline: "border border-primary text-primary hover:bg-primary-soft",
  "outline-accent": "border border-accent text-accent hover:bg-purple-50",
};

const sizes: Record<Size, string> = {
  sm: "h-[38px] px-3 text-sm leading-5",
  md: "h-11 px-4 text-sm leading-5 font-medium",
  lg: "h-[46px] px-4 text-base leading-6 font-medium",
};

type CommonProps = {
  variant?: Variant;
  size?: Size;
  /** Lucide icon (or any node) shown before the label. */
  icon?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
};

export function buttonClasses({
  variant = "primary",
  size = "sm",
  className,
}: Pick<CommonProps, "variant" | "size" | "className">) {
  return cn(
    "inline-flex shrink-0 items-center justify-center gap-2 rounded-lg whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:opacity-60",
    variants[variant],
    sizes[size],
    className,
  );
}

type ButtonProps = CommonProps & React.ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({ variant, size, icon, className, children, type = "button", ...props }: ButtonProps) {
  return (
    <button type={type} className={buttonClasses({ variant, size, className })} {...props}>
      {icon}
      {children}
    </button>
  );
}

type ButtonLinkProps = CommonProps & { href: string };

/** Same look as Button, for navigation. */
export function ButtonLink({ variant, size, icon, className, children, href }: ButtonLinkProps) {
  return (
    <Link href={href} className={buttonClasses({ variant, size, className })}>
      {icon}
      {children}
    </Link>
  );
}
