import { getDatabaseUrl, getSql } from "@/lib/db";
import { ensureCoreSchema } from "@/lib/database/core-schema";

export type ConversionRecord = {
  conversionId: string;
  candidateId: string;
  userId: string;
  convertedAt: string;
  conversionSource: string;
  candidateEmail: string;
  userEmail: string;
};

export async function listCandidateConversions(): Promise<ConversionRecord[]> {
  if (!getDatabaseUrl()) {
    return [];
  }

  await ensureCoreSchema();
  const sql = getSql();

  const rows = await sql<
    Array<{
      conversion_id: string;
      candidate_id: string;
      user_id: string;
      converted_at: Date | string;
      conversion_source: string;
      candidate_email: string;
      user_email: string;
    }>
  >`
    select
      cc.conversion_id,
      cc.candidate_id,
      cc.user_id,
      cc.converted_at,
      cc.conversion_source,
      c.email as candidate_email,
      u.email as user_email
    from candidate_conversions cc
    join candidates c on c.candidate_id = cc.candidate_id
    join users u on u.user_id = cc.user_id
    order by cc.converted_at desc
  `;

  return rows.map((row) => ({
    conversionId: row.conversion_id,
    candidateId: row.candidate_id,
    userId: row.user_id,
    convertedAt: new Date(row.converted_at).toISOString(),
    conversionSource: row.conversion_source,
    candidateEmail: row.candidate_email,
    userEmail: row.user_email,
  }));
}
