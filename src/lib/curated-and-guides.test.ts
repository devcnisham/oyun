import assert from 'node:assert/strict';
import { describe, test } from 'vitest';
import { CURATED_COLLECTIONS, getCuratedCollection } from './curated-collections';
import { GUIDES, getGuide } from './guides-content';

describe('Curated Collections', () => {
  test('all curated collections have valid metadata and FAQs', () => {
    assert.ok(CURATED_COLLECTIONS.length >= 3);
    for (const c of CURATED_COLLECTIONS) {
      assert.ok(c.slug && /^[a-z0-9-]+$/.test(c.slug), `Invalid slug: ${c.slug}`);
      assert.ok(c.title && c.title.length > 5);
      assert.ok(c.metaTitle && c.metaTitle.length > 10);
      assert.ok(c.metaDescription && c.metaDescription.length > 20);
      assert.ok(c.faqs.length >= 2, `Collection ${c.slug} should have at least 2 FAQs`);
      assert.equal(getCuratedCollection(c.slug)?.slug, c.slug);
    }
  });

  test('unknown collection returns null', () => {
    assert.equal(getCuratedCollection('non-existent'), null);
  });
});

describe('SEO Guides', () => {
  test('all guides have structured content, cover image, and FAQs', () => {
    assert.ok(GUIDES.length >= 4);
    for (const g of GUIDES) {
      assert.ok(g.slug && /^[a-z0-9-]+$/.test(g.slug), `Invalid slug: ${g.slug}`);
      assert.ok(g.title && g.title.length > 10);
      assert.ok(g.metaTitle && g.metaTitle.length > 15);
      assert.ok(g.metaDescription && g.metaDescription.length > 30);
      assert.ok(g.sections.length >= 3, `Guide ${g.slug} should have at least 3 sections`);
      assert.ok(g.faqs.length >= 2, `Guide ${g.slug} should have at least 2 FAQs`);
      assert.equal(getGuide(g.slug)?.slug, g.slug);
    }
  });

  test('unknown guide returns null', () => {
    assert.equal(getGuide('non-existent'), null);
  });
});
