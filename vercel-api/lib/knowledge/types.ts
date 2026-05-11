import { z } from 'zod';

export const TriggerSchema = z.union([
  z.object({ field: z.string(), equals: z.string() }),
  z.object({ field: z.string(), in: z.array(z.string()).min(1) }),
  z.object({ field: z.string(), includes: z.string() }),
  z.object({
    dimension: z.enum(['data', 'lide', 'strategie', 'provoz']),
    scoreBand: z.tuple([z.number().int().min(0).max(100), z.number().int().min(0).max(100)]),
  }),
  z.object({
    total: z.literal(true).optional(),
    scoreBand: z.tuple([z.number().int().min(0).max(100), z.number().int().min(0).max(100)]),
  }),
]);

export type Trigger = z.infer<typeof TriggerSchema>;

export const FrontmatterSchema = z.object({
  id: z.string().min(1),
  dimension: z.enum(['data', 'lide', 'strategie', 'provoz', 'icp']),
  priority: z.number().int().min(1).max(10),
  weight: z.enum(['must', 'may']),
  triggers: z.array(TriggerSchema).min(1),
});

export type Frontmatter = z.infer<typeof FrontmatterSchema>;

export interface Card {
  frontmatter: Frontmatter;
  body: string;          // Markdown text after frontmatter
  filepath: string;      // for debugging
}
