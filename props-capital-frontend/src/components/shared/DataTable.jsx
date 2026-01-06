import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

export default function DataTable({
  columns,
  data,
  isLoading,
  emptyMessage = 'No data found',
  onRowClick
}) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-800/50 border-slate-700">
                {columns.map((col, i) => (
                  <TableHead key={i} className="text-slate-400 font-medium whitespace-nowrap text-xs sm:text-sm">
                    {col.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(5)].map((_, i) => (
                <TableRow key={i} className="border-slate-800">
                  {columns.map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full bg-slate-800" />
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
      <div className="rounded-xl border border-slate-800 p-8 sm:p-12 text-center">
        <p className="text-slate-400 text-sm sm:text-base">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-800 overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/50">
              {columns.map((col, i) => (
                <TableHead key={i} className="text-slate-400 font-medium whitespace-nowrap text-xs sm:text-sm px-3 sm:px-4">
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, i) => (
              <TableRow
                key={row.id || i}
                className={`border-slate-800 ${onRowClick ? 'cursor-pointer hover:bg-slate-800/50' : ''}`}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((col, j) => (
                  <TableCell key={j} className="text-slate-300 whitespace-nowrap text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-3">
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