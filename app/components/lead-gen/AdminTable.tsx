"use client";

import { useMemo, useState } from "react";

import type { Lead } from "@/lib/leads/schema";

type SortKey = keyof Lead | "created_at";
type SortDir = "asc" | "desc";

type AdminTableProps = {
  leads: Lead[];
};

function escapeCsv(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function AdminTable({ leads }: AdminTableProps) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = q
      ? leads.filter(
          (lead) =>
            lead.name.toLowerCase().includes(q) ||
            lead.email.toLowerCase().includes(q) ||
            (lead.phone ?? "").toLowerCase().includes(q),
        )
      : leads;

    return [...rows].sort((a, b) => {
      const aVal = String(a[sortKey as keyof Lead] ?? "");
      const bVal = String(b[sortKey as keyof Lead] ?? "");
      if (sortKey === "created_at") {
        const cmp = new Date(aVal).getTime() - new Date(bVal).getTime();
        return sortDir === "asc" ? cmp : -cmp;
      }
      const cmp = aVal.localeCompare(bVal);
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [leads, query, sortDir, sortKey]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((dir) => (dir === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDir("asc");
  }

  function exportCsv() {
    const headers = [
      "name",
      "email",
      "phone",
      "school",
      "grad_year",
      "role_type",
      "industries",
      "linkedin",
      "referral",
      "created_at",
    ];
    const lines = [
      headers.join(","),
      ...filtered.map((lead) =>
        [
          lead.name,
          lead.email,
          lead.phone ?? "",
          lead.school ?? "",
          lead.grad_year ?? "",
          lead.role_type ?? "",
          lead.industries ?? "",
          lead.linkedin ?? "",
          lead.referral ?? "",
          lead.created_at,
        ]
          .map((cell) => escapeCsv(cell))
          .join(","),
      ),
    ];

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `dearcc-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  const columns: Array<{ key: SortKey; label: string }> = [
    { key: "name", label: "name" },
    { key: "email", label: "email" },
    { key: "phone", label: "phone" },
    { key: "school", label: "school" },
    { key: "grad_year", label: "grad year" },
    { key: "role_type", label: "role type" },
    { key: "industries", label: "industries" },
    { key: "created_at", label: "date" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="search name, email, or phone"
          className="w-full max-w-md rounded-lg border border-[#2a2a2a] bg-[#111111] px-3 py-2 text-sm text-[#f0f0f0] outline-none focus:border-[#e8ff47] sm:w-auto"
        />
        <button
          type="button"
          onClick={exportCsv}
          className="rounded-lg border border-[#2a2a2a] px-4 py-2 text-sm transition hover:border-[#e8ff47]"
        >
          export csv
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-[#2a2a2a]">
        <table className="w-full min-w-[720px] border-collapse font-mono text-xs">
          <thead>
            <tr className="border-b border-[#2a2a2a] bg-[#111111] text-left text-[#555555]">
              {columns.map((column) => (
                <th key={column.key} className="px-3 py-2 font-medium">
                  <button
                    type="button"
                    onClick={() => toggleSort(column.key)}
                    className="transition hover:text-[#e8ff47]"
                  >
                    {column.label}
                    {sortKey === column.key ? (sortDir === "asc" ? " ↑" : " ↓") : ""}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((lead, index) => (
              <tr
                key={lead.id}
                className={index % 2 === 0 ? "bg-[#0a0a0a]" : "bg-[#0f0f0f]"}
              >
                <td className="px-3 py-2">{lead.name}</td>
                <td className="px-3 py-2">{lead.email}</td>
                <td className="px-3 py-2">{lead.phone ?? "—"}</td>
                <td className="px-3 py-2">{lead.school ?? "—"}</td>
                <td className="px-3 py-2">{lead.grad_year ?? "—"}</td>
                <td className="px-3 py-2">{lead.role_type ?? "—"}</td>
                <td className="px-3 py-2">{lead.industries ?? "—"}</td>
                <td className="px-3 py-2 whitespace-nowrap">{lead.created_at}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-[#555555]">no leads match your search.</p>
      ) : null}
    </div>
  );
}
