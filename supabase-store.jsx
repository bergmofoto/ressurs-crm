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

async function loadAllData() {
  const QUERY_TIMEOUT = 12000; // 12 sek per query
  const tables = [
    ['pakker',          'pakker'],
    ['team_members',    'team'],
    ['kunder',          'kunder'],
    ['tilbud',          'tilbud'],
    ['interne_notater', 'interne notater'],
    ['innstillinger',   'innstillinger'],
  ];

  const results = await Promise.all(tables.map(([t, label]) =>
    withTimeout(supa.from(t).select('*'), QUERY_TIMEOUT, label)
  ));

  // Sjekk feil per tabell og gi en spesifikk melding
  for (let i = 0; i < results.length; i++) {
    if (results[i].error) {
      throw new Error(`${tables[i][1]}: ${results[i].error.message}`);
    }
  }

  const [pakkerR, teamR, kunderR, tilbudR, notaterR, innstR] = results;
  const innstByKey = Object.fromEntries((innstR.data || []).map(r => [r.key, r.value]));
  return {
    selskap:        innstByKey.selskap || {},
    avtalemal:      innstByKey.avtalemal || '',
    nesteTilbudsnr: Number(innstByKey.neste_tilbudsnr) || 1,
    pakker:         (pakkerR.data || []).map(pakkeFromDb).sort((a,b) => a.navn.localeCompare(b.navn)),
    team:           (teamR.data || []).map(teamFromDb).sort((a,b) => a.navn.localeCompare(b.navn)),
    kunder:         (kunderR.data || []).map(kundeFromDb).sort((a,b) => a.bedriftsnavn.localeCompare(b.bedriftsnavn)),
    tilbud:         (tilbudR.data || []).map(tilbudFromDb),
    interneNotater: (notaterR.data || []).map(notatFromDb),
  };
}

// Forsøk loadAllData på nytt automatisk én gang ved nettverksfeil
async function loadAllDataWithRetry() {
  try {
    return await loadAllData();
  } catch (e) {
    console.warn('[loadAllData] første forsøk feilet, prøver igjen:', e.message);
    // Vent litt før retry — gir cold start tid til å våkne
    await new Promise(r => setTimeout(r, 1500));
    return await loadAllData();
  }
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
  const prevStateRef = useRef(null);

  // 1. Init: hent eksisterende session
  useEffect(() => {
    let active = true;
    // Timeout på getSession (5 sek) — hvis Supabase-auth henger, gi opp og vis login
    withTimeout(supa.auth.getSession(), 5000, 'auth.getSession').then(({ data, error }) => {
      if (!active) return;
      if (error) console.error('[auth.getSession]', error);
      setSession(data?.session || null);
      if (data?.session) {
        loadAllDataWithRetry()
          .then(s => { if (active) { setStateRaw(s); prevStateRef.current = s; } })
          .catch(e => { console.error('[loadAllData]', e); setAuthErr('Kunne ikke laste data: ' + e.message); })
          .finally(() => { if (active) setLoading(false); });
      } else {
        setLoading(false);
      }
    }).catch(e => {
      console.error('[auth.getSession timeout]', e);
      if (active) { setAuthErr('Supabase svarer ikke: ' + e.message); setLoading(false); }
    });

    // 2. Lytt på auth-endringer
    const { data: sub } = supa.auth.onAuthStateChange(async (event, sess) => {
      if (!active) return;
      setSession(sess);
      if (event === 'SIGNED_IN' && sess) {
        setLoading(true);
        try {
          const s = await loadAllDataWithRetry();
          setStateRaw(s); prevStateRef.current = s;
        } catch (e) {
          console.error('[loadAllData on SIGNED_IN]', e);
          setAuthErr('Kunne ikke laste data: ' + e.message);
        } finally { setLoading(false); }
      } else if (event === 'SIGNED_OUT') {
        setStateRaw(null);
        prevStateRef.current = null;
      }
    });

    window.__onPersistError = (msg) => setPersistErr(msg);
    return () => { active = false; sub.subscription.unsubscribe(); };
  }, []);

  // Wrapper rundt setState som også persisterer
  const setState = useCallback((updater) => {
    setStateRaw(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      // Fire-and-forget persistering
      persistDiffs(prevStateRef.current, next).catch(e => console.error('[persistDiffs]', e));
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

  return { state, setState, session, loading, login, logout, authError, persistErr, clearPersistErr: () => setPersistErr('') };
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
