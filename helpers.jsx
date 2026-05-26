// ============================================================
// HELPERS — formatters + shared components
// ============================================================

const { useState, useEffect, useMemo, useRef, useCallback } = React;

// ── Tokens (mirrors design system colors) ───────────────────
const C = {
  navy: '#16273d', navy600: '#122030', navy300: '#6d8dac', navy100: '#c6d0de', navy50: '#e8ecf1',
  blue: '#265aa6', bright: '#009fe3', amber: '#ef9822', green: '#44ac39', red: '#d23633',
  white: '#ffffff', gray50: '#f7f8fa', gray100: '#eef0f3', gray200: '#dde1e7',
  gray300: '#c4cad4', gray400: '#98a2b0', gray500: '#6b7787', gray700: '#374151', gray900: '#1a1f27',
  // accent for veiledningsnotat
  teal: '#0c8a8a', tealBg: '#e0f5f3', purple: '#7c4dff', purpleBg: '#efeafd',
};

// Today (fixed reference date for the demo)
const TODAY = '2026-05-21';

// ── Norwegian number / date formatters ───────────────────────
function formatKr(n) {
  if (n == null || isNaN(n)) return '–';
  // Norwegian: . as thousands separator, kr suffix
  return new Intl.NumberFormat('nb-NO', { useGrouping: true }).format(Math.round(n)).replace(/\s|\u00A0/g, '.') + ' kr';
}
function formatKrShort(n) {
  if (n == null || isNaN(n)) return '–';
  if (n >= 1_000_000) return (n/1_000_000).toFixed(1).replace('.', ',') + 'M kr';
  if (n >= 1_000) return Math.round(n/1000) + 'k kr';
  return n + ' kr';
}

const MAANEDER = ['jan.','feb.','mars','apr.','mai','juni','juli','aug.','sep.','okt.','nov.','des.'];
const MAANEDER_LONG = ['januar','februar','mars','april','mai','juni','juli','august','september','oktober','november','desember'];

