import { defineCollection } from "astro:content";
import { z } from "astro:schema";
import { glob } from "astro/loaders";

const tym = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/tym" }),
  schema: z.object({
    name: z.string(),
    role: z.string(),
    bio: z.string().min(20).max(400),
    photo: z.string().optional(),
    photoAlt: z.string().optional(),
    linkedin: z.string().url().optional(),
    order: z.number().int().nonnegative(),
    hidden: z.boolean().default(false),
    services: z
      .array(
        z.enum([
          "analyza-a-strategie",
          "automatizace-procesu",
          "skoleni",
          "implementace-a-vyvoj",
        ]),
      )
      .default([]),
  }),
});

const sluzby = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/sluzby" }),
  schema: z.object({
    title: z.string(),
    eyebrow: z.string().optional(),
    heroSubtitle: z.string(),
    metaDescription: z.string().min(50).max(160),
    summary: z.string(),
    forWho: z.string(),
    audiences: z
      .array(
        z.object({
          title: z.string(),
          body: z.string(),
        }),
      )
      .default([]),
    typicalOutcome: z.string(),
    priceFrom: z.string(),
    pricingNote: z.string().optional(),
    deliveryModel: z.string(),
    tags: z.array(z.string()).default([]),
    seoKeywords: z.array(z.string()).default([]),
    order: z.number().int().nonnegative(),
    primaryEntry: z.boolean().default(false),
    faq: z
      .array(
        z.object({
          question: z.string(),
          answer: z.string(),
        }),
      )
      .default([]),
  }),
});

const blog = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/blog" }),
  schema: z.object({
    title: z.string().min(10).max(120),
    description: z.string().min(50).max(180),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    author: z.enum(["martin", "marek", "lukas", "jiri", "miroslav"]),
    tags: z.array(z.string()).default([]),
    ogImage: z.string().optional(),
    draft: z.boolean().default(false),
    placeholder: z.boolean().default(false),
  }),
});

export const collections = { tym, sluzby, blog };
