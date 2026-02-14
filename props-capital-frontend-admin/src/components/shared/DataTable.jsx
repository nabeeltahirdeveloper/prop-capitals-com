import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

export default function DataTable({
  columns,
  data,
  isLoading,
  emptyMessage = "No data found",
  onRowClick,
}) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-200 dark:bg-muted/50 border-b border-slate-200 dark:border-border">
                {columns.map((col, i) => (
                  <TableHead
                    key={i}
                    className="font-semibold whitespace-nowrap text-xs sm:text-sm text-slate-800 dark:text-muted-foreground"
                  >
                    {col.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(5)].map((_, i) => (
                <TableRow key={i} className="border-slate-200 dark:border-border">
                  {columns.map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full bg-slate-100 dark:bg-muted" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-border p-8 sm:p-12 text-center">
        <p className="text-muted-foreground text-sm sm:text-base">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 dark:border-border overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-200 dark:bg-muted/50 border-b border-slate-200 dark:border-border">
              {columns.map((col, i) => (
                <TableHead
                  key={i}
                  className="font-semibold whitespace-nowrap text-xs sm:text-sm px-3 sm:px-4 text-slate-800 dark:text-muted-foreground"
                >
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, i) => (
              <TableRow
                key={row.id || i}
                onClick={() => onRowClick?.(row)}
                className={`
                  border-slate-200 dark:border-border
                  ${onRowClick ? "cursor-pointer" : ""}
                  hover:bg-slate-50 dark:hover:bg-muted/50
                  transition-colors
                `}
              >
                {columns.map((col, j) => (
                  <TableCell
                    key={j}
                    className="whitespace-nowrap text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-3 text-slate-800 dark:text-foreground"
                  >
                    {col.cell ? col.cell(row) : row[col.accessorKey]}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
