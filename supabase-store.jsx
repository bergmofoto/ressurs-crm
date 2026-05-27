// ============================================================
// Supabase data-lag
// - Initialiserer Supabase-klient
// - Mapper mellom appens state-shape (camelCase, norske felter) og databasens snake_case
// - Eksponerer useStore() som erstatter den gamle localStorage-versjonen
// - Inneholder LoginScreen + LoadingScreen
// ============================================================

const supa = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true },
});
window.supa = supa;

// Hent rå session fra localStorage uten å vente på Supabase-klienten.
// Returnerer { email, access_token } eller null. Brukes som fallback når
// auth.getSession() henger (Supabase auth-API utilgjengelig).
function readRawSession() {
  try {
    // Supabase lagrer session under "sb-<project-ref>-auth-token"
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('sb-') && k.endsWith('-auth-token')) {
        const raw = localStorage.getItem(k);
        if (!raw) continue;
        const parsed = JSON.parse(raw);
        const email = parsed?.user?.email || parsed?.currentSession?.user?.email;
        const access_token = parsed?.access_token || parsed?.currentSession?.access_token;
        if (email) return { email, access_token: access_token || null, raw: parsed };
      }
    }
  } catch (e) { console.warn('[readRawSession]', e); }
  return null;
}

// Husk sist innloggede e-post separat, så vi finner cache selv om
// localStorage-sessionen er korrupt eller tom.
const LAST_EMAIL_KEY = 'ressurs_last_email_v1';
function rememberEmail(email) {
  if (!email) return;
  try { localStorage.setItem(LAST_EMAIL_KEY, email.toLowerCase()); } catch (e) {}
}
function lastEmail() {
  try { return localStorage.getItem(LAST_EMAIL_KEY) || ''; } catch (e) { return ''; }
}

// ── Mapping helpers ──────────────────────────────────────────
// Konvensjon: <type>FromDb(row) → app-objekt, <type>ToDb(obj) → databaserad

function pakkeFromDb(r) {
  return {
    id: r.id, navn: r.navn, type: r.type,
    beskrivelse: r.beskrivelse || '',
    'målgruppe': r.maalgruppe || '',
    innledning: r.innledning || '',
    'møter': Array.isArray(r.moeter) ? r.moeter : [],
    tillegg: Array.isArray(r.tillegg) ? r.tillegg : [],
    timepris: Number(r.timepris) || 0,
    pris: Number(r.pris) || 0,
    mvaFritak: !!r.mva_fritak,
    'bruker_standardvilkår': r.bruker_standardvilkaar !== false,
    betalingsbetingelser: r.betalingsbetingelser || '',
  };
}
function pakkeToDb(p) {
  return {
    id: p.id,
    navn: p.navn,
    type: p.type || 'skreddersydd',
    beskrivelse: p.beskrivelse || '',
    maalgruppe: p['målgruppe'] || '',
    innledning: p.innledning || '',
    moeter: p['møter'] || [],
    tillegg: p.tillegg || [],
    timepris: Number(p.timepris) || 0,
    pris: Number(p.pris) || 0,
    mva_fritak: !!p.mvaFritak,
    bruker_standardvilkaar: p['bruker_standardvilkår'] !== false,
    betalingsbetingelser: p.betalingsbetingelser || '',
  };
}

function teamFromDb(r) {
  return {
    id: r.id, navn: r.navn, rolle: r.rolle || '', initialer: r.initialer || '',
    epost: r.epost || '', telefon: r.telefon || '',
    budsjett: Number(r.budsjett) || 0,
  };
}
function teamToDb(t) {
  return {
    id: t.id, navn: t.navn,
    rolle: t.rolle || '', initialer: t.initialer || '',
    epost: t.epost || '', telefon: t.telefon || '',
    budsjett: Number(t.budsjett) || 0,
  };
}

