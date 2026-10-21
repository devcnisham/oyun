import assert from 'node:assert/strict';
import { describe, test } from 'vitest';
import { getSportFaqs } from './sport-faqs';
import { SPORTS, sportSlug } from './sports';

describe('sport faqs for SEO', () => {
  test('every listed sport has curated long-tail FAQs', () => {
    for (const s of SPORTS) {
      const slug = sportSlug(s.value);
      const faqs = getSportFaqs(slug);
      assert.ok(faqs.length >= 3, `Expected at least 3 FAQs for ${s.value}`);
      for (const faq of faqs) {
        assert.ok(faq.q && faq.q.endsWith('?'), `Question should end with question mark: ${faq.q}`);
        assert.ok(faq.a && faq.a.length > 20, `Answer should be descriptive: ${faq.a}`);
      }
    }
  });

  test('unknown sport returns fallback FAQs', () => {
    const fallback = getSportFaqs('unknown-sport');
    assert.ok(fallback.length >= 2);
  });
});
