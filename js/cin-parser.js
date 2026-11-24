/* =====================================================================
   cin-parser.js  —  CIN / LLPIN ka poora "dimaag" (logic)
   ---------------------------------------------------------------------
   Is file me DOM (HTML) ka koi kaam nahi hai. Sirf pure functions hain,
   isliye same file browser me bhi chalti hai aur Node (tests) me bhi.
   ===================================================================== */
(function (root, factory) {
  // Hinglish: agar Node hai to module.exports, warna browser me window.CINParser
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.CINParser = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* ---------- 1) State / UT codes (CIN ke 7-8 number characters) ---------- */
  // Hinglish: MCA jo 2-letter code use karta hai wahi yahan hai.
  // Dhyan do: Uttarakhand ke liye MCA "UR" use karta hai, kuch jagah "UK" bhi dikhta hai -> dono rakhe.
  // Telangana = TG, Chhattisgarh = CT, Odisha = OR (purane records me OD bhi milta hai).
  const STATES = {
    AN: 'Andaman & Nicobar Islands', AP: 'Andhra Pradesh', AR: 'Arunachal Pradesh',
    AS: 'Assam', BR: 'Bihar', CH: 'Chandigarh', CT: 'Chhattisgarh',
    DD: 'Daman & Diu', DL: 'Delhi', DN: 'Dadra & Nagar Haveli', GA: 'Goa',
    GJ: 'Gujarat', HP: 'Himachal Pradesh', HR: 'Haryana', JH: 'Jharkhand',
    JK: 'Jammu & Kashmir', KA: 'Karnataka', KL: 'Kerala', LA: 'Ladakh',
    LD: 'Lakshadweep', MH: 'Maharashtra', ML: 'Meghalaya', MN: 'Manipur',
    MP: 'Madhya Pradesh', MZ: 'Mizoram', NL: 'Nagaland', OD: 'Odisha', OR: 'Odisha',
    PB: 'Punjab', PY: 'Puducherry', RJ: 'Rajasthan', SK: 'Sikkim',
    TG: 'Telangana', TN: 'Tamil Nadu', TR: 'Tripura', UK: 'Uttarakhand',
    UP: 'Uttar Pradesh', UR: 'Uttarakhand', WB: 'West Bengal'
  };

  /* ---------- 2) Company type codes (CIN ke 13-15 number characters) ---------- */
  // canList=false matlab: is type ki company stock exchange pe listed NAHI ho sakti
  // (private company / OPC / private guarantee / private unlimited).
  const TYPES = {
    PLC: { label: 'Public limited company', canList: true },
    PTC: { label: 'Private limited company', canList: false },
    OPC: { label: 'One person company (OPC)', canList: false },
    GOI: { label: 'Government company (Central)', canList: true },
    SGC: { label: 'Government company (State)', canList: true },
    FTC: { label: 'Subsidiary of a foreign company', canList: true },
    FLC: { label: 'Financial lending company (foreign)', canList: true },
    NPL: { label: 'Not-for-profit company (Section 8)', canList: true },
    GAP: { label: 'Company limited by guarantee (public)', canList: true },
    GAT: { label: 'Company limited by guarantee (private)', canList: false },
    ULL: { label: 'Unlimited company (public)', canList: true },
    ULT: { label: 'Unlimited company (private)', canList: false }
  };

  /* ---------- 3) CIN ke 6 hisse (segments) ---------- */
  // Hinglish: [from, to) positions, jisse hum 21 characters ko kaat sakein.
  // i = colour index (CSS me .s0 ... .s5)
  const SEGMENTS = [
    { i: 0, label: 'Listed?',  from: 0,  to: 1 },
    { i: 1, label: 'Industry', from: 1,  to: 6 },
    { i: 2, label: 'State',    from: 6,  to: 8 },
    { i: 3, label: 'Year',     from: 8,  to: 12 },
    { i: 4, label: 'Type',     from: 12, to: 15 },
    { i: 5, label: 'Reg. no.', from: 15, to: 21 }
  ];

  const EARLIEST_YEAR = 1850; // Hinglish: India me companies ka record 1850s se shuru hota hai
  const OPC_START_YEAR = 2013; // Hinglish: OPC Companies Act 2013 se aaya

  /* ---------- 4) CIN parse karna ---------- */
  function parseCIN(id, thisYear) {
    const errors = []; // har error: { segs: [colour index...], msg: "..." }
    const res = { id, kind: 'CIN', entity: 'Company', valid: false, errors, segments: null, info: null };
    const bad = (segs, msg) => errors.push({ segs, msg });

    // Hinglish: Pehle length check. Galat length ho to positions bharosemand nahi,
    // isliye segment-wise check nahi karte, sirf seedha kaaran batate hain.
    if (id.length !== 21) {
      const diff = id.length - 21;
      bad([], diff < 0
        ? `Too short: a CIN has exactly 21 characters, this has ${id.length} (${-diff} missing).`
        : `Too long: a CIN has exactly 21 characters, this has ${id.length} (${diff} extra).`);
      if (/[^A-Z0-9]/.test(id)) bad([], 'Only letters A–Z and digits 0–9 are allowed. Remove spaces or symbols.');
      if (!/^[LU]/.test(id)) bad([], `A CIN must start with L (listed) or U (unlisted), this starts with "${id[0]}".`);
      return res;
    }

    // Length sahi hai -> 6 hisso me todo
    const parts = SEGMENTS.map(s => id.slice(s.from, s.to));
    const [listing, nic, state, yearTxt, type, reg] = parts;

    if (/[^A-Z0-9]/.test(id)) bad([], 'Only letters A–Z and digits 0–9 are allowed. Remove spaces or symbols.');

    // (a) 1st character: L ya U
    if (listing !== 'L' && listing !== 'U')
      bad([0], `The first character must be L (listed) or U (unlisted), found "${listing}".`);

    // (b) Industry code: 5 digits
    if (!/^\d{5}$/.test(nic))
      bad([1], `Characters 2–6 are the industry code and must be 5 digits, found "${nic}".`);

    // (c) State code
    if (!/^[A-Z]{2}$/.test(state))
      bad([2], `Characters 7–8 are the state code and must be 2 letters, found "${state}".`);
    else if (!STATES[state])
      bad([2], `"${state}" is not a recognised state or UT code.`);

    // (d) Year: 4 digits + range check
    let year = null;
    if (!/^\d{4}$/.test(yearTxt)) {
      bad([3], `Characters 9–12 are the year of incorporation and must be 4 digits, found "${yearTxt}".`);
    } else {
      year = Number(yearTxt);
      if (year < EARLIEST_YEAR) bad([3], `Year ${year} is too early. Indian company records start in the 1850s.`);
      else if (year > thisYear) bad([3], `Year ${year} is in the future.`);
    }

    // (e) Company type code
    if (!/^[A-Z]{3}$/.test(type))
      bad([4], `Characters 13–15 are the company type and must be 3 letters, found "${type}".`);
    else if (!TYPES[type])
      bad([4], `"${type}" is not a known company type. Expected one of ${Object.keys(TYPES).join(', ')}.`);

    // (f) Registration number: 6 digits
    if (!/^\d{6}$/.test(reg))
      bad([5], `The last 6 characters are the registration number and must be digits, found "${reg}".`);

    // (g) Cross-checks (jab upar ke hisse sahi hon tab hi ye sawal banta hai)
    if (listing === 'L' && TYPES[type] && !TYPES[type].canList)
      bad([0, 4], `A ${TYPES[type].label.toLowerCase()} cannot be listed on a stock exchange, but the CIN starts with L.`);
    if (type === 'OPC' && year !== null && year < OPC_START_YEAR)
      bad([3, 4], `One person companies only exist from ${OPC_START_YEAR} (Companies Act 2013), but the year is ${year}.`);

    // Segments hamesha banate hain taaki UI galat hissa highlight kar sake
    res.segments = SEGMENTS.map((s, k) => ({
      i: s.i, label: s.label, text: parts[k],
      error: errors.some(e => e.segs.includes(s.i))
    }));

    if (errors.length === 0) {
      res.valid = true;
      res.info = {
        listing: listing === 'L' ? 'Listed' : 'Unlisted',
        state: STATES[state], stateCode: state,
        year, typeCode: type, typeLabel: TYPES[type].label,
        industryCode: nic, regNo: reg
      };
    }
    return res;
  }

  /* ---------- 5) LLPIN parse karna (format: AAA-1234) ---------- */
  function parseLLPIN(id) {
    const errors = [];
    const res = { id, kind: 'LLPIN', entity: 'LLP', valid: false, errors, segments: null, info: null };
    const bad = msg => errors.push({ segs: [], msg });

    if (/^[A-Z]{3}-\d{4}$/.test(id)) {
      const [pre, num] = id.split('-');
      res.valid = true;
      res.segments = [
        { i: 0, label: 'Prefix', text: pre, error: false },
        { sep: true, text: '-' },
        { i: 5, label: 'Number', text: num, error: false }
      ];
      // Hinglish: LLPIN me state / year / type encoded nahi hota, isliye sirf entity batate hain.
      res.info = { typeLabel: 'Limited liability partnership' };
      return res;
    }

    if (/^[A-Z]{3}\d{4}$/.test(id)) {
      bad(`Missing hyphen. An LLPIN is written ${id.slice(0, 3)}-${id.slice(3)}.`);
    } else if (id.includes('-')) {
      const i = id.indexOf('-');
      const left = id.slice(0, i), right = id.slice(i + 1);
      if (!/^[A-Z]{3}$/.test(left)) bad(`Before the hyphen an LLPIN has 3 letters, found "${left}".`);
      if (!/^\d{4}$/.test(right)) bad(`After the hyphen an LLPIN has 4 digits, found "${right}".`);
    } else {
      bad('An LLPIN looks like AAA-1234: 3 letters, a hyphen, then 4 digits.');
    }
    return res;
  }

  /* ---------- 6) Ek token ko CIN / LLPIN / Unknown me baantna ---------- */
  function detectKind(id) {
    if (id.includes('-') || /^[A-Z]{3}\d{4}$/.test(id)) return 'LLPIN';
    if (id.length <= 10) return 'UNKNOWN'; // chhota aur hyphen nahi -> na CIN na LLPIN
    return 'CIN';
  }

  function parseOne(raw, thisYear) {
    const id = raw.toUpperCase();
    const kind = detectKind(id);
    let r;
    if (kind === 'LLPIN') r = parseLLPIN(id);
    else if (kind === 'CIN') r = parseCIN(id, thisYear);
    else r = {
      id, kind: 'Unknown', entity: null, valid: false, segments: null, info: null,
      errors: [{ segs: [], msg: 'Not recognised. A CIN has 21 characters (like L17110MH1973PLC019786) and an LLPIN looks like AAA-1234.' }]
    };
    r.input = raw;
    return r;
  }

  /* ---------- 7) Poora pasted text -> results ---------- */
  const MAX_ITEMS = 5000; // Hinglish: browser hang na ho isliye upar ki seema

  function tokenize(text) {
    // Hinglish: newline, space, comma, semicolon, tab — sab pe todo. Excel se paste karne par bhi chalega.
    return text
      .split(/[\s,;|]+/)
      // Aas-paas ke quotes / brackets / full-stop hata do
      .map(t => t.replace(/^["'`([{<]+|["'`)\]}>.]+$/g, ''))
      .filter(Boolean);
  }

  function parseList(text, thisYear) {
    const year = thisYear || new Date().getFullYear();
    const tokens = tokenize(String(text || ''));
    const truncated = tokens.length > MAX_ITEMS;
    const seen = new Map(); // id -> pehli baar kaunse number pe aaya
    const results = tokens.slice(0, MAX_ITEMS).map((t, idx) => {
      const r = parseOne(t, year);
      r.n = idx + 1;
      if (seen.has(r.id)) r.duplicateOf = seen.get(r.id);
      else seen.set(r.id, r.n);
      return r;
    });
    return { results, total: tokens.length, truncated };
  }

  /* ---------- 8) CSV export ---------- */
  function toCSV(results) {
    const q = v => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
    const head = ['#', 'input', 'type', 'valid', 'entity', 'listing', 'state', 'year', 'company_type', 'problems'];
    const rows = results.map(r => [
      r.n, r.id, r.kind, r.valid ? 'yes' : 'no', r.entity || '',
      r.info && r.info.listing || '', r.info && r.info.state || '',
      r.info && r.info.year || '', r.info && r.info.typeLabel || '',
      r.errors.map(e => e.msg).join(' | ')
    ]);
    return [head, ...rows].map(row => row.map(q).join(',')).join('\r\n');
  }

  return { parseCIN, parseLLPIN, parseOne, parseList, toCSV, STATES, TYPES, SEGMENTS, MAX_ITEMS };
});