function kundeFromDb(r) {
  return {
    id: r.id,
    bedriftsnavn: r.bedriftsnavn,
    orgnr: r.orgnr || '',
    bransje: r.bransje || '',
    adresse: r.adresse || '',
    kontakt: r.kontakt || { navn:'', tittel:'', epost:'', telefon:'' },
    kontakt2: r.kontakt2 || { navn:'', tittel:'', epost:'', telefon:'' },
    ansvarligId: r.ansvarlig_id || '',
    pakkeId: r.pakke_id || '',
    status: r.status || 'Lead',
    verdi: Number(r.verdi) || 0,
    sistKontakt: r.sist_kontakt || '',
    notater: r.notater || '',
    nesteAktivitet: r.neste_aktivitet || null,
    aktiviteter: Array.isArray(r.aktiviteter) ? r.aktiviteter : [],
  };
}
function kundeToDb(k) {
  return {
    id: k.id,
    bedriftsnavn: k.bedriftsnavn || '',
    orgnr: k.orgnr || '',
    bransje: k.bransje || '',
    adresse: k.adresse || '',
    kontakt: k.kontakt || { navn:'', tittel:'', epost:'', telefon:'' },
    kontakt2: k.kontakt2 || { navn:'', tittel:'', epost:'', telefon:'' },
    ansvarlig_id: k.ansvarligId || null,
    pakke_id: k.pakkeId || null,
    status: k.status || 'Lead',
    verdi: Number(k.verdi) || 0,
    sist_kontakt: k.sistKontakt || null,
    notater: k.notater || '',
    neste_aktivitet: k.nesteAktivitet || null,
    aktiviteter: k.aktiviteter || [],
  };
}

function tilbudFromDb(r) {
  return {
    id: r.id,
    tilbudsnr: r.tilbudsnr,
    kundeId: r.kunde_id,
    pakkeId: r.pakke_id || '',
    pakkeNavn: r.pakke_navn || '',
    dato: r.dato || '',
    gyldigTil: r.gyldig_til || '',
    utstedtAv: r.utstedt_av || '',
    innledning: r.innledning || '',
    leveransebeskrivelse: r.leveransebeskrivelse || '',
    bestillernummer: r.bestillernummer || '',
    internNotat: r.intern_notat || '',
    'møter': Array.isArray(r.moeter) ? r.moeter : [],
    tillegg: Array.isArray(r.tillegg) ? r.tillegg : [],
    timepris: Number(r.timepris) || 0,
    pris: Number(r.pris) || 0,
    mvaFritak: !!r.mva_fritak,
    'bruker_standardvilkår': r.bruker_standardvilkaar !== false,
    betalingsbetingelser: r.betalingsbetingelser || '',
    status: r.status || 'Utkast',
    opprettet: r.opprettet || '',
    sendt: r.sendt || null,
    akseptert: r.akseptert || null,
    'avslått': r.avslaatt || null,
  };
}
function tilbudToDb(t) {
  return {
    id: t.id,
    tilbudsnr: t.tilbudsnr,
    kunde_id: t.kundeId,
    pakke_id: t.pakkeId || null,
    pakke_navn: t.pakkeNavn || '',
    dato: t.dato || null,
    gyldig_til: t.gyldigTil || null,
    utstedt_av: t.utstedtAv || '',
    innledning: t.innledning || '',
    leveransebeskrivelse: t.leveransebeskrivelse || '',
    bestillernummer: t.bestillernummer || '',
    intern_notat: t.internNotat || '',
    moeter: t['møter'] || [],
    tillegg: t.tillegg || [],
    timepris: Number(t.timepris) || 0,
    pris: Number(t.pris) || 0,
    mva_fritak: !!t.mvaFritak,
    bruker_standardvilkaar: t['bruker_standardvilkår'] !== false,
    betalingsbetingelser: t.betalingsbetingelser || '',
    status: t.status || 'Utkast',
    opprettet: t.opprettet || null,
    sendt: t.sendt || null,
    akseptert: t.akseptert || null,
    avslaatt: t['avslått'] || null,
  };
}

