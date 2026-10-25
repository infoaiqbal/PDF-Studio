import test from 'node:test';
import assert from 'node:assert/strict';
import {
  toBengaliDigits,
  toArabicDigits,
  formatNumeral,
  generatePageNumberText,
  isPageExcluded,
  parsePageRangeString,
} from './numbering';

test('Bengali digit conversion works accurately', () => {
  assert.equal(toBengaliDigits(0), '০');
  assert.equal(toBengaliDigits(12345), '১২৩৪৫');
  assert.equal(toBengaliDigits(67890), '৬৭৮৯০');
  assert.equal(toBengaliDigits('page 42'), 'page ৪২');
});

test('Arabic digit conversion works accurately', () => {
  assert.equal(toArabicDigits(0), '٠');
  assert.equal(toArabicDigits(12345), '١٢٣٤٥');
  assert.equal(toArabicDigits(67890), '٦٧٨٩٠');
});

test('formatNumeral respects chosen numeral system', () => {
  assert.equal(formatNumeral(5, 'bengali'), '৫');
  assert.equal(formatNumeral(5, 'arabic'), '٥');
  assert.equal(formatNumeral(5, 'english'), '5');
});

test('generatePageNumberText generates correct localized strings', () => {
  // Bengali number only
  assert.equal(
    generatePageNumberText(1, 10, 'number_only', 'bengali', 1, 'bn'),
    '১'
  );

  // Bengali page of total
  assert.equal(
    generatePageNumberText(2, 5, 'page_of_total', 'bengali', 1, 'bn'),
    'পৃষ্ঠা ২ / ৫'
  );

  // English page of total
  assert.equal(
    generatePageNumberText(3, 10, 'page_of_total', 'english', 1, 'en'),
    'Page 3 of 10'
  );

  // Arabic page of total
  assert.equal(
    generatePageNumberText(1, 4, 'page_of_total', 'arabic', 1, 'en'),
    'صفحة ١ من ٤'
  );

  // Hyphenated
  assert.equal(
    generatePageNumberText(7, 20, 'hyphenated', 'bengali', 1, 'bn'),
    '- ৭ -'
  );

  // Custom text with prefix and suffix (e.g. 'নাশিদের ১ ডায়েরি')
  assert.equal(
    generatePageNumberText(1, 10, 'custom_text', 'bengali', 1, 'bn', 'নাশিদের ', ' ডায়েরি'),
    'নাশিদের ১ ডায়েরি'
  );
  assert.equal(
    generatePageNumberText(5, 10, 'custom_text', 'english', 1, 'en', 'Chapter ', ' - Draft'),
    'Chapter 5 - Draft'
  );
});

test('isPageExcluded handles skipFirstPage and custom excluded pages correctly', () => {
  // First page skipped
  assert.equal(isPageExcluded(1, [], true), true);
  assert.equal(isPageExcluded(2, [], true), false);

  // Specific excluded pages
  assert.equal(isPageExcluded(3, [3, 5, 7], false), true);
  assert.equal(isPageExcluded(4, [3, 5, 7], false), false);
  assert.equal(isPageExcluded(1, [3, 5, 7], true), true);

  // Even / Odd page filtering (জোড় / বিজোড় পৃষ্ঠা ফিল্টারিং)
  // Odd only (বিজোড়): page 1, 3, 5 allowed; page 2, 4, 6 excluded
  assert.equal(isPageExcluded(1, [], false, 'odd'), false); // page 1 included
  assert.equal(isPageExcluded(2, [], false, 'odd'), true);  // page 2 excluded
  assert.equal(isPageExcluded(3, [], false, 'odd'), false); // page 3 included
  assert.equal(isPageExcluded(4, [], false, 'odd'), true);  // page 4 excluded

  // Even only (জোড়): page 2, 4, 6 allowed; page 1, 3, 5 excluded
  assert.equal(isPageExcluded(1, [], false, 'even'), true);  // page 1 excluded
  assert.equal(isPageExcluded(2, [], false, 'even'), false); // page 2 included
  assert.equal(isPageExcluded(3, [], false, 'even'), true);  // page 3 excluded
  assert.equal(isPageExcluded(4, [], false, 'even'), false); // page 4 included
});

test('parsePageRangeString parses single and ranged numbers accurately', () => {
  assert.deepEqual(parsePageRangeString('1, 3, 5', 10), [1, 3, 5]);
  assert.deepEqual(parsePageRangeString('2-4, 7', 10), [2, 3, 4, 7]);
  assert.deepEqual(parsePageRangeString('1-3, 2-5', 10), [1, 2, 3, 4, 5]);
  assert.deepEqual(parsePageRangeString('', 10), []);
});
