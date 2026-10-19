import { cn } from "@/lib/cn";

export type Column<T> = {
  key: string;
  header: string;
  /** Defaults to String(row[key]). */
  render?: (row: T) => React.ReactNode;
  className?: string;
  /** Marks the column whose cell names the row (rendered as a row header). */
  rowHeader?: boolean;
};

type DataTableProps<T> = {
  caption: string;
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
};

/** Bordered table with the uppercase gray header row used in Reports. */
export function DataTable<T>({ caption, columns, rows, rowKey }: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
      <table className="w-full min-w-[720px] border-collapse text-left">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            {columns.map((c) => (
              <th
                key={c.key}
                scope="col"
                className="px-6 py-5 text-xs leading-4 font-medium tracking-[0.6px] text-gray-500 uppercase"
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)} className="border-b border-gray-200 last:border-b-0">
              {columns.map((c) => {
                const content = c.render
                  ? c.render(row)
                  : String((row as Record<string, unknown>)[c.key]);
                const classes = cn("px-6 py-4 text-sm leading-5 text-gray-900", c.className);
                return c.rowHeader ? (
                  <th key={c.key} scope="row" className={cn(classes, "text-base leading-6 font-medium")}>
                    {content}
                  </th>
                ) : (
                  <td key={c.key} className={classes}>
                    {content}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