function notatFromDb(r) {
  return {
    id: r.id,
    type: r.type,
    dato: r.dato,
    tittel: r.tittel,
    forfatter: r.forfatter || '',
    tilstede: Array.isArray(r.tilstede) ? r.tilstede : [],
    seksjoner: r.seksjoner || null,
    innhold: r.innhold || '',
    opprettet: r.opprettet,
    oppdatert: r.oppdatert || null,
  };
}
function notatToDb(n) {
  return {
    id: n.id,
    type: n.type,
    dato: n.dato,
    tittel: n.tittel,
    forfatter: n.forfatter || '',
    tilstede: n.tilstede || [],
    seksjoner: n.seksjoner || null,
    innhold: n.innhold || '',
    opprettet: n.opprettet || null,
    oppdatert: n.oppdatert || null,
  };
}

// ── Last all data fra alle tabeller ──────────────────────────
// Med timeout og bedre feilmelding (hvilken tabell feilet)
function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`Timeout (${ms/1000}s) på ${label}`)), ms)),
  ]);
}

// Last én tabell med timeout, returner { data, error, label }
async function loadTable(name, label, timeoutMs) {
  try {
    const res = await withTimeout(supa.from(name).select('*'), timeoutMs, label);
    if (res.error) return { data: null, error: res.error.message, label };
    return { data: res.data || [], error: null, label };
  } catch (e) {
    return { data: null, error: e.message, label };
  }
}

// Last all data — feiltolerant. Hvis en tabell feiler/timer ut, brukes
// fallback (forrige verdi fra cache, evt. tom array). Returnerer også
// en liste over hvilke tabeller som feilet.
async function loadAllData(fallback) {
  const TIMEOUT = 15000; // 15 sek per tabell
  const [pakkerR, teamR, kunderR, tilbudR, notaterR, innstR] = await Promise.all([
    loadTable('pakker',          'pakker',          TIMEOUT),
    loadTable('team_members',    'team',            TIMEOUT),
    loadTable('kunder',          'kunder',          TIMEOUT),
    loadTable('tilbud',          'tilbud',          TIMEOUT),
    loadTable('interne_notater', 'interne notater', TIMEOUT),
    loadTable('innstillinger',   'innstillinger',   TIMEOUT),
  ]);
  const all = [pakkerR, teamR, kunderR, tilbudR, notaterR, innstR];
  const failed = all.filter(r => r.error).map(r => `${r.label} (${r.error})`);

  // Hvis ALT feilet og vi ikke har fallback, kast feil
  const allFailed = all.every(r => r.error);
  if (allFailed && !fallback) {
    throw new Error(failed.join('; '));
  }

  // Bygg state-objekt: for hver tabell, bruk fersk data hvis OK, ellers fallback
  const innstByKey = innstR.data
    ? Object.fromEntries(innstR.data.map(r => [r.key, r.value]))
    : null;

  return {
    state: {
      selskap:        innstByKey?.selskap ?? fallback?.selskap ?? {},
      avtalemal:      innstByKey?.avtalemal ?? fallback?.avtalemal ?? '',
      nesteTilbudsnr: innstByKey ? (Number(innstByKey.neste_tilbudsnr) || 1) : (fallback?.nesteTilbudsnr || 1),
      pakker:         pakkerR.data  ? pakkerR.data.map(pakkeFromDb).sort((a,b) => a.navn.localeCompare(b.navn))               : (fallback?.pakker  || []),
      team:           teamR.data    ? teamR.data.map(teamFromDb).sort((a,b) => a.navn.localeCompare(b.navn))                   : (fallback?.team    || []),
      kunder:         kunderR.data  ? kunderR.data.map(kundeFromDb).sort((a,b) => a.bedriftsnavn.localeCompare(b.bedriftsnavn)) : (fallback?.kunder  || []),
      tilbud:         tilbudR.data  ? tilbudR.data.map(tilbudFromDb)                                                            : (fallback?.tilbud  || []),
      interneNotater: notaterR.data ? notaterR.data.map(notatFromDb)                                                            : (fallback?.interneNotater || []),
    },
    failedTables: failed,
  };
}

