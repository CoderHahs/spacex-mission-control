import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useAsync } from "@/hooks/useAsync";
import { formatDate, truncateText } from "@/lib/utils";
import { fetchArticles, type NewsFeedResult } from "@/services/newsApi";
import type { SpaceArticle } from "@/types";
import {
    AlertCircle,
    Calendar,
    ExternalLink,
    Filter,
    Newspaper,
    RefreshCw,
    Search,
    Star,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";

interface NewsCardProps {
    article: SpaceArticle;
    featured?: boolean;
}

function NewsCard({ article, featured = false }: NewsCardProps) {
    return (
        <Card
            className={`news-card overflow-hidden ${featured ? "gradient-border" : ""}`}
        >
            <div
                className={`flex ${featured ? "flex-col md:flex-row" : "flex-col"}`}
            >
                <div
                    className={`relative overflow-hidden ${featured ? "w-full md:w-1/3 h-48 md:h-auto" : "w-full h-48"}`}
                >
                    <img
                        src={article.image_url}
                        alt={article.title}
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                        onError={(e) => {
                            (e.target as HTMLImageElement).src =
                                "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=800";
                        }}
                    />
                    {article.featured && (
                        <Badge className="absolute top-2 left-2 bg-yellow-500">
                            <Star className="h-3 w-3 mr-1" />
                            Featured
                        </Badge>
                    )}
                </div>
                <div className={`p-4 ${featured ? "md:w-2/3" : ""}`}>
                    <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">
                            {article.news_site}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(article.published_at)}
                        </span>
                    </div>

                    <h3
                        className={`font-semibold mb-2 ${featured ? "text-xl" : "text-base"}`}
                    >
                        {article.title}
                    </h3>

                    <p className="text-sm text-muted-foreground mb-4">
                        {truncateText(article.summary, featured ? 250 : 120)}
                    </p>

                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() => window.open(article.url, "_blank")}
                    >
                        Read More
                        <ExternalLink className="h-3 w-3" />
                    </Button>
                </div>
            </div>
        </Card>
    );
}

function NewsCardSkeleton({ featured = false }: { featured?: boolean }) {
    return (
        <Card className="overflow-hidden">
            <div
                className={`flex ${featured ? "flex-col md:flex-row" : "flex-col"}`}
            >
                <div
                    className={`bg-muted animate-pulse ${featured ? "w-full md:w-1/3 h-48 md:h-auto min-h-[12rem]" : "w-full h-48"}`}
                />
                <div className={`p-4 space-y-3 ${featured ? "md:w-2/3" : ""}`}>
                    <div className="flex gap-2">
                        <div className="h-5 w-20 bg-muted animate-pulse rounded" />
                        <div className="h-5 w-28 bg-muted animate-pulse rounded" />
                    </div>
                    <div className="h-6 w-3/4 bg-muted animate-pulse rounded" />
                    <div className="space-y-2">
                        <div className="h-4 w-full bg-muted animate-pulse rounded" />
                        <div className="h-4 w-2/3 bg-muted animate-pulse rounded" />
                    </div>
                    <div className="h-8 w-24 bg-muted animate-pulse rounded" />
                </div>
            </div>
        </Card>
    );
}

function LoadingSkeleton() {
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Newspaper className="h-5 w-5" />
                                Space News Feed
                            </CardTitle>
                            <CardDescription>
                                Loading latest articles...
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            <div>
                <div className="h-6 w-40 bg-muted animate-pulse rounded mb-4" />
                <NewsCardSkeleton featured />
            </div>

            <Separator />

            <div>
                <div className="h-6 w-36 bg-muted animate-pulse rounded mb-4" />
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <NewsCardSkeleton key={i} />
                    ))}
                </div>
            </div>
        </div>
    );
}

