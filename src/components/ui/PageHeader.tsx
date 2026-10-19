type PageHeaderProps = {
  title: string;
  description?: string;
};

/** Page title (Display/H1) and its one-line description. */
export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-3">
      <h1 className="text-[28px] leading-[1.3] font-bold text-heading sm:text-[32px]">{title}</h1>
      {description && <p className="text-base leading-5 text-slate-900">{description}</p>}
    </header>
  );
}