// Forsøk loadAllData på nytt automatisk én gang ved nettverksfeil
async function loadAllDataWithRetry(fallback) {
  try {
    const r = await loadAllData(fallback);
    // Hvis pakker spesifikt feilet, prøv én gang til (vanligst å henge)
    if (r.failedTables.length > 0 && !fallback) {
      console.warn('[loadAllData] noen tabeller feilet, prøver igjen:', r.failedTables);
      await new Promise(resolve => setTimeout(resolve, 1500));
      return await loadAllData(fallback);
    }
    return r;
  } catch (e) {
    console.warn('[loadAllData] første forsøk feilet helt, prøver igjen:', e.message);
    await new Promise(resolve => setTimeout(resolve, 1500));
    return await loadAllData(fallback);
  }
}

// ── Lokal cache av state ────────────────────────────────────
// Lagres i localStorage så appen kan vise data umiddelbart ved oppstart,
// selv om Supabase er treg eller utilgjengelig. Knyttet til e-post slik at
// to brukere på samme maskin ikke ser hverandres cache.
const CACHE_PREFIX = 'ressurs_state_cache_v1::';

function cacheKey(email) {
  return CACHE_PREFIX + (email || 'anon').toLowerCase();
}
function loadCache(email) {
  try {
    const raw = localStorage.getItem(cacheKey(email));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.pakker)) return null; // sanity
    return parsed;
  } catch (e) { return null; }
}
function saveCache(email, state) {
  if (!state) return;
  try {
    localStorage.setItem(cacheKey(email), JSON.stringify(state));
  } catch (e) {
    // quota? prøv å rydde gamle nøkler
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k && k.startsWith(CACHE_PREFIX) && k !== cacheKey(email)) localStorage.removeItem(k);
      }
      localStorage.setItem(cacheKey(email), JSON.stringify(state));
    } catch (e2) { /* gir opp stille */ }
  }
}
function clearCache(email) {
  try { localStorage.removeItem(cacheKey(email)); } catch(e) {}
}

// ── Diff og persistering ──────────────────────────────────────
// Sammenligner gammelt og nytt state, og fyrer av upsert/delete for hver endring.

function diffArr(oldArr, newArr, table, toDb) {
  const ops = [];
  const oldMap = Object.fromEntries((oldArr||[]).map(x => [x.id, x]));
  const newMap = Object.fromEntries((newArr||[]).map(x => [x.id, x]));

  for (const item of (newArr || [])) {
    const prev = oldMap[item.id];
    if (!prev || JSON.stringify(item) !== JSON.stringify(prev)) {
      ops.push({ kind:'upsert', table, payload: toDb(item) });
    }
  }
  for (const item of (oldArr || [])) {
    if (!newMap[item.id]) {
      ops.push({ kind:'delete', table, id: item.id });
    }
  }
  return ops;
}

async function persistDiffs(oldState, newState) {
  if (!oldState || !newState) return;
  const ops = [
    ...diffArr(oldState.pakker,         newState.pakker,         'pakker',          pakkeToDb),
    ...diffArr(oldState.team,           newState.team,           'team_members',    teamToDb),
    ...diffArr(oldState.kunder,         newState.kunder,         'kunder',          kundeToDb),
    ...diffArr(oldState.tilbud,         newState.tilbud,         'tilbud',          tilbudToDb),
    ...diffArr(oldState.interneNotater, newState.interneNotater, 'interne_notater', notatToDb),
  ];

  // Singletons
  if (JSON.stringify(oldState.selskap) !== JSON.stringify(newState.selskap)) {
    ops.push({ kind:'upsert', table:'innstillinger', payload:{ key:'selskap', value:newState.selskap } });
  }
  if (oldState.avtalemal !== newState.avtalemal) {
    ops.push({ kind:'upsert', table:'innstillinger', payload:{ key:'avtalemal', value:newState.avtalemal } });
  }
  if (oldState.nesteTilbudsnr !== newState.nesteTilbudsnr) {
    ops.push({ kind:'upsert', table:'innstillinger', payload:{ key:'neste_tilbudsnr', value:newState.nesteTilbudsnr } });
  }

  if (ops.length === 0) return;

  // Kjør parallelt
  const results = await Promise.all(ops.map(op => {
    if (op.kind === 'upsert') return supa.from(op.table).upsert(op.payload);
    if (op.kind === 'delete') return supa.from(op.table).delete().eq('id', op.id);
  }));

  const errors = results.map((r, i) => r.error ? { op: ops[i], err: r.error } : null).filter(Boolean);
  if (errors.length) {
    console.error('[Supabase persist] feil:', errors);
    // Vis melding til bruker — én gang per setState
    if (window.__lastPersistErrorAt !== Date.now() && typeof window.__onPersistError === 'function') {
      window.__lastPersistErrorAt = Date.now();
      window.__onPersistError(errors[0].err.message || 'Lagring feilet');
    }
  }
}

