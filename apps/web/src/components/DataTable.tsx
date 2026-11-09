import React, { type ReactNode } from "react";
import type { ColumnDef, SpaceTheme } from "../types";

export type DataTableHeaderTheme = "primary" | "care" | "admin" | "user" | "caregiver";
export type DataTableColumn<T> = ColumnDef<T>;

export interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  keyExtractor: (row: T, index: number) => string | number;
  headerTheme?: DataTableHeaderTheme;
  space?: SpaceTheme;
  emptyMessage?: string;
  onRowClick?: (row: T, index: number) => void;
  testID?: string;
  className?: string;
}

const headerThemeBgs: Record<string, string> = {
  primary: "bg-primary",
  user: "bg-primary",
  care: "bg-care",
  caregiver: "bg-care",
  admin: "bg-admin",
};

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  headerTheme,
  space = "primary",
  emptyMessage = "Aucune donnée disponible",
  onRowClick,
  testID = "data-table",
  className = "",
}: DataTableProps<T>): React.JSX.Element {
  const currentTheme = headerTheme ?? space;
  const headerBg = headerThemeBgs[currentTheme] || headerThemeBgs.primary;

  return (
    <div
      data-testid={testID}
      className={`w-full overflow-x-auto rounded-card border border-border bg-white ${className}`}
    >
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className={`h-[41px] ${headerBg} text-white text-14 font-bold select-none`}>
            {columns.map((col, idx) => (
              <th
                key={col.key || `th-${idx}`}
                data-testid={`th-${col.key || idx}`}
                style={col.width ? { width: col.width } : undefined}
                className="px-[7px] py-[7px] font-bold text-white align-middle"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                data-testid="table-empty"
                className="text-center py-8 text-text-muted text-14"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIdx) => {
              const rowKey = keyExtractor(row, rowIdx);
              const isEven = rowIdx % 2 === 0;
              const rowBg = isEven ? "bg-white" : "bg-surface-2";
              const isClickable = !!onRowClick;

              return (
                <tr
                  key={rowKey}
                  data-testid={`data-table-row-${rowIdx}`}
                  onClick={() => onRowClick && onRowClick(row, rowIdx)}
                  className={`min-h-[50px] ${rowBg} text-14 text-text transition-colors duration-100 ${
                    isClickable ? "cursor-pointer hover:bg-neutral-100 active:opacity-85" : ""
                  }`}
                >
                  {columns.map((col, colIdx) => {
                    let cellContent: ReactNode = null;
                    if (col.render) {
                      cellContent = col.render(row, rowIdx);
                    } else if (col.accessor) {
                      if (typeof col.accessor === "function") {
                        cellContent = col.accessor(row);
                      } else {
                        cellContent = String((row as Record<string, unknown>)[col.accessor as string] ?? "");
                      }
                    } else if (col.key && col.key in (row as Record<string, unknown>)) {
                      cellContent = String((row as Record<string, unknown>)[col.key] ?? "");
                    }

                    return (
                      <td
                        key={col.key || `td-${colIdx}`}
                        className="px-[7px] py-[7px] align-middle text-14 font-normal"
                      >
                        {cellContent}
                      </td>
                    );
                  })}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;
