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
      <div className="rounded-xl border border-slate-300 dark:border-slate-700 overflow-hidden bg-white dark:bg-transparent">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-200 dark:bg-slate-800/50 border-b border-slate-300 dark:border-slate-700 [&_tr]:hover:bg-transparent">
                {columns.map((col, i) => (
                  <TableHead
                    key={i}
                    className="font-semibold whitespace-nowrap text-xs sm:text-sm text-slate-800 dark:text-slate-400"
                  >
                    {col.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(5)].map((_, i) => (
                <TableRow key={i} className="border-slate-200 dark:border-slate-700">
                  {columns.map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full bg-slate-200 dark:bg-slate-800" />
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
      <div className="rounded-xl border border-slate-300 dark:border-slate-700 p-8 sm:p-12 text-center bg-white dark:bg-transparent">
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-300 dark:border-slate-700 overflow-hidden bg-white dark:bg-transparent">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-200 dark:bg-slate-800/50 border-b border-slate-300 dark:border-slate-700 [&_tr]:hover:bg-transparent">
              {columns.map((col, i) => (
                <TableHead
                  key={i}
                  className="font-semibold whitespace-nowrap text-xs sm:text-sm px-3 sm:px-4 text-slate-800 dark:text-slate-400"
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
                className={`border-slate-200 dark:border-slate-700 ${onRowClick ? "cursor-pointer" : ""} hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors`}
              >
                {columns.map((col, j) => (
                  <TableCell
                    key={j}
                    className="whitespace-nowrap text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-3 text-slate-800 dark:text-slate-300"
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
