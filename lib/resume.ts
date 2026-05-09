import { z } from "zod";

export const studentResumeIntakeSchema = z.object({
  name: z.string().max(160).optional().default(""),
  email: z.string().max(240).optional().default(""),
  phone: z.string().max(80).optional().default(""),
  location: z.string().max(160).optional().default(""),
  degree: z.string().max(1200).optional().default(""),
  coolProjects: z.string().max(4000).optional().default(""),
  clubs: z.string().max(4000).optional().default(""),
  shippedProjects: z.string().max(4000).optional().default(""),
  internships: z.string().max(4000).optional().default(""),
  fullTimeRoles: z.string().max(4000).optional().default(""),
});

export const generatedResumeSchema = z.object({
  resumeText: z.string().min(50).max(40000),
  sectionsUsed: z.array(z.string()),
  needsReview: z.array(z.string()),
});

export const generateStarterResumeRequestSchema = z.object({
  intake: studentResumeIntakeSchema.refine(
    (intake) =>
      [
        intake.degree,
        intake.coolProjects,
        intake.clubs,
        intake.shippedProjects,
        intake.internships,
        intake.fullTimeRoles,
      ].some((value) => value.trim().length > 0),
    {
      message: "Add at least one project, club, education, internship, or role.",
    },
  ),
  surveySummary: z.string().max(8000).optional().default(""),
  profileDraft: z.unknown().nullable().optional(),
});

export type StudentResumeIntake = z.infer<typeof studentResumeIntakeSchema>;
export type GeneratedResume = z.infer<typeof generatedResumeSchema>;
export type GenerateStarterResumeRequest = z.infer<typeof generateStarterResumeRequestSchema>;
