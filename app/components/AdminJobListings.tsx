"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { JobListing } from "@/lib/job-listings";

type AdminJobListingsProps = {
  initialListings: JobListing[];
  storeLabel: string;
};

type FormState = {
  title: string;
  company: string;
  location: string;
  sourceUrl: string;
  description: string;
  active: boolean;
};

const emptyForm: FormState = {
  title: "",
  company: "",
  location: "",
  sourceUrl: "",
  description: "",
  active: true,
};

export function AdminJobListings({ initialListings, storeLabel }: AdminJobListingsProps) {
  const router = useRouter();
  const [listings, setListings] = useState(initialListings);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  function startEdit(listing: JobListing) {
    setEditingId(listing.id);
    setForm({
      title: listing.title,
      company: listing.company,
      location: listing.location,
      sourceUrl: listing.sourceUrl,
      description: listing.description,
      active: listing.active,
    });
    setError("");
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
  }

  async function refreshListings() {
    const response = await fetch("/api/job-listings");
    const payload = (await response.json()) as { listings?: JobListing[] };
    if (response.ok && payload.listings) {
      setListings(payload.listings);
    }
    router.refresh();
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setIsSaving(true);

    try {
      const response = editingId
        ? await fetch(`/api/job-listings/${editingId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
          })
        : await fetch("/api/job-listings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
          });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Could not save job listing.");
      }

      cancelEdit();
      await refreshListings();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save job listing.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this job listing?")) {
      return;
    }

    setError("");
    setIsSaving(true);

    try {
      const response = await fetch(`/api/job-listings/${id}`, { method: "DELETE" });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Could not delete job listing.");
      }

      if (editingId === id) {
        cancelEdit();
      }
      await refreshListings();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Could not delete job listing.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader className="space-y-2 border-b border-border/60 p-8 md:p-10">
        <CardTitle className="text-xl tracking-tight">Job listings library</CardTitle>
        <CardDescription className="text-base leading-relaxed">
          Curated job postings stored for reference and admin use.
        </CardDescription>
        <p className="text-sm font-medium text-muted-foreground">
          Storage: <span className="text-card-foreground">{storeLabel}</span>
        </p>
      </CardHeader>

      <CardContent className="grid gap-10 p-8 md:p-10">
        <form className="grid gap-5 rounded-2xl border border-border/70 bg-muted/30 p-6" onSubmit={(e) => void handleSubmit(e)}>
          <p className="m-0 text-sm font-semibold text-foreground">
            {editingId ? "Edit listing" : "Add listing"}
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="listing-title">Title</Label>
              <Input
                id="listing-title"
                value={form.title}
                onChange={(e) => setForm((current) => ({ ...current, title: e.target.value }))}
                placeholder="Senior Product Manager"
                required
                disabled={isSaving}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="listing-company">Company</Label>
              <Input
                id="listing-company"
                value={form.company}
                onChange={(e) => setForm((current) => ({ ...current, company: e.target.value }))}
                placeholder="Acme Corp"
                disabled={isSaving}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="listing-location">Location</Label>
              <Input
                id="listing-location"
                value={form.location}
                onChange={(e) => setForm((current) => ({ ...current, location: e.target.value }))}
                placeholder="Remote / NYC"
                disabled={isSaving}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="listing-url">Source URL (optional)</Label>
              <Input
                id="listing-url"
                type="url"
                value={form.sourceUrl}
                onChange={(e) => setForm((current) => ({ ...current, sourceUrl: e.target.value }))}
                placeholder="https://..."
                disabled={isSaving}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="listing-description">Job description</Label>
            <Textarea
              id="listing-description"
              value={form.description}
              onChange={(e) => setForm((current) => ({ ...current, description: e.target.value }))}
              rows={10}
              className="min-h-[180px] rounded-xl font-mono text-sm"
              placeholder="Paste the full job description (at least 80 characters)…"
              required
              disabled={isSaving}
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm((current) => ({ ...current, active: e.target.checked }))}
              disabled={isSaving}
            />
            Show in library
          </label>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <div className="flex flex-wrap gap-3">
            <Button type="submit" className="rounded-2xl" disabled={isSaving}>
              {editingId ? "Save changes" : "Add listing"}
            </Button>
            {editingId ? (
              <Button type="button" variant="outline" className="rounded-2xl" onClick={cancelEdit} disabled={isSaving}>
                Cancel
              </Button>
            ) : null}
          </div>
        </form>

        {listings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border/70 bg-muted/40">
                  <th className="px-4 py-3 font-semibold">Role</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {listings.map((listing) => (
                  <tr key={listing.id} className="border-b border-border/55 last:border-0">
                    <td className="px-4 py-4 align-top">
                      <p className="font-medium text-foreground">{listing.title}</p>
                      <p className="mt-1 text-muted-foreground">
                        {[listing.company, listing.location].filter(Boolean).join(" · ") || "—"}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {listing.description.length.toLocaleString()} chars
                      </p>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <span
                        className={
                          listing.active
                            ? "text-emerald-700 dark:text-emerald-300"
                            : "text-muted-foreground"
                        }
                      >
                        {listing.active ? "Active" : "Hidden"}
                      </span>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <div className="flex flex-col gap-2">
                        {listing.sourceUrl.trim() ? (
                          <a
                            className="font-medium text-foreground underline-offset-4 hover:underline"
                            href={listing.sourceUrl}
                            rel="noreferrer"
                            target="_blank"
                          >
                            View posting
                          </a>
                        ) : null}
                        <button
                          type="button"
                          className="w-fit text-left font-medium text-foreground underline-offset-4 hover:underline"
                          onClick={() => startEdit(listing)}
                          disabled={isSaving}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="w-fit text-left text-destructive underline-offset-4 hover:underline"
                          onClick={() => void handleDelete(listing.id)}
                          disabled={isSaving}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No job listings yet. Add one above to build your library.</p>
        )}
      </CardContent>
    </Card>
  );
}