// ── useStore: ny versjon med Supabase ───────────────────────
function useStore() {
  const [session, setSession]   = useState(null);
  const [state, setStateRaw]    = useState(null);
  const [loading, setLoading]   = useState(true);
  const [authError, setAuthErr] = useState('');
  const [persistErr, setPersistErr] = useState('');
  const [refreshErr, setRefreshErr] = useState(''); // Bakgrunnsoppdatering feilet — men cache vises
  const prevStateRef = useRef(null);
  const sessionEmailRef = useRef('');

  // Hjelpefunksjon: hydrer fra cache + refresh i bakgrunn
  const hydrateAndRefresh = useCallback(async (email) => {
    sessionEmailRef.current = email;
    const cached = loadCache(email);
    if (cached) {
      // Vis appen umiddelbart fra cache
      setStateRaw(cached);
      prevStateRef.current = cached;
      setLoading(false);
    }
    // Hent ferske data i bakgrunnen (eller blokkerende hvis ingen cache)
    try {
      const { state: s, failedTables } = await loadAllDataWithRetry(cached);
      setStateRaw(s);
      prevStateRef.current = s;
      saveCache(email, s);
      if (failedTables.length > 0) {
        setRefreshErr('Noen tabeller kunne ikke oppdateres: ' + failedTables.join(', ') + '. Viser sist kjente data for disse.');
      } else {
        setRefreshErr('');
      }
      setAuthErr('');
    } catch (e) {
      console.error('[loadAllData]', e);
      if (cached) {
        // Ikke-blokkerende: brukeren jobber videre med cache
        setRefreshErr('Klarte ikke å oppdatere fra server: ' + e.message);
      } else {
        // Ingen cache — vis full feilmelding
        setAuthErr('Kunne ikke laste data: ' + e.message);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // 1. Init: hent eksisterende session
  useEffect(() => {
    let active = true;

    // Ved oppstart: prøv getSession med generøs timeout (15s).
    // Hvis Supabase auth henger eller feiler, fall tilbake til rå session
    // fra localStorage + lokal cache — appen åpner uansett.
    (async () => {
      let sessionData = null;
      let authHadIssue = false;

      try {
        const { data, error } = await withTimeout(supa.auth.getSession(), 15000, 'auth.getSession');
        if (error) {
          console.error('[auth.getSession error]', error);
          authHadIssue = true;
        }
        sessionData = data?.session || null;
      } catch (e) {
        console.warn('[auth.getSession timeout — bruker rå session]', e.message);
        authHadIssue = true;
        // Les rå session fra localStorage
        const raw = readRawSession();
        if (raw) {
          // Simuler en session-objekt — nok til at appen oppfører seg som "innlogget"
          sessionData = {
            access_token: raw.access_token || '',
            user: { email: raw.email },
          };
        }
      }

      if (!active) return;
      setSession(sessionData);

      if (sessionData) {
        const email = sessionData.user?.email || lastEmail();
        rememberEmail(email);
        if (authHadIssue) {
          setRefreshErr('Supabase auth svarer ikke. Viser sist lagrede data — innlogging er fortsatt aktiv lokalt.');
        }
        await hydrateAndRefresh(email);
      } else {
        // Ingen session — sjekk om vi har cache fra forrige innlogging
        // (bare som info, ikke vis appen uten session)
        setLoading(false);
      }
    })();

    // 2. Lytt på auth-endringer
    const { data: sub } = supa.auth.onAuthStateChange(async (event, sess) => {
      if (!active) return;
      setSession(sess);
      if (event === 'SIGNED_IN' && sess) {
        rememberEmail(sess.user?.email || '');
        setLoading(true);
        await hydrateAndRefresh(sess.user?.email || '');
      } else if (event === 'SIGNED_OUT') {
        const email = sessionEmailRef.current;
        if (email) clearCache(email);
        sessionEmailRef.current = '';
        setStateRaw(null);
        prevStateRef.current = null;
        setRefreshErr('');
      } else if (event === 'TOKEN_REFRESHED' && sess) {
        // Auth kom tilbake — fjern eventuell "Supabase auth svarer ikke"-varsel
        setRefreshErr('');
      }
    });

    window.__onPersistError = (msg) => setPersistErr(msg);
    return () => { active = false; sub.subscription.unsubscribe(); };
  }, [hydrateAndRefresh]);

  // Manuell refresh — brukes av banneret når bakgrunnsoppdatering har feilet
  const refresh = useCallback(async () => {
    const email = sessionEmailRef.current;
    if (!email) return;
    setRefreshErr('');
    const cached = loadCache(email) || prevStateRef.current;
    try {
      const { state: s, failedTables } = await loadAllDataWithRetry(cached);
      setStateRaw(s);
      prevStateRef.current = s;
      saveCache(email, s);
      if (failedTables.length > 0) {
        setRefreshErr('Noen tabeller kunne ikke oppdateres: ' + failedTables.join(', '));
      }
    } catch (e) {
      setRefreshErr('Klarte ikke å oppdatere fra server: ' + e.message);
    }
  }, []);

  // Wrapper rundt setState som også persisterer og oppdaterer cache
  const setState = useCallback((updater) => {
    setStateRaw(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      // Fire-and-forget persistering
      persistDiffs(prevStateRef.current, next).catch(e => console.error('[persistDiffs]', e));
      // Lokal cache holdes alltid i sync med UI-state
      if (sessionEmailRef.current) saveCache(sessionEmailRef.current, next);
      prevStateRef.current = next;
      return next;
    });
  }, []);

  const login = useCallback(async (email, password) => {
    setAuthErr('');
    const { data, error } = await supa.auth.signInWithPassword({ email, password });
    if (error) { setAuthErr(error.message); return false; }
    return true;
  }, []);

  const logout = useCallback(async () => {
    await supa.auth.signOut();
  }, []);

  return { state, setState, session, loading, login, logout, authError, persistErr, refreshErr, refresh, clearPersistErr: () => setPersistErr('') };
}

// resetStore brukes ikke i Supabase-versjonen — funksjonen erstattes av Sign Out.
function resetStore() {
  if (confirm('Logg ut?')) {
    supa.auth.signOut().then(() => location.reload());
  }
}

// ── LoginScreen ──────────────────────────────────────────────
function LoginScreen({ onLogin, error }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    await onLogin(email, password);
    setBusy(false);
  };

  return (
    <div style={{
      minHeight:'100vh', width:'100vw',
      display:'flex', alignItems:'center', justifyContent:'center',
      background: C.navy, padding:20,
    }}>
      <div style={{
        width:'100%', maxWidth:380, background:'#fff', borderRadius:12,
        padding:'40px 36px 32px', boxShadow:'0 12px 40px rgba(0,0,0,0.25)',
      }}>
        <div style={{textAlign:'center', marginBottom:28}}>
          <img src="assets/Ressurs_R_bla.png" alt="Ressurs" style={{height:64, width:'auto', marginBottom:14}}/>
          <div style={{fontSize:18, fontWeight:700, color:C.navy, letterSpacing:'-0.01em'}}>Ressurs Kompetanse</div>
          <div style={{fontSize:12, color:C.gray500, marginTop:4, textTransform:'uppercase', letterSpacing:'.1em', fontWeight:600}}>CRM</div>
        </div>

        <form onSubmit={submit} style={{display:'flex', flexDirection:'column', gap:14}}>
          <Input label="E-post" type="email" value={email} onChange={e=>setEmail(e.target.value)}
            autoComplete="email" placeholder="navn@ressurstromso.no" required/>
          <Input label="Passord" type="password" value={password} onChange={e=>setPassword(e.target.value)}
            autoComplete="current-password" required/>
          {error && (
            <div style={{
              fontSize:12, color: C.red, background:'#fbe6e6',
              padding:'8px 12px', borderRadius:6,
            }}>{error}</div>
          )}
          <Button variant="primary" type="submit" disabled={busy} style={{marginTop:6}}>
            {busy ? 'Logger inn…' : 'Logg inn'}
          </Button>
        </form>

        <div style={{marginTop:20, paddingTop:18, borderTop:`1px solid ${C.gray100}`, fontSize:11, color:C.gray400, textAlign:'center', lineHeight:1.5}}>
          Glemt passord? Kontakt Øyvind.
        </div>
      </div>
    </div>
  );
}

// ── LoadingScreen ────────────────────────────────────────────
function LoadingScreen({ error, onLogout }) {
  // Hvis lasting har tatt > 8 sek uten feil, vis en hint-melding
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    if (error) return;
    const t = setTimeout(() => setSlow(true), 8000);
    return () => clearTimeout(t);
  }, [error]);

  return (
    <div style={{
      minHeight:'100vh', width:'100vw',
      display:'flex', alignItems:'center', justifyContent:'center',
      background: C.navy, color:'#fff', padding:20,
    }}>
      <div style={{textAlign:'center', maxWidth:480}}>
        <img src="assets/Ressurs_R_hvit.png" alt="Ressurs" style={{height:56, width:'auto', marginBottom:18, opacity:0.9}}/>
        {error ? (
          <>
            <div style={{fontSize:15, fontWeight:600, color:'#fff', marginBottom:8}}>
              Klarte ikke å laste data
            </div>
            <div style={{
              fontSize:13, color:'#fff', background:'rgba(210,54,51,0.18)',
              border:'1px solid rgba(210,54,51,0.45)', borderRadius:8,
              padding:'12px 14px', marginBottom:18, lineHeight:1.5,
              textAlign:'left', wordBreak:'break-word',
            }}>
              {error}
            </div>
            <div style={{fontSize:12, color:'rgba(255,255,255,0.6)', lineHeight:1.6, marginBottom:18}}>
              Sjekk at Supabase-prosjektet er aktivt (gratisplanen pauser etter ~1 uke uten aktivitet), at API-nøkkelen fortsatt er gyldig, og at du har nett.
            </div>
            <div style={{display:'flex', gap:10, justifyContent:'center'}}>
              <button onClick={() => location.reload()} style={{
                background:'#fff', color:C.navy, border:'none', borderRadius:6,
                padding:'9px 18px', fontSize:13, fontWeight:600, cursor:'pointer',
                fontFamily:'inherit',
              }}>Prøv på nytt</button>
              {onLogout && (
                <button onClick={onLogout} style={{
                  background:'transparent', color:'#fff',
                  border:'1px solid rgba(255,255,255,0.3)', borderRadius:6,
                  padding:'9px 18px', fontSize:13, fontWeight:500, cursor:'pointer',
                  fontFamily:'inherit',
                }}>Logg ut</button>
              )}
            </div>
          </>
        ) : (
          <>
            <div style={{fontSize:13, color:'rgba(255,255,255,0.6)', letterSpacing:'.05em'}}>Laster…</div>
            {slow && (
              <div style={{
                marginTop:18, fontSize:12, color:'rgba(255,255,255,0.5)',
                lineHeight:1.6, maxWidth:360,
              }}>
                Dette tar lengre tid enn vanlig. Hvis det henger, kan Supabase-prosjektet være satt på pause —{' '}
                <button onClick={() => location.reload()} style={{
                  background:'none', border:'none', color:'#fff',
                  textDecoration:'underline', cursor:'pointer', padding:0,
                  fontFamily:'inherit', fontSize:12,
                }}>last på nytt</button>
                {onLogout && (
                  <>
                    {' '}eller{' '}
                    <button onClick={onLogout} style={{
                      background:'none', border:'none', color:'#fff',
                      textDecoration:'underline', cursor:'pointer', padding:0,
                      fontFamily:'inherit', fontSize:12,
                    }}>logg ut</button>
                  </>
                )}.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { useStore, resetStore, LoginScreen, LoadingScreen });
