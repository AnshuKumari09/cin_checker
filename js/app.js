/* =====================================================================
   app.js — page ka behaviour (DOM + events). Logic cin-parser.js me hai.
   Flow:  textarea -> run() -> CINParser.parseList() -> render() -> screen
   ===================================================================== */
(function () {
  'use strict';
  const P = window.CINParser;
  const $ = id => document.getElementById(id);
  const PAGE = 100; // Hinglish: ek baar me 100 rows dikhate hain, 500+ lines pe page smooth rahe

  const el = {
    input: $('input'), check: $('check'), example: $('example'), clear: $('clear'),
    empty: $('empty'), out: $('out'), list: $('list'), summary: $('summary-text'),
    notice: $('notice'), more: $('more'), none: $('none'), csv: $('csv'),
    demo: $('demo'), legend: $('legend')
  };

  // State: abhi ke results, filter, kitni rows dikh rahi hain
  let results = [], filter = 'all', shown = PAGE;

  const EXAMPLE = [
    'L17110MH1973PLC019786', 'U72900KA2019PTC123456', 'U74999DL2016OPC312345',
    'L40101DL1975GOI007966', 'AAA-1234', 'U12345XX2020PTC123456',
    'U72900KA2031PTC123456', 'L72900KA2019PTC123456', 'U7290KA2019PTC123456', 'AAA1234'
  ].join('\n');

  // HTML injection se bachne ke liye har user text escape karte hain
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------- CIN ke hisse HTML me ---------- */
  function anatomyHTML(segments, big) {
    return `<div class="anatomy${big ? ' big' : ''}">` + segments.map(s =>
      s.sep ? `<span class="sep">${esc(s.text)}</span>`
        : `<span class="seg s${s.i}${s.error ? ' err' : ''}"><code>${esc(s.text)}</code><small>${esc(s.label)}</small></span>`
    ).join('') + '</div>';
  }

  /* ---------- ek result row ---------- */
  function rowHTML(r) {
    const ok = r.valid;
    const head = `<div class="row-head">
      <span class="badge ${ok ? 'ok' : 'no'}">${ok ? 'Valid' : 'Not valid'}</span>
      ${r.entity ? `<span class="tag">${r.entity === 'LLP' ? 'LLP' : 'Company'}</span>` : ''}
      ${r.duplicateOf ? `<span class="tag">Same as #${r.duplicateOf}</span>` : ''}
      <span class="num">#${r.n}</span></div>`;
    // Segments hain to rang-birange hisse, warna seedha raw text (galat length etc.)
    const id = r.segments ? anatomyHTML(r.segments)
      : `<div class="raw ${ok ? '' : 'err'}">${esc(r.id)}</div>`;
    let body = '';
    if (ok && r.kind === 'CIN') {
      const i = r.info;
      body = `<dl class="facts">
        <div><dt>Entity</dt><dd>Company</dd></div>
        <div><dt>Listing</dt><dd>${i.listing}</dd></div>
        <div><dt>State</dt><dd>${esc(i.state)}</dd></div>
        <div><dt>Incorporated</dt><dd>${i.year}</dd></div>
        <div><dt>Company type</dt><dd>${esc(i.typeLabel)}</dd></div></dl>`;
    } else if (ok) {
      body = `<dl class="facts"><div><dt>Entity</dt><dd>Limited liability partnership</dd></div></dl>
        <p class="row-note">An LLPIN does not carry a state, year or listing status, so there is nothing more to read from the number itself.</p>`;
    } else {
      body = `<ul class="errors">${r.errors.map(e => `<li>${esc(e.msg)}</li>`).join('')}</ul>`;
    }
    return `<li class="row ${ok ? 'ok' : 'no'}">${head}${id}${body}</li>`;
  }

  /* ---------- poori list screen pe ---------- */
  function render() {
    const nValid = results.filter(r => r.valid).length;
    const nBad = results.length - nValid;
    const nLLP = results.filter(r => r.kind === 'LLPIN').length;

    $('c-all').textContent = results.length;
    $('c-valid').textContent = nValid;
    $('c-invalid').textContent = nBad;

    el.summary.textContent = nBad === 0
      ? `All ${results.length} ${results.length === 1 ? 'number is' : 'numbers are'} valid.`
      : `${results.length} checked: ${nValid} valid, ${nBad} not valid.` + (nLLP ? ` (${nLLP} LLP${nLLP > 1 ? 's' : ''})` : '');

    document.querySelectorAll('.seg-ctl button').forEach(b =>
      b.setAttribute('aria-pressed', String(b.dataset.f === filter)));

    const view = results.filter(r => filter === 'all' || (filter === 'valid') === r.valid);
    el.list.innerHTML = view.slice(0, shown).map(rowHTML).join('');
    el.none.hidden = view.length > 0;
    const left = view.length - shown;
    el.more.hidden = left <= 0;
    if (left > 0) el.more.textContent = `Show ${Math.min(PAGE, left)} more (${left} remaining)`;
  }

  /* ---------- check chalana ---------- */
  function run() {
    const text = el.input.value;
    const { results: res, total, truncated } = P.parseList(text);
    results = res; shown = PAGE; filter = 'all';
    const has = res.length > 0;
    el.empty.hidden = has; el.out.hidden = !has; el.clear.hidden = !text.trim();
    el.notice.hidden = !truncated;
    if (truncated) el.notice.textContent = `You pasted ${total.toLocaleString()} numbers. Only the first ${P.MAX_ITEMS.toLocaleString()} were checked. Split the rest into another batch.`;
    if (has) render();
  }

  /* ---------- CSV download ---------- */
  function downloadCSV() {
    const blob = new Blob(['\ufeff' + P.toCSV(results)], { type: 'text/csv;charset=utf-8' }); // \ufeff = Excel ke liye BOM
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'cin-llpin-results.csv';
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(a.href);
  }

  /* ---------- empty state ki demo anatomy ---------- */
  const DEMO = P.parseCIN('L17110MH1973PLC019786', new Date().getFullYear());
  el.demo.outerHTML = anatomyHTML(DEMO.segments, true);
  const MEAN = [
    ['Listed?', 'L means listed on a stock exchange, U means unlisted.'],
    ['Industry', 'Five-digit code for the main business activity.'],
    ['State', 'Two letters for the state or UT of the registered office (MH is Maharashtra).'],
    ['Year', 'Year the company was incorporated.'],
    ['Type', 'PLC public, PTC private, OPC one person, GOI government and more.'],
    ['Reg. no.', 'Six-digit serial number given by the registrar.']
  ];
  el.legend.innerHTML = MEAN.map((m, k) =>
    `<li><span class="dot" style="background:var(--c${k})"></span><span><strong>${m[0]}.</strong> ${m[1]}</span></li>`).join('');

  /* ---------- events ---------- */
  el.check.addEventListener('click', run);
  el.input.addEventListener('input', debounce(run, 250)); // Hinglish: type karte hi live result
  el.input.addEventListener('keydown', e => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') run(); });
  el.example.addEventListener('click', () => { el.input.value = EXAMPLE; run(); });
  el.clear.addEventListener('click', () => { el.input.value = ''; run(); el.input.focus(); });
  el.more.addEventListener('click', () => { shown += PAGE; render(); });
  el.csv.addEventListener('click', downloadCSV);
  document.querySelector('.seg-ctl').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    filter = b.dataset.f; shown = PAGE; render();
  });

  function debounce(fn, ms) { let t; return () => { clearTimeout(t); t = setTimeout(fn, ms); }; }
})();
