import { z } from "zod";

export const sourceTypeSchema = z.enum([
  "attendance",
  "score",
  "journal",
  "evidence",
  "feedback",
]);

const sourceSchema = z.object({
  sourceRef: z.string().regex(/^(ATT|SCR|JRN|EVD|FDB)-/),
  sourceType: sourceTypeSchema,
  label: z.string().min(1),
  observedAt: z.string().min(1),
  preview: z.string(),
}).passthrough();

const directQuoteSchema = z.object({
  text: z.string().min(1),
  sourceRef: z.string().regex(/^(ATT|SCR|JRN|EVD|FDB)-/),
}).passthrough();

const narrativeSectionSchema = z.object({
  sectionType: z.enum([
    "summary",
    "strength",
    "recent_change",
    "student_reflection",
    "support_context",
  ]),
  text: z.string(),
  sourceRefs: z.array(z.string().regex(/^(ATT|SCR|JRN|EVD|FDB)-/)),
  directQuote: directQuoteSchema.nullish(),
}).passthrough();

export const aiNarrativeResponseSchema = z.object({
  data: z.object({
    generatedAt: z.string().min(1),
    student: z.object({
      id: z.union([z.string(), z.number()]),
      name: z.string().min(1),
    }).passthrough(),
    period: z.object({
      dateFrom: z.string().min(1),
      dateTo: z.string().min(1),
    }).passthrough(),
    sourceSummary: z.record(z.string(), z.number().nonnegative()),
    sources: z.array(sourceSchema),
    narrative: z.object({
      title: z.string(),
      sections: z.array(narrativeSectionSchema),
      missingContext: z.array(z.string()),
    }).passthrough(),
    warnings: z.array(z.string()),
  }).passthrough(),
}).passthrough();

export type AiNarrativeResponse = z.infer<typeof aiNarrativeResponseSchema>;
export type AiNarrativeSourceType = z.infer<typeof sourceTypeSchema>;
