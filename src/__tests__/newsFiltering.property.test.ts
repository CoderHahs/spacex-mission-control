import * as fc from "fast-check";
import { describe, expect, it } from "vitest";
import { isArtemisRelated, partitionArticles } from "../services/newsApi";
import type { SpaceArticle } from "../types/index";

/**
 * Property 10: News feed Artemis filtering
 *
 * Featured section contains only Artemis-related articles, and no
 * Artemis-related articles appear exclusively in the non-featured section.
 *
 * **Validates: Requirement 12.2**
 */

/** Arbitrary generator for SpaceArticle objects. */
const arbSpaceArticle: fc.Arbitrary<SpaceArticle> = fc.record({
    id: fc.integer({ min: 1, max: 1_000_000 }),
    title: fc.string({ minLength: 0, maxLength: 200 }),
    url: fc.webUrl(),
    image_url: fc.webUrl(),
    news_site: fc.string({ minLength: 1, maxLength: 50 }),
    summary: fc.string({ minLength: 0, maxLength: 500 }),
    published_at: fc.date({ noInvalidDate: true }).map((d) => d.toISOString()),
    updated_at: fc.date({ noInvalidDate: true }).map((d) => d.toISOString()),
    featured: fc.boolean(),
});

/**
 * Generator that sometimes injects Artemis keywords into title or summary
 * to ensure we get a good mix of Artemis-related and non-related articles.
 */
const ARTEMIS_KEYWORDS = [
    "artemis",
    "Orion spacecraft",
    "SLS",
    "Space Launch System",
];

const arbMixedArticle: fc.Arbitrary<SpaceArticle> = fc.oneof(
    arbSpaceArticle,
    arbSpaceArticle.chain((article) =>
        fc.constantFrom(...ARTEMIS_KEYWORDS).map((keyword) => ({
            ...article,
            title: `${article.title} ${keyword}`,
        })),
    ),
    arbSpaceArticle.chain((article) =>
        fc.constantFrom(...ARTEMIS_KEYWORDS).map((keyword) => ({
            ...article,
            summary: `${article.summary} ${keyword}`,
        })),
    ),
);

describe("Property 10: News feed Artemis filtering", () => {
    it("every featured article is Artemis-related", () => {
        fc.assert(
            fc.property(
                fc.array(arbMixedArticle, { maxLength: 50 }),
                (articles) => {
                    const { featured } = partitionArticles(articles);

                    for (const article of featured) {
                        expect(isArtemisRelated(article)).toBe(true);
                    }
                },
            ),
            { numRuns: 500 },
        );
    });

    it("no article in recent is Artemis-related", () => {
        fc.assert(
            fc.property(
                fc.array(arbMixedArticle, { maxLength: 50 }),
                (articles) => {
                    const { recent } = partitionArticles(articles);

                    for (const article of recent) {
                        expect(isArtemisRelated(article)).toBe(false);
                    }
                },
            ),
            { numRuns: 500 },
        );
    });

    it("all input articles appear in exactly one of featured or recent (no loss, no duplication)", () => {
        fc.assert(
            fc.property(
                fc.array(arbMixedArticle, { maxLength: 50 }),
                (articles) => {
                    const { featured, recent } = partitionArticles(articles);

                    // Total count is preserved
                    expect(featured.length + recent.length).toBe(
                        articles.length,
                    );

                    // Every input article is present in the output (order may differ)
                    const output = [...featured, ...recent];
                    for (const article of articles) {
                        expect(output).toContainEqual(article);
                    }
                },
            ),
            { numRuns: 500 },
        );
    });
});