export function NewsFeed() {
    const fetchNews = useCallback(() => fetchArticles(20), []);
    const { data, error, loading, refetch } =
        useAsync<NewsFeedResult>(fetchNews);

    const [searchQuery, setSearchQuery] = useState("");
    const [sourceFilter, setSourceFilter] = useState<string>("all");
    const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);

    const allArticles = useMemo(() => {
        if (!data) return [];
        return [...data.featured, ...data.recent];
    }, [data]);

    const sources = useMemo(() => {
        const uniqueSources = [...new Set(allArticles.map((a) => a.news_site))];
        return uniqueSources.sort();
    }, [allArticles]);

    const filteredRecent = useMemo(() => {
        let result = data?.recent ?? [];

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(
                (article) =>
                    article.title.toLowerCase().includes(query) ||
                    article.summary.toLowerCase().includes(query),
            );
        }

        if (sourceFilter !== "all") {
            result = result.filter(
                (article) => article.news_site === sourceFilter,
            );
        }

        return result;
    }, [data, searchQuery, sourceFilter]);

    const filteredFeatured = useMemo(() => {
        let result = data?.featured ?? [];

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(
                (article) =>
                    article.title.toLowerCase().includes(query) ||
                    article.summary.toLowerCase().includes(query),
            );
        }

        if (sourceFilter !== "all") {
            result = result.filter(
                (article) => article.news_site === sourceFilter,
            );
        }

        return result;
    }, [data, searchQuery, sourceFilter]);

    if (loading) {
        return <LoadingSkeleton />;
    }

    if (error) {
        return (
            <div className="space-y-6">
                <Card>
                    <CardContent className="pt-6 text-center">
                        <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
                        <h3 className="text-lg font-semibold mb-2">
                            Unable to load news
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            {error.message ||
                                "Failed to fetch articles from Spaceflight News API."}
                        </p>
                        <Button onClick={refetch} className="gap-2">
                            <RefreshCw className="h-4 w-4" />
                            Retry
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const displayArticles = showFeaturedOnly
        ? filteredFeatured
        : [...filteredFeatured, ...filteredRecent];

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
                        <Button
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            onClick={refetch}
                        >
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
                        <Select
                            value={sourceFilter}
                            onValueChange={setSourceFilter}
                        >
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
                            variant={showFeaturedOnly ? "default" : "outline"}
                            onClick={() =>
                                setShowFeaturedOnly(!showFeaturedOnly)
                            }
                            className="gap-2"
                        >
                            <Star className="h-4 w-4" />
                            Featured Only
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Featured Artemis Articles */}
            {filteredFeatured.length > 0 &&
                !showFeaturedOnly &&
                !searchQuery &&
                sourceFilter === "all" && (
                    <>
                        <div>
                            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Star className="h-5 w-5 text-yellow-500" />
                                Artemis &amp; Featured Stories
                            </h2>
                            <div className="space-y-4">
                                {filteredFeatured.map((article) => (
                                    <NewsCard
                                        key={article.id}
                                        article={article}
                                        featured
                                    />
                                ))}
                            </div>
                        </div>
                        <Separator />
                    </>
                )}

            {/* Articles Grid */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">
                        {showFeaturedOnly
                            ? "Artemis & Featured Articles"
                            : "Recent Articles"}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        {showFeaturedOnly
                            ? filteredFeatured.length
                            : filteredRecent.length}{" "}
                        article
                        {(showFeaturedOnly
                            ? filteredFeatured.length
                            : filteredRecent.length) !== 1
                            ? "s"
                            : ""}
                    </p>
                </div>

                <ScrollArea className="h-[700px]">
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 pr-4">
                        {(showFeaturedOnly
                            ? filteredFeatured
                            : filteredRecent
                        ).map((article) => (
                            <NewsCard key={article.id} article={article} />
                        ))}
                    </div>

                    {displayArticles.length === 0 && (
                        <Card>
                            <CardContent className="pt-6 text-center">
                                <Newspaper className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                <p className="text-muted-foreground">
                                    No articles found matching your criteria
                                </p>
                                <Button
                                    variant="outline"
                                    className="mt-4"
                                    onClick={() => {
                                        setSearchQuery("");
                                        setSourceFilter("all");
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
            {sources.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">News Sources</CardTitle>
                        <CardDescription>
                            Aggregating news from leading space media outlets
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {sources.map((source) => (
                                <Badge
                                    key={source}
                                    variant={
                                        sourceFilter === source
                                            ? "default"
                                            : "outline"
                                    }
                                    className="cursor-pointer"
                                    onClick={() =>
                                        setSourceFilter(
                                            sourceFilter === source
                                                ? "all"
                                                : source,
                                        )
                                    }
                                >
                                    {source}
                                </Badge>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
