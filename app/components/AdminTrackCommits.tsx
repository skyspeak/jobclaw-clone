"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { TrackCommitAdminRow } from "@/lib/track-commits";

type AdminTrackCommitsProps = {
  commits: TrackCommitAdminRow[];
  storeLabel: string;
};

type SortKey = "id" | "email" | "linkedIn" | "phone" | "trackTitle" | "createdAt";

function escapeCsv(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function AdminTrackCommits({ commits, storeLabel }: AdminTrackCommitsProps) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = q
      ? commits.filter((row) => {
          const haystack = [
            row.id,
            row.email,
            row.phone,
            row.trackTitle,
            row.trackId,
            row.linkedIn ?? "",
            row.name,
          ]
            .join(" ")
            .toLowerCase();
          return haystack.includes(q);
        })
      : commits;

    return [...rows].sort((a, b) => {
      let aVal = "";
      let bVal = "";
      switch (sortKey) {
        case "linkedIn":
          aVal = a.linkedIn ?? "";
          bVal = b.linkedIn ?? "";
          break;
        case "trackTitle":
          aVal = a.trackTitle;
          bVal = b.trackTitle;
          break;
        case "createdAt":
          return sortDir === "asc"
            ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        default:
          aVal = String(a[sortKey] ?? "");
          bVal = String(b[sortKey] ?? "");
      }
      const cmp = aVal.localeCompare(bVal);
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [commits, query, sortDir, sortKey]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((dir) => (dir === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDir("asc");
  }

  function exportCsv() {
    const headers = ["user_id", "email", "linkedin", "phone", "track_committed", "committed_at"];
    const lines = [
      headers.join(","),
      ...filtered.map((row) =>
        [
          row.id,
          row.email,
          row.linkedIn ?? "",
          row.phone,
          row.trackTitle,
          row.createdAt,
        ]
          .map((cell) => escapeCsv(cell))
          .join(","),
      ),
    ];

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `dearcc-track-commits-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  const columns: Array<{ key: SortKey; label: string }> = [
    { key: "id", label: "User ID" },
    { key: "email", label: "Email" },
    { key: "linkedIn", label: "LinkedIn" },
    { key: "phone", label: "Phone" },
    { key: "trackTitle", label: "Track committed" },
    { key: "createdAt", label: "Committed" },
  ];

  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader className="space-y-2 border-b border-border/60 p-8 md:p-10">
        <CardTitle className="text-xl tracking-tight">Sprint commitments</CardTitle>
        <CardDescription className="text-base leading-relaxed">
          Everyone who confirmed a six-week project sprint commitment. LinkedIn is matched from intake or
          lead-gen records when the email matches.
        </CardDescription>
        <p className="text-sm font-medium text-muted-foreground">
          Storage: <span className="text-card-foreground">{storeLabel}</span>
          {" · "}
          <span className="text-card-foreground">{commits.length}</span> total
        </p>
      </CardHeader>

      <CardContent className="space-y-4 p-8 md:p-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search ID, email, phone, track, LinkedIn…"
            className="h-11 max-w-md rounded-xl"
          />
          <Button type="button" variant="outline" className="rounded-2xl" onClick={exportCsv}>
            Export CSV
          </Button>
        </div>

        {filtered.length > 0 ? (
          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full min-w-[880px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/80">
                  {columns.map((column) => (
                    <th key={column.key} className="px-4 py-3 text-xs font-semibold uppercase tracking-wider">
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
                {filtered.map((row) => (
                  <tr key={row.id} className="border-b border-border/80 last:border-0 odd:bg-card even:bg-muted/25">
                    <td className="max-w-[140px] break-all px-4 py-3 align-top font-mono text-xs text-foreground">
                      {row.id}
                    </td>
                    <td className="max-w-[200px] break-all px-4 py-3 align-top">
                      <a
                        className="text-foreground underline-offset-4 hover:underline"
                        href={`mailto:${row.email}`}
                      >
                        {row.email}
                      </a>
                    </td>
                    <td className="max-w-[220px] break-all px-4 py-3 align-top">
                      {row.linkedIn ? (
                        <a
                          className="text-foreground underline-offset-4 hover:underline"
                          href={row.linkedIn.startsWith("http") ? row.linkedIn : `https://${row.linkedIn}`}
                          rel="noreferrer"
                          target="_blank"
                        >
                          {row.linkedIn}
                        </a>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 align-top">
                      <a
                        className="text-foreground underline-offset-4 hover:underline"
                        href={`tel:${row.phone.replace(/\s/g, "")}`}
                      >
                        {row.phone}
                      </a>
                    </td>
                    <td className="px-4 py-3 align-top font-medium text-foreground">{row.trackTitle}</td>
                    <td className="whitespace-nowrap px-4 py-3 align-top text-muted-foreground">
                      {new Intl.DateTimeFormat("en", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(new Date(row.createdAt))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            {commits.length === 0
              ? "No sprint commitments recorded yet. They appear here after someone confirms on a project sprint page."
              : "No commitments match your search."}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
