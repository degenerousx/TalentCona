import { cn } from "@/lib/cn";

type CardProps = React.HTMLAttributes<HTMLElement> & {
  as?: "div" | "section" | "article" | "li";
  /** Admissions and Reports use gray-200 borders; Talent Corner a lighter hairline. */
  tone?: "default" | "hairline";
  /** Nested cards inside a card have no shadow. */
  flat?: boolean;
};

/** White surface with the Figma card border, radius and shadow. */
export function Card({ as: Tag = "div", tone = "default", flat, className, ...props }: CardProps) {
  return (
    <Tag
      className={cn(
        "rounded-lg border bg-white",
        tone === "hairline" ? "border-hairline" : "border-gray-200",
        !flat && "shadow-sm",
        className,
      )}
      {...props}
    />
  );
}
