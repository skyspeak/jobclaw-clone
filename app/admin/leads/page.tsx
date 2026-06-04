import { Geist_Mono } from "next/font/google";

import { AdminTable } from "@/app/components/lead-gen/AdminTable";
import { isValidLeadGenAdminKey } from "@/lib/leads/admin";
import { listLeads } from "@/lib/leads/db";

const geistMono = Geist_Mono({
  subsets: ["latin"],
});

export const dynamic = "force-dynamic";

type AdminLeadsPageProps = {
  searchParams: Promise<{ key?: string | string[] }>;
};

export default async function AdminLeadsPage({ searchParams }: AdminLeadsPageProps) {
  const params = await searchParams;
  const key = Array.isArray(params.key) ? params.key[0] : params.key;

  if (!isValidLeadGenAdminKey(key)) {
    return (
      <div
        className={`${geistMono.className} flex min-h-dvh items-center justify-center bg-[#0a0a0a] px-6 font-mono text-sm text-[#555555]`}
      >
        <p>
          unauthorized — open{" "}
          <code className="text-[#f0f0f0]">/admin/leads?key=YOUR_SECRET</code> (set{" "}
          <code className="text-[#f0f0f0]">LEAD_GEN_ADMIN_SECRET</code> in env)
        </p>
      </div>
    );
  }

  const leads = await listLeads();

  return (
    <div className={`${geistMono.className} min-h-dvh bg-[#0a0a0a] px-4 py-8 font-mono text-[#f0f0f0] sm:px-8`}>
      <header className="mb-8 border-b border-[#2a2a2a] pb-6">
        <p className="text-[10px] uppercase tracking-[0.18em] text-[#555555]">dear[CC] · admin</p>
        <h1 className="mt-2 text-2xl font-bold">lead submissions</h1>
        <p className="mt-2 text-sm text-[#555555]">{leads.length} total</p>
      </header>
      <AdminTable leads={leads} />
    </div>
  );
}
