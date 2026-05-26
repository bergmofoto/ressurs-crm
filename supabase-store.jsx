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
async function loadAllData() {
  const [pakkerR, teamR, kunderR, tilbudR, notaterR, innstR] = await Promise.all([
    supa.from('pakker').select('*'),
    supa.from('team_members').select('*'),
    supa.from('kunder').select('*'),
    supa.from('tilbud').select('*'),
    supa.from('interne_notater').select('*'),
    supa.from('innstillinger').select('*'),
  ]);

  const anyErr = [pakkerR, teamR, kunderR, tilbudR, notaterR, innstR].find(r => r.error);
  if (anyErr) throw new Error(anyErr.error.message);

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
    supa.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error) console.error('[auth.getSession]', error);
      setSession(data?.session || null);
      if (data?.session) {
        loadAllData()
          .then(s => { if (active) { setStateRaw(s); prevStateRef.current = s; } })
          .catch(e => { console.error('[loadAllData]', e); setAuthErr('Kunne ikke laste data: ' + e.message); })
          .finally(() => { if (active) setLoading(false); });
      } else {
        setLoading(false);
      }
    });

    // 2. Lytt på auth-endringer
    const { data: sub } = supa.auth.onAuthStateChange(async (event, sess) => {
      if (!active) return;
      setSession(sess);
      if (event === 'SIGNED_IN' && sess) {
        setLoading(true);
        try {
          const s = await loadAllData();
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
function LoadingScreen() {
  return (
    <div style={{
      minHeight:'100vh', width:'100vw',
      display:'flex', alignItems:'center', justifyContent:'center',
      background: C.navy, color:'#fff',
    }}>
      <div style={{textAlign:'center'}}>
        <img src="assets/Ressurs_R_hvit.png" alt="Ressurs" style={{height:56, width:'auto', marginBottom:18, opacity:0.9}}/>
        <div style={{fontSize:13, color:'rgba(255,255,255,0.6)', letterSpacing:'.05em'}}>Laster…</div>
      </div>
    </div>
  );
}

Object.assign(window, { useStore, resetStore, LoginScreen, LoadingScreen });
