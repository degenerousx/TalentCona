/** Temporary content for modules that haven't been built yet. Delete it from your page when you start. */
export default function PagePlaceholder({ title }: { title: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <h1 className="text-2xl font-medium text-slate-900">{title}</h1>
      <p className="mt-2 text-slate-500">This module hasn&apos;t been built yet.</p>
    </div>
  );
}
