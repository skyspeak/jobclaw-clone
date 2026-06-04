"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export type AdminColumn<T> = {
  key: string;
  label: string;
  render: (row: T) => string;
  sortValue?: (row: T) => string;
};

type AdminDataTableProps<T> = {
  title: string;
  description: string;
  rows: T[];
  columns: AdminColumn<T>[];
  csvFileName: string;
  searchPlaceholder?: string;
  emptyMessage: string;
  getSearchText?: (row: T) => string;
};

function escapeCsv(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function AdminDataTable<T>({
  title,
  description,
  rows,
  columns,
  csvFileName,
  searchPlaceholder = "Search…",
  emptyMessage,
  getSearchText,
}: AdminDataTableProps<T>) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState(columns[0]?.key ?? "");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = q
      ? rows.filter((row) => (getSearchText ? getSearchText(row) : JSON.stringify(row)).toLowerCase().includes(q))
      : rows;

    const column = columns.find((col) => col.key === sortKey);
    if (!column) {
      return base;
    }

    return [...base].sort((a, b) => {
      const aVal = column.sortValue ? column.sortValue(a) : column.render(a);
      const bVal = column.sortValue ? column.sortValue(b) : column.render(b);
      const cmp = aVal.localeCompare(bVal);
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [columns, getSearchText, query, rows, sortDir, sortKey]);

  function toggleSort(key: string) {
    if (sortKey === key) {
      setSortDir((dir) => (dir === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDir("asc");
  }

  function exportCsv() {
    const headers = columns.map((col) => col.key);
    const lines = [
      headers.join(","),
      ...filtered.map((row) =>
        columns.map((col) => escapeCsv(col.render(row))).join(","),
      ),
    ];

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${csvFileName}-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader className="space-y-2 border-b border-border/60 p-8 md:p-10">
        <CardTitle className="text-xl tracking-tight">{title}</CardTitle>
        <CardDescription className="text-base leading-relaxed">{description}</CardDescription>
        <p className="text-sm font-medium text-muted-foreground">
          <span className="text-card-foreground">{rows.length}</span> total
        </p>
      </CardHeader>

      <CardContent className="space-y-4 p-8 md:p-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={searchPlaceholder}
            className="h-11 max-w-md rounded-xl"
          />
          <Button type="button" variant="outline" className="rounded-2xl" onClick={exportCsv}>
            Export CSV
          </Button>
        </div>

        {filtered.length > 0 ? (
          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/80">
                  {columns.map((column) => (
                    <th
                      key={column.key}
                      className="px-4 py-3 text-xs font-semibold uppercase tracking-wider"
                    >
                      <button
                        type="button"
                        onClick={() => toggleSort(column.key)}
                        className="text-muted-foreground transition hover:text-foreground"
                      >
                        {column.label}
                        {sortKey === column.key ? (sortDir === "asc" ? " ↑" : " ↓") : ""}
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, index) => (
                  <tr
                    key={index}
                    className="border-b border-border/80 last:border-0 odd:bg-card even:bg-muted/25"
                  >
                    {columns.map((column) => (
                      <td key={column.key} className="max-w-[240px] break-all px-4 py-3 align-top">
                        {column.render(row)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        )}
      </CardContent>
    </Card>
  );
}
