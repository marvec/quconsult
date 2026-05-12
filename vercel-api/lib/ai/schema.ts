import { z } from 'zod';

export const ReadinessReport = z.object({
  paragraphs: z.object({
    data: z.string().min(400).max(2000),
    lide: z.string().min(400).max(2000),
    strategie: z.string().min(400).max(2000),
    provoz: z.string().min(400).max(2000),
  }),
  nextSteps: z.array(z.string().min(50).max(400)).length(3),
  oneLineSummary: z.string().min(40).max(200),
});

export type ReadinessReport = z.infer<typeof ReadinessReport>;