function parseISO(s) {
  if (!s) return null;
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m-1, d);
}
function toISO(d) {
  const y = d.getFullYear(), m = String(d.getMonth()+1).padStart(2,'0'), da = String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${da}`;
}
function daysBetween(aISO, bISO) {
  const a = parseISO(aISO), b = parseISO(bISO);
  if (!a || !b) return null;
  return Math.round((b - a) / (1000*60*60*24));
}
function formatDateLong(iso) {
  const d = parseISO(iso);
  if (!d) return '–';
  return `${d.getDate()}. ${MAANEDER_LONG[d.getMonth()]} ${d.getFullYear()}`;
}
function formatDateShort(iso) {
  const d = parseISO(iso);
  if (!d) return '–';
  return `${d.getDate()}. ${MAANEDER[d.getMonth()]} ${d.getFullYear()}`;
}
function relativeDate(iso) {
  if (!iso) return '–';
  const diff = daysBetween(TODAY, iso);
  if (diff === 0) return 'I dag';
  if (diff === 1) return 'I morgen';
  if (diff === -1) return 'I går';
  if (diff > 1 && diff <= 7) return `om ${diff} dager`;
  if (diff < -1 && diff >= -7) return `for ${Math.abs(diff)} dager siden`;
  return formatDateShort(iso);
}

// ── Status / pipeline maps ──────────────────────────────────
const STATUS_LISTE = ['Lead','Kontaktet','Behovskartlagt','Tilbud sendt','Forhandling','Vunnet','Ferdigstilt','Tapt'];

const STATUS_FARGER = {
  'Lead':            { bg:'#eef0f3', fg:'#6b7787', dot:'#98a2b0', accent:'#98a2b0' },
  'Kontaktet':       { bg:'#e8ecf1', fg:'#476e8e', dot:'#6d8dac', accent:'#6d8dac' },
  'Behovskartlagt':  { bg:'#e4f7fd', fg:'#0077aa', dot:'#009fe3', accent:'#009fe3' },
  'Tilbud sendt':    { bg:'#fef4e3', fg:'#b87514', dot:'#ef9822', accent:'#ef9822' },
  'Forhandling':     { bg:'#e8f3fb', fg:'#1c4a8c', dot:'#265aa6', accent:'#265aa6' },
  'Vunnet':          { bg:'#e8f7e6', fg:'#2e7c25', dot:'#44ac39', accent:'#44ac39' },
  'Ferdigstilt':     { bg:'#d9e9e3', fg:'#0e5e4a', dot:'#0e5e4a', accent:'#0e5e4a' },
  'Tapt':            { bg:'#fbe6e6', fg:'#a82a28', dot:'#d23633', accent:'#d23633' },
};

// ── Activity type map ───────────────────────────────────────
const AKTIVITETSTYPER = {
  'møte':              { label:'Møte',                 icon:'users',            color: C.blue,   bg:'#e8f3fb', highlight:false },
  'telefon':           { label:'Telefonsamtale',       icon:'phone',            color: C.purple, bg: C.purpleBg, highlight:false },
  'epost':             { label:'E-post',               icon:'mail',             color: C.gray500,bg: C.gray100, highlight:false },
  'tilbud_sendt':      { label:'Tilbud sendt',         icon:'file-text',        color: C.amber,  bg:'#fef4e3', highlight:false },
  'tilbud_akseptert':  { label:'Tilbud akseptert',     icon:'check-circle-2',   color: C.green,  bg:'#e8f7e6', highlight:true  },
  'tilbud_avslått':    { label:'Tilbud avslått',       icon:'x-circle',         color: C.red,    bg:'#fbe6e6', highlight:true  },
  'veiledningsnotat':  { label:'Veiledningsnotat',     icon:'clipboard-list',   color: C.teal,   bg: C.tealBg,  highlight:false, note:true },
  'oppfølging':        { label:'Oppfølging',           icon:'bell',             color: C.amber,  bg:'#fef4e3', highlight:false },
  'lead-mottatt':      { label:'Lead mottatt',         icon:'sparkles',         color: C.bright, bg:'#e4f7fd', highlight:false },
};

// ── Shared components ───────────────────────────────────────
function Avatar({ initialer, size=32, color=C.blue }) {
  return (
    <div style={{
      width:size, height:size, borderRadius:'50%', background:color, color:'#fff',
      display:'inline-flex', alignItems:'center', justifyContent:'center',
      fontSize: size<28 ? 10 : size<36 ? 11 : 13, fontWeight:700, flexShrink:0, letterSpacing:'0.03em',
    }}>{initialer}</div>
  );
}

// Stable color for team members
function teamColor(id) {
  const map = { t1: C.blue, t2: C.bright, t3: C.amber, t4: C.green };
  return map[id] || C.navy;
}

function StatusBadge({ status, size='md' }) {
  const s = STATUS_FARGER[status] || STATUS_FARGER.Lead;
  const padding = size==='sm' ? '2px 8px' : '3px 10px';
  const fs = size==='sm' ? 11 : 12;
  return (
    <span style={{
      background:s.bg, color:s.fg, fontSize:fs, fontWeight:600,
      padding, borderRadius:9999, display:'inline-flex', alignItems:'center', gap:6, whiteSpace:'nowrap',
    }}>
      <span style={{width:6, height:6, borderRadius:'50%', background:s.dot}}/>
      {status}
    </span>
  );
}

function Icon({ name, size=16, color, style }) {
  return <i className={`icon-${name}`} style={{ fontSize:size, color, lineHeight:1, ...style }}/>;
}

function Button({ children, variant='primary', size='md', icon, onClick, type='button', disabled, style={} }) {
  const base = {
    display:'inline-flex', alignItems:'center', gap:7, border:'none',
    fontFamily:'inherit', fontWeight:600, cursor: disabled ? 'not-allowed' : 'pointer',
    borderRadius:7, transition:'all 120ms', whiteSpace:'nowrap',
    opacity: disabled ? 0.5 : 1,
  };
  const sizes = {
    sm: { padding:'6px 12px', fontSize:12 },
    md: { padding:'9px 16px', fontSize:13 },
    lg: { padding:'11px 20px', fontSize:14 },
  };
  const variants = {
    primary:   { background:C.navy, color:'#fff' },
    secondary: { background:'#fff', color:C.navy, border:`1.5px solid ${C.gray200}` },
    ghost:     { background:'transparent', color:C.blue },
    danger:    { background:C.red, color:'#fff' },
    success:   { background:C.green, color:'#fff' },
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} style={{...base, ...sizes[size], ...variants[variant], ...style}}>
      {icon && <Icon name={icon} size={size==='sm'?12:14}/>}
      {children}
    </button>
  );
}

function Input({ label, error, ...rest }) {
  return (
    <label style={{display:'flex', flexDirection:'column', gap:5}}>
      {label && <span style={{fontSize:11, fontWeight:600, color:C.gray500, textTransform:'uppercase', letterSpacing:'.05em'}}>{label}</span>}
      <input {...rest} style={{
        padding:'9px 12px', border:`1.5px solid ${error?C.red:C.gray200}`, borderRadius:7,
        fontSize:14, fontFamily:'inherit', color:C.navy, background:'#fff', outline:'none', ...rest.style,
      }}/>
      {error && <span style={{fontSize:11, color:C.red}}>{error}</span>}
    </label>
  );
}

function Select({ label, options, ...rest }) {
  return (
    <label style={{display:'flex', flexDirection:'column', gap:5}}>
      {label && <span style={{fontSize:11, fontWeight:600, color:C.gray500, textTransform:'uppercase', letterSpacing:'.05em'}}>{label}</span>}
      <select {...rest} style={{
        padding:'9px 12px', border:`1.5px solid ${C.gray200}`, borderRadius:7,
        fontSize:14, fontFamily:'inherit', color:C.navy, background:'#fff', outline:'none', ...rest.style,
      }}>
        {options.map(o => typeof o === 'string'
          ? <option key={o} value={o}>{o}</option>
          : <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}

function Textarea({ label, ...rest }) {
  return (
    <label style={{display:'flex', flexDirection:'column', gap:5}}>
      {label && <span style={{fontSize:11, fontWeight:600, color:C.gray500, textTransform:'uppercase', letterSpacing:'.05em'}}>{label}</span>}
      <textarea {...rest} style={{
        padding:'10px 12px', border:`1.5px solid ${C.gray200}`, borderRadius:7,
        fontSize:14, fontFamily:'inherit', color:C.navy, background:'#fff', outline:'none',
        resize:'vertical', minHeight:80, lineHeight:1.5, ...rest.style,
      }}/>
    </label>
  );
}

function Card({ children, style={}, padding=20 }) {
  return (
    <div style={{
      background:'#fff', borderRadius:10, boxShadow:'0 1px 3px rgba(22,39,61,0.06), 0 2px 8px rgba(22,39,61,0.04)',
      border:`1px solid ${C.gray100}`,
      padding, ...style,
    }}>{children}</div>
  );
}

function Modal({ open, onClose, title, children, width=560 }) {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{
      position:'fixed', inset:0, background:'rgba(22,39,61,0.45)', backdropFilter:'blur(2px)',
      display:'flex', alignItems:'center', justifyContent:'center', zIndex:100, padding:20,
    }}>
      <div onClick={e=>e.stopPropagation()} style={{
        background:'#fff', borderRadius:12, width:'100%', maxWidth:width, maxHeight:'90vh',
        overflow:'auto', boxShadow:'0 16px 48px rgba(22,39,61,0.2)',
      }}>
        <div style={{padding:'18px 22px', borderBottom:`1px solid ${C.gray100}`, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <div style={{fontSize:17, fontWeight:700, color:C.navy}}>{title}</div>
          <button onClick={onClose} style={{background:'none', border:'none', cursor:'pointer', color:C.gray400, fontSize:22, lineHeight:1, padding:4}}>×</button>
        </div>
        <div style={{padding:22}}>{children}</div>
      </div>
    </div>
  );
}

// ── State hook ───────────────────────────────────────────────
// useStore() og resetStore() er definert i supabase-store.jsx — de håndterer
// innlasting, persistering og innlogging mot Supabase.
const __OLD_LOCALSTORAGE_HOOK_BELOW = `dummy — block stays for reference but kode under er erstattet`;
const LS_KEY_UNUSED = 'ressurs_crm_state_v1';

// (localStorage-versjonen av useStore/migrateState/resetStore er fjernet —
// erstattet av Supabase-versjonen i supabase-store.jsx.)

// ── Budsjett / inntekt-hjelpere ─────────────────────────────
// "Faktisk generert inntekt" = sum av verdi på vunne kunder, eller
// (mer presist) sum av beløp på tilbud_akseptert-aktiviteter for én ansatt.

// Total inntekt: alle vunne + ferdigstilte kunder (hele firmaet)
function inntektTotal(kunder) {
  return kunder
    .filter(k => k.status === 'Vunnet' || k.status === 'Ferdigstilt')
    .reduce((s, k) => s + (k.verdi || 0), 0);
}

// Inntekt per ansatt: vunne + ferdigstilte kunder hvor ansvarligId matcher
function inntektForAnsatt(kunder, teamId) {
  return kunder
    .filter(k => (k.status === 'Vunnet' || k.status === 'Ferdigstilt') && k.ansvarligId === teamId)
    .reduce((s, k) => s + (k.verdi || 0), 0);
}

// Total budsjett (sum av alle ansatte sine budsjett)
function budsjettTotal(team) {
  return team.reduce((s, t) => s + (t.budsjett || 0), 0);
}

// Pro-ratet budsjett-mål for en gitt dato (default TODAY)
// Brukes til å fargekode progress: er du foran eller etter prorated mål?
function proRatedTarget(annualBudget, isoDate=TODAY) {
  const d = parseISO(isoDate);
  if (!d) return annualBudget;
  const start = new Date(d.getFullYear(), 0, 1);
  const end = new Date(d.getFullYear()+1, 0, 1);
  const frac = (d - start) / (end - start);
  return annualBudget * frac;
}

// Status-farge for budsjett-progresjon (i forhold til pro-ratet mål)
// >=100% av prorated = grønn, >=60% = amber, ellers rød
function budsjettStatus(actual, annualBudget, isoDate=TODAY) {
  if (!annualBudget) return { color: C.gray400, label: 'Ikke satt' };
  const target = proRatedTarget(annualBudget, isoDate);
  if (target === 0) return { color: C.green, label: 'På mål' };
  const ratio = actual / target;
  if (ratio >= 1) return { color: C.green, label: 'På mål' };
  if (ratio >= 0.6) return { color: C.amber, label: 'Bak mål' };
  return { color: C.red, label: 'Langt bak mål' };
}

// ── Pakke- og tilbudshjelpere ───────────────────────────────

// Pakketyper — vises som etiketter i pakkelisten
const PAKKE_TYPER = {
  omstilling:     { label: 'Omstilling',     color: C.bright },
  karriere:       { label: 'Karriereutvikling', color: C.blue },
  sykefravær:     { label: 'Sykefraværsoppfølging', color: C.amber },
  lederstøtte:    { label: 'Lederstøtte',    color: C.purple },
  hr:             { label: 'HR-rådgivning',  color: C.teal },
  konflikt:       { label: 'Konflikthåndtering', color: C.red },
  skreddersydd:   { label: 'Skreddersydd',   color: C.gray500 },
};

// Sum timer fra et møte (for- + møte- + etterarbeid)
function møteTimer(m) {
  return (Number(m.forarbeidT)||0) + (Number(m.møteT)||0) + (Number(m.etterarbeidT)||0);
}

// Sum timer i en pakke
function pakkeTimer(pakke) {
  return (pakke?.møter || []).reduce((s, m) => s + møteTimer(m), 0);
}

// Sum tillegg i en pakke
function pakkeTilleggSum(pakke) {
  return (pakke?.tillegg || []).reduce((s, t) => s + (Number(t.pris)||0), 0);
}

// Beregnet pakkepris basert på timer × timepris + tillegg
// (For visning ved siden av pakke.pris — selve pakkepris er manuell.)
function beregnetPakkepris(pakke) {
  return pakkeTimer(pakke) * (Number(pakke?.timepris)||0) + pakkeTilleggSum(pakke);
}

// Generer neste tilbudsnummer i format TIL-YYYY-NNN
function nyttTilbudsnummer(state) {
  const year = parseISO(TODAY)?.getFullYear() || new Date().getFullYear();
  const n = state.nesteTilbudsnr || 1;
  return `TIL-${year}-${String(n).padStart(3, '0')}`;
}

// Flett plassholdere i avtalemalen med konkret kunde- og pakkeinfo
function flettAvtalemal(mal, ctx) {
  return (mal || '').replace(/\{\{(\w+)\}\}/g, (_, k) => {
    const v = ctx[k];
    return v == null || v === '' ? `[${k.toLowerCase().replace(/_/g,' ')}]` : String(v);
  });
}

// ── Validation helpers ──────────────────────────────────────
function validateKunde(k) {
  const errs = {};
  if (!k.bedriftsnavn?.trim()) errs.bedriftsnavn = 'Bedriftsnavn er påkrevd';
  if (k.kontakt) {
    if (!k.kontakt.navn?.trim()) errs.kontaktNavn = 'Navn er påkrevd';
    if (k.kontakt.epost && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(k.kontakt.epost)) errs.kontaktEpost = 'Ugyldig e-post';
  }
  if (k.kontakt2?.epost && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(k.kontakt2.epost)) errs.kontakt2Epost = 'Ugyldig e-post';
  return errs;
}

// Export to window
Object.assign(window, {
  C, TODAY, formatKr, formatKrShort, parseISO, toISO, daysBetween,
  formatDateLong, formatDateShort, relativeDate,
  STATUS_LISTE, STATUS_FARGER, AKTIVITETSTYPER, PAKKE_TYPER,
  Avatar, teamColor, StatusBadge, Icon, Button, Input, Select, Textarea, Card, Modal,
  validateKunde,
  inntektTotal, inntektForAnsatt, budsjettTotal, proRatedTarget, budsjettStatus,
  møteTimer, pakkeTimer, pakkeTilleggSum, beregnetPakkepris, nyttTilbudsnummer, flettAvtalemal,
});
