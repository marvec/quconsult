import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import { FrontmatterSchema, type Card } from './types';

const DIMENSIONS = ['data', 'lide', 'strategie', 'provoz', 'icp'] as const;
export type DimDir = typeof DIMENSIONS[number] | string;

export async function loadCards(rootDir: string, dirs: readonly DimDir[] = DIMENSIONS): Promise<Card[]> {
  const cards: Card[] = [];
  for (const dir of dirs) {
    const dimPath = path.join(rootDir, dir);
    let entries: string[];
    try {
      entries = await readdir(dimPath);
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') continue;
      throw err;
    }
    for (const entry of entries) {
      if (!entry.endsWith('.md')) continue;
      const filepath = path.join(dimPath, entry);
      const raw = await readFile(filepath, 'utf-8');
      const { data, content } = matter(raw);
      const fmResult = FrontmatterSchema.safeParse({
        ...data,
        id: data.id ?? path.basename(entry, '.md'),
      });
      if (!fmResult.success) {
        throw new Error(`Invalid frontmatter in ${filepath}: ${fmResult.error.message}`);
      }
      cards.push({ frontmatter: fmResult.data, body: content.trim(), filepath });
    }
  }
  return cards;
}
