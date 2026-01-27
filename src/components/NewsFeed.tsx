import { useState, useMemo } from 'react';
import type { SpaceArticle } from '@/types';
import { getMockArticles } from '@/services/newsApi';
import { formatDate, truncateText } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Newspaper,
  Search,
  ExternalLink,
  Calendar,
  Star,
  Filter,
  RefreshCw
} from 'lucide-react';

interface NewsCardProps {
  article: SpaceArticle;
  featured?: boolean;
}

function NewsCard({ article, featured = false }: NewsCardProps) {
  return (
    <Card className={`news-card overflow-hidden ${featured ? 'gradient-border' : ''}`}>
      <div className={`flex ${featured ? 'flex-col md:flex-row' : 'flex-col'}`}>
        <div className={`relative overflow-hidden ${featured ? 'w-full md:w-1/3 h-48 md:h-auto' : 'w-full h-48'}`}>
          <img
            src={article.image_url}
            alt={article.title}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=800';
            }}
          />
          {article.featured && (
            <Badge className="absolute top-2 left-2 bg-yellow-500">
              <Star className="h-3 w-3 mr-1" />
              Featured
            </Badge>
          )}
        </div>
        <div className={`p-4 ${featured ? 'md:w-2/3' : ''}`}>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="text-xs">
              {article.news_site}
            </Badge>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(article.published_at)}
            </span>
          </div>
          
          <h3 className={`font-semibold mb-2 ${featured ? 'text-xl' : 'text-base'}`}>
            {article.title}
          </h3>
          
          <p className="text-sm text-muted-foreground mb-4">
            {truncateText(article.summary, featured ? 250 : 120)}
          </p>

          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => window.open(article.url, '_blank')}
          >
            Read More
            <ExternalLink className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

export function NewsFeed() {
  const [articles] = useState<SpaceArticle[]>(getMockArticles());
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);

  const sources = useMemo(() => {
    const uniqueSources = [...new Set(articles.map((a) => a.news_site))];
    return uniqueSources.sort();
  }, [articles]);

  const filteredArticles = useMemo(() => {
    let result = [...articles];

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (article) =>
          article.title.toLowerCase().includes(query) ||
          article.summary.toLowerCase().includes(query)
      );
    }

    // Filter by source
    if (sourceFilter !== 'all') {
      result = result.filter((article) => article.news_site === sourceFilter);
    }

    // Filter featured only
    if (showFeaturedOnly) {
      result = result.filter((article) => article.featured);
    }

    return result;
  }, [articles, searchQuery, sourceFilter, showFeaturedOnly]);

  const featuredArticle = articles.find((a) => a.featured);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Newspaper className="h-5 w-5" />
                Space News Feed
              </CardTitle>
              <CardDescription>
                Latest news and articles from the space industry
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-full md:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                {sources.map((source) => (
                  <SelectItem key={source} value={source}>
                    {source}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant={showFeaturedOnly ? 'default' : 'outline'}
              onClick={() => setShowFeaturedOnly(!showFeaturedOnly)}
              className="gap-2"
            >
              <Star className="h-4 w-4" />
              Featured Only
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Featured Article */}
      {featuredArticle && !searchQuery && sourceFilter === 'all' && !showFeaturedOnly && (
        <>
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Featured Story
            </h2>
            <NewsCard article={featuredArticle} featured />
          </div>
          <Separator />
        </>
      )}

      {/* Articles Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            {showFeaturedOnly ? 'Featured Articles' : 'Latest Articles'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {filteredArticles.length} article{filteredArticles.length !== 1 ? 's' : ''}
          </p>
        </div>

        <ScrollArea className="h-[700px]">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 pr-4">
            {filteredArticles
              .filter((a) => !a.featured || searchQuery || sourceFilter !== 'all' || showFeaturedOnly)
              .map((article) => (
                <NewsCard key={article.id} article={article} />
              ))}
          </div>
          
          {filteredArticles.length === 0 && (
            <Card>
              <CardContent className="pt-6 text-center">
                <Newspaper className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No articles found matching your criteria</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    setSearchQuery('');
                    setSourceFilter('all');
                    setShowFeaturedOnly(false);
                  }}
                >
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          )}
        </ScrollArea>
      </div>

      {/* News Sources */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">News Sources</CardTitle>
          <CardDescription>Aggregating news from leading space media outlets</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {sources.map((source) => (
              <Badge
                key={source}
                variant={sourceFilter === source ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setSourceFilter(sourceFilter === source ? 'all' : source)}
              >
                {source}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
