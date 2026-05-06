import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const posts = await getCollection('blog', ({ data }) => !data.placeholder && !data.draft);

  posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());

  return rss({
    title: 'QuConsult — blog',
    description: 'AI poradenství, automatizace, agentní systémy. Český B2B blog.',
    site: context.site!,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      author: post.data.author,
      categories: post.data.tags,
      link: `/blog/${post.id}`,
    })),
    customData: '<language>cs-cz</language>',
    trailingSlash: false,
  });
}
