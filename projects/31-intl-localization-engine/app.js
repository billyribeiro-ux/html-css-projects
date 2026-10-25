/**
 * DPE L8++ STANDARDS: Level 31 - ECMAScript Intl Localization Engine
 * Architect: Distinguished Principal Engineer (L8++)
 * Full native browser polyglot engine without external dependencies.
 */

(() => {
  'use strict';

  // DOM Elements
  const selectLocale = document.getElementById('select-locale');
  const selectCurrency = document.getElementById('select-currency');
  const selectCalendar = document.getElementById('select-calendar');

  const outCurrencyStandard = document.getElementById('out-currency-standard');
  const outCurrencyCompact = document.getElementById('out-currency-compact');
  const outUnitSpeed = document.getElementById('out-unit-speed');
  const outUnitBytes = document.getElementById('out-unit-bytes');

  const outDateFull = document.getElementById('out-date-full');
  const outDateCalendar = document.getElementById('out-date-calendar');
  const outDateTz = document.getElementById('out-date-tz');
  const outDateRange = document.getElementById('out-date-range');

  const outRelPast = document.getElementById('out-rel-past');
  const outRelFuture = document.getElementById('out-rel-future');
  const outPlural1 = document.getElementById('out-plural-1');
  const outPlural42 = document.getElementById('out-plural-42');

  const outListConjunction = document.getElementById('out-list-conjunction');
  const outListDisjunction = document.getElementById('out-list-disjunction');
  const outRegionName = document.getElementById('out-region-name');
  const outLangName = document.getElementById('out-lang-name');

  const SAMPLE_AMOUNT = 4258900.50;
  const NOW = new Date();
  const RANGE_START = new Date(Date.now() - 5 * 86400000);
  const RANGE_END = new Date(Date.now() + 3 * 86400000);

  function updateFormatting() {
    const locale = selectLocale.value;
    const currency = selectCurrency.value;
    const calendar = selectCalendar.value;

    try {
      // 1. Intl.NumberFormat
      outCurrencyStandard.textContent = new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency
      }).format(SAMPLE_AMOUNT);

      outCurrencyCompact.textContent = new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
        notation: 'compact',
        compactDisplay: 'short'
      }).format(SAMPLE_AMOUNT);

      outUnitSpeed.textContent = new Intl.NumberFormat(locale, {
        style: 'unit',
        unit: 'kilometer-per-hour',
        unitDisplay: 'long'
      }).format(942.5);

      outUnitBytes.textContent = new Intl.NumberFormat(locale, {
        style: 'unit',
        unit: 'gigabyte',
        unitDisplay: 'short'
      }).format(1024.75);

      // 2. Intl.DateTimeFormat
      outDateFull.textContent = new Intl.DateTimeFormat(locale, {
        dateStyle: 'full',
        timeStyle: 'medium'
      }).format(NOW);

      outDateCalendar.textContent = new Intl.DateTimeFormat(locale, {
        calendar: calendar,
        era: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }).format(NOW);

      outDateTz.textContent = new Intl.DateTimeFormat(locale, {
        timeZone: 'Asia/Tokyo',
        timeZoneName: 'long',
        timeStyle: 'full'
      }).format(NOW);

      outDateRange.textContent = new Intl.DateTimeFormat(locale, {
        month: 'short',
        day: 'numeric'
      }).formatRange(RANGE_START, RANGE_END);

      // 3. Intl.RelativeTimeFormat & PluralRules
      const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
      outRelPast.textContent = rtf.format(-3, 'day');
      outRelFuture.textContent = rtf.format(4, 'hour');

      const pr = new Intl.PluralRules(locale);
      outPlural1.textContent = `${pr.select(1)} (${new Intl.NumberFormat(locale).format(1)} package)`;
      outPlural42.textContent = `${pr.select(42)} (${new Intl.NumberFormat(locale).format(42)} packages)`;

      // 4. Intl.ListFormat & DisplayNames
      const nodes = ['Tokyo-Mesh-01', 'Frankfurt-Core', 'São-Paulo-Edge'];
      const lfAnd = new Intl.ListFormat(locale, { style: 'long', type: 'conjunction' });
      outListConjunction.textContent = lfAnd.format(nodes);

      const lfOr = new Intl.ListFormat(locale, { style: 'short', type: 'disjunction' });
      outListDisjunction.textContent = lfOr.format(['us-east-1', 'us-west-2', 'eu-central-1']);

      // DisplayNames
      const regionNames = new Intl.DisplayNames([locale], { type: 'region' });
      const languageNames = new Intl.DisplayNames([locale], { type: 'language' });

      const targetRegion = locale.split('-')[1] || 'US';
      const targetLang = locale.split('-')[0] || 'en';

      outRegionName.textContent = `${regionNames.of(targetRegion)} (${targetRegion})`;
      outLangName.textContent = `${languageNames.of(targetLang)} (${targetLang})`;

    } catch (err) {
      console.error('Intl formatting error:', err);
    }
  }

  // Event Listeners
  selectLocale.addEventListener('change', updateFormatting);
  selectCurrency.addEventListener('change', updateFormatting);
  selectCalendar.addEventListener('change', updateFormatting);

  // Initial Run
  updateFormatting();
})();
