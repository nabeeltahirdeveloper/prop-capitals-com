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
  variant = "dark",
}) {
  const isLight = variant === "light";

  if (isLoading) {
    return (
      <div
        className={`rounded-xl border ${
          isLight ? "border-border" : "border-slate-800"
        } overflow-hidden`}
      >
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow
                className={
                  isLight
                    ? "bg-slate-100 border-b border-border"
                    : "bg-slate-800/50 border-slate-700"
                }
              >
                {columns.map((col, i) => (
                  <TableHead
                    key={i}
                    className={`font-medium whitespace-nowrap text-xs sm:text-sm ${
                      isLight ? "text-slate-500" : "text-slate-400"
                    }`}
                  >
                    {col.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(5)].map((_, i) => (
                <TableRow
                  key={i}
                  className={isLight ? "border-border" : "border-slate-800"}
                >
                  {columns.map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton
                        className={`h-4 w-full ${
                          isLight ? "bg-muted" : "bg-slate-800"
                        }`}
                      />
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
      <div
        className={`rounded-xl border p-8 sm:p-12 text-center ${
          isLight ? "border-border" : "border-slate-800"
        }`}
      >
        <p
          className={`text-sm sm:text-base ${
            isLight ? "text-muted-foreground" : "text-slate-400"
          }`}
        >
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl border overflow-hidden ${
        isLight ? "border-border" : "border-slate-800"
      }`}
    >
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow
              className={
                isLight
                  ? "bg-slate-100 border-b border-border"
                  : "bg-slate-800/50 border-slate-700 hover:bg-slate-800/50"
              }
            >
              {columns.map((col, i) => (
                <TableHead
                  key={i}
                  className={`font-medium whitespace-nowrap text-xs sm:text-sm px-3 sm:px-4 ${
                    isLight ? "text-slate-500" : "text-slate-400"
                  }`}
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
        ${isLight ? "border-border" : "border-slate-800"}
        ${onRowClick ? "cursor-pointer" : ""}
        ${
          isLight
            ? "hover:bg-slate-100/80"
            : "hover:bg-slate-700/60"
        }
        transition-colors
      `}
              >
                {columns.map((col, j) => (
                  <TableCell
                    key={j}
                    className={`whitespace-nowrap text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-3 ${
                      isLight ? "text-slate-700" : "text-slate-300"
                    }`}
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
