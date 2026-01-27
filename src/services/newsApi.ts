import type { SpaceArticle } from '@/types';

const BASE_URL = 'https://api.spaceflightnewsapi.net/v4';

async function fetchAPI<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${BASE_URL}${endpoint}`);
  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

interface ArticlesResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: SpaceArticle[];
}

export async function getLatestArticles(limit = 10): Promise<SpaceArticle[]> {
  const data = await fetchAPI<ArticlesResponse>(`/articles/?limit=${limit}&ordering=-published_at`);
  return data.results;
}

export async function getFeaturedArticles(limit = 5): Promise<SpaceArticle[]> {
  const data = await fetchAPI<ArticlesResponse>(`/articles/?limit=${limit}&is_featured=true`);
  return data.results;
}

export async function searchArticles(query: string, limit = 10): Promise<SpaceArticle[]> {
  const data = await fetchAPI<ArticlesResponse>(
    `/articles/?search=${encodeURIComponent(query)}&limit=${limit}`
  );
  return data.results;
}

export async function getArticlesBySource(source: string, limit = 10): Promise<SpaceArticle[]> {
  const data = await fetchAPI<ArticlesResponse>(
    `/articles/?news_site=${encodeURIComponent(source)}&limit=${limit}`
  );
  return data.results;
}

// Mock data for development/fallback
export function getMockArticles(): SpaceArticle[] {
  return [
    {
      id: 1,
      title: 'SpaceX Successfully Launches 23 Starlink Satellites',
      url: 'https://example.com/article1',
      image_url: 'https://images.unsplash.com/photo-1516849841032-87cbac4d88f7?w=800',
      news_site: 'SpaceNews',
      summary: 'SpaceX has successfully launched another batch of Starlink satellites from Cape Canaveral, continuing its rapid deployment of the mega-constellation.',
      published_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      featured: true,
    },
    {
      id: 2,
      title: 'NASA Artemis III Mission Update: New Timeline Announced',
      url: 'https://example.com/article2',
      image_url: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=800',
      news_site: 'NASA Spaceflight',
      summary: 'NASA has announced an updated timeline for the Artemis III mission, which aims to return humans to the lunar surface for the first time since Apollo 17.',
      published_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      featured: true,
    },
    {
      id: 3,
      title: 'Blue Origin Prepares for New Glenn Maiden Flight',
      url: 'https://example.com/article3',
      image_url: 'https://images.unsplash.com/photo-1457364559154-aa2644600ebb?w=800',
      news_site: 'Spaceflight Now',
      summary: 'Blue Origin is preparing for the highly anticipated maiden flight of New Glenn, the company\'s heavy-lift orbital rocket.',
      published_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
      featured: false,
    },
    {
      id: 4,
      title: 'ESA Selects New Astronaut Class for Future Missions',
      url: 'https://example.com/article4',
      image_url: 'https://images.unsplash.com/photo-1454789548928-9efd52dc4031?w=800',
      news_site: 'SpaceNews',
      summary: 'The European Space Agency has selected a new class of astronauts who will participate in upcoming missions to the ISS and beyond.',
      published_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      featured: false,
    },
    {
      id: 5,
      title: 'India\'s ISRO Plans Ambitious Venus Mission',
      url: 'https://example.com/article5',
      image_url: 'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?w=800',
      news_site: 'The Space Review',
      summary: 'ISRO has unveiled plans for Shukrayaan-1, an orbiter mission to Venus that will study the planet\'s atmosphere and surface.',
      published_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      featured: false,
    },
    {
      id: 6,
      title: 'James Webb Telescope Discovers New Exoplanet Atmosphere',
      url: 'https://example.com/article6',
      image_url: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=800',
      news_site: 'NASA Spaceflight',
      summary: 'The James Webb Space Telescope has detected a complex atmosphere on a distant exoplanet, revealing potential signs of habitability.',
      published_at: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
      featured: true,
    },
    {
      id: 7,
      title: 'Rocket Lab Announces New Venus Mission Partnership',
      url: 'https://example.com/article7',
      image_url: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=800',
      news_site: 'SpaceNews',
      summary: 'Rocket Lab has partnered with MIT to send a probe to Venus to search for signs of life in the planet\'s atmosphere.',
      published_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
      featured: false,
    },
    {
      id: 8,
      title: 'China Successfully Docks Shenzhou Spacecraft with Tiangong',
      url: 'https://example.com/article8',
      image_url: 'https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=800',
      news_site: 'Spaceflight Now',
      summary: 'Chinese astronauts have successfully docked with the Tiangong space station, beginning a six-month mission aboard the orbital outpost.',
      published_at: new Date(Date.now() - 60 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 60 * 60 * 60 * 1000).toISOString(),
      featured: false,
    },
  ];
}
