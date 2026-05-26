// ============================================================
// FRAMDRIFTSOVERSIKT — Salgsliste + Kalender
// ============================================================

function Pipeline({ state, setState, navigate }) {
  const { kunder, team, pakker } = state;

  const [tab, setTab] = useState(() => {
    try { return sessionStorage.getItem('pipeline_tab') || 'salgsliste'; }
    catch(e) { return 'salgsliste'; }
  });
  useEffect(() => {
    try { sessionStorage.setItem('pipeline_tab', tab); } catch(e) {}
  }, [tab]);

  const aktive = kunder.filter(k => !['Vunnet','Ferdigstilt','Tapt'].includes(k.status));
  const totalVerdi = aktive.reduce((s,k) => s + (k.verdi||0), 0);

  return (
    <div style={{padding:'28px 32px 0', height:'100%', display:'flex', flexDirection:'column', overflow:'hidden'}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:18}}>
        <div>
          <h1 style={{fontSize:28, fontWeight:700, color:C.navy, letterSpacing:'-0.01em', margin:0}}>Framdriftsoversikt</h1>
          <p style={{fontSize:14, color:C.gray500, marginTop:4, margin:0}}>
            {aktive.length} aktive saker · samlet verdi i framdrift {formatKr(totalVerdi)}
          </p>
        </div>
      </div>

      <div style={{display:'flex', gap:4, marginBottom:16, borderBottom:`1px solid ${C.gray200}`}}>
        {[
          {id:'salgsliste', label:'Salgsliste', icon:'list-ordered'},
          {id:'kalender',   label:'Kalender',   icon:'calendar'},
        ].map(t => (
          <button key={t.id} onClick={()=>setTab(t.id)} style={{
            background:'transparent', border:'none', cursor:'pointer', fontFamily:'inherit',
            padding:'10px 18px', fontSize:14,
            fontWeight: tab===t.id ? 600 : 500,
            color: tab===t.id ? C.navy : C.gray500,
            borderBottom: `2px solid ${tab===t.id ? C.navy : 'transparent'}`,
            marginBottom: -1,
            display:'inline-flex', alignItems:'center', gap:8,
          }}>
            <Icon name={t.icon} size={14}/>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{flex:1, overflow:'auto', paddingBottom:24}}>
        {tab === 'salgsliste' && <Salgsliste state={state} setState={setState} navigate={navigate}/>}
        {tab === 'kalender'   && <Kalender   state={state} navigate={navigate}/>}
      </div>
    </div>
  );
}

// ============================================================
// SALGSLISTE
// ============================================================

function Salgsliste({ state, setState, navigate }) {
  const { kunder, team, pakker } = state;
  const teamById  = useMemo(() => Object.fromEntries(team.map(t  => [t.id, t])),  [team]);
  const pakkeById = useMemo(() => Object.fromEntries(pakker.map(p => [p.id, p])), [pakker]);

  const [filterStatus, setFilterStatus] = useState('aktive'); // 'aktive' | 'alle' | spesifikk status
  const [filterAnsvarlig, setFilterAnsvarlig] = useState('alle');
  const [trengerHandling, setTrengerHandling] = useState(false);
  const [sort, setSort] = useState({ key: 'sak', dir: 'asc' }); // 'sak' = smart sort

  const moveStatus = (id, newStatus) => {
    setState(s => ({ ...s, kunder: s.kunder.map(k => k.id === id ? { ...k, status: newStatus } : k) }));
  };

  // Beriking: legg på utledede felt
  const beriket = useMemo(() => kunder.map(k => {
    const dagerSidenKontakt = k.sistKontakt ? -daysBetween(k.sistKontakt, TODAY) : null;
    const nesteDiff = k.nesteAktivitet?.dato ? daysBetween(TODAY, k.nesteAktivitet.dato) : null;
    const aktiv = !['Vunnet','Ferdigstilt','Tapt'].includes(k.status);
    let handling = null;
    if (aktiv) {
      if (nesteDiff != null && nesteDiff < 0) handling = { type:'forfalt', label:'Forfalt oppfølging', color: C.red };
      else if (k.nesteAktivitet == null)      handling = { type:'mangler', label:'Mangler neste steg',  color: C.amber };
      else if (dagerSidenKontakt != null && dagerSidenKontakt > 21) handling = { type:'kald', label:`Kald (${dagerSidenKontakt} dgr)`, color: C.amber };
    }
    return { ...k, dagerSidenKontakt, nesteDiff, aktiv, handling };
  }), [kunder]);

  // Filtre
  let filtered = beriket;
  if (filterStatus === 'aktive')      filtered = filtered.filter(k => k.aktiv);
  else if (filterStatus === 'vunnet')      filtered = filtered.filter(k => k.status === 'Vunnet');
  else if (filterStatus === 'ferdigstilt') filtered = filtered.filter(k => k.status === 'Ferdigstilt');
  else if (filterStatus === 'tapt')        filtered = filtered.filter(k => k.status === 'Tapt');
  else if (filterStatus !== 'alle')   filtered = filtered.filter(k => k.status === filterStatus);

  if (filterAnsvarlig !== 'alle') filtered = filtered.filter(k => k.ansvarligId === filterAnsvarlig);
  if (trengerHandling) filtered = filtered.filter(k => k.handling);

  // Sortering
  const sorted = useMemo(() => {
    const arr = [...filtered];
    const dir = sort.dir === 'asc' ? 1 : -1;
    arr.sort((a, b) => {
      switch (sort.key) {
        case 'bedrift': return a.bedriftsnavn.localeCompare(b.bedriftsnavn, 'no') * dir;
        case 'status':  return (STATUS_LISTE.indexOf(a.status) - STATUS_LISTE.indexOf(b.status)) * dir;
        case 'verdi':   return ((a.verdi||0) - (b.verdi||0)) * dir;
        case 'kontakt': return ((a.dagerSidenKontakt ?? 9999) - (b.dagerSidenKontakt ?? 9999)) * dir;
        case 'neste':   return ((a.nesteDiff ?? 9999) - (b.nesteDiff ?? 9999)) * dir;
        case 'ansvarlig': {
          const an = teamById[a.ansvarligId]?.navn || '';
          const bn = teamById[b.ansvarligId]?.navn || '';
          return an.localeCompare(bn, 'no') * dir;
        }
        case 'sak':
        default: {
          // Smart default: handling først, så etter status-rekkefølge, så verdi desc
          if (!!a.handling !== !!b.handling) return a.handling ? -1 : 1;
          const s = STATUS_LISTE.indexOf(a.status) - STATUS_LISTE.indexOf(b.status);
          if (s !== 0) return s;
          return (b.verdi||0) - (a.verdi||0);
        }
      }
    });
    return arr;
  }, [filtered, sort, teamById]);

  const handlingCount = beriket.filter(k => k.handling).length;
  const handleSort = (key) => {
    if (sort.key === key) setSort({ key, dir: sort.dir === 'asc' ? 'desc' : 'asc' });
    else setSort({ key, dir: 'asc' });
  };

  return (
    <div>
      {/* Filterbar */}
      <div style={{
        background:'#fff', padding:'12px 16px', borderRadius:8, border:`1px solid ${C.gray200}`,
        marginBottom:14, display:'flex', alignItems:'center', gap:12, flexWrap:'wrap',
      }}>
        <FilterDropdown
          label="Vis"
          value={filterStatus}
          onChange={setFilterStatus}
          options={[
            { value:'aktive', label:`Aktive (${beriket.filter(k=>k.aktiv).length})` },
            { value:'alle',   label:`Alle (${beriket.length})` },
            { value:'vunnet',      label:`Vunnet (${beriket.filter(k=>k.status==='Vunnet').length})` },
            { value:'ferdigstilt', label:`Ferdigstilt (${beriket.filter(k=>k.status==='Ferdigstilt').length})` },
            { value:'tapt',        label:`Tapt (${beriket.filter(k=>k.status==='Tapt').length})` },
            { value:'__div__', label:'──────────', disabled:true },
            ...STATUS_LISTE.map(s => ({ value:s, label:s })),
          ]}
        />
        <FilterDropdown
          label="Ansvarlig"
          value={filterAnsvarlig}
          onChange={setFilterAnsvarlig}
          options={[
            { value:'alle', label:'Alle' },
            ...team.map(t => ({ value: t.id, label: t.navn })),
          ]}
        />
        <button
          onClick={() => setTrengerHandling(!trengerHandling)}
          style={{
            display:'inline-flex', alignItems:'center', gap:7,
            padding:'7px 12px', borderRadius:6, fontSize:12, fontWeight:600,
            fontFamily:'inherit', cursor:'pointer',
            border: `1px solid ${trengerHandling ? C.red : C.gray200}`,
            background: trengerHandling ? '#fbe6e6' : '#fff',
            color: trengerHandling ? C.red : C.gray700,
          }}
        >
          <Icon name="alert-circle" size={13}/>
          Trenger handling
          <span style={{
            background: trengerHandling ? C.red : C.gray100,
            color: trengerHandling ? '#fff' : C.gray500,
            fontSize:10, fontWeight:700, padding:'1px 6px', borderRadius:9999,
          }}>{handlingCount}</span>
        </button>
        <div style={{flex:1}}/>
        <div style={{fontSize:12, color:C.gray500}}>
          {sorted.length} {sorted.length===1?'sak':'saker'} · {formatKr(sorted.reduce((s,k)=>s+(k.verdi||0),0))}
        </div>
      </div>

      {/* Tabell */}
      <Card padding={0} style={{overflow:'hidden'}}>
        <div style={{overflow:'auto'}}>
          <table style={{width:'100%', borderCollapse:'collapse', fontSize:13}}>
            <thead>
              <tr style={{background:C.gray50, borderBottom:`1px solid ${C.gray100}`}}>
                <SortHeader label="Bedrift"   sortKey="bedrift"   current={sort} onClick={handleSort} style={{width:'25%'}}/>
                <SortHeader label="Status"    sortKey="status"    current={sort} onClick={handleSort} style={{width:130}}/>
                <SortHeader label="Pakke"     sortKey={null}      current={sort} onClick={handleSort} style={{width:160}}/>
                <SortHeader label="Verdi"     sortKey="verdi"     current={sort} onClick={handleSort} align="right" style={{width:110}}/>
                <SortHeader label="Sist kontakt" sortKey="kontakt" current={sort} onClick={handleSort} style={{width:130}}/>
                <SortHeader label="Neste steg" sortKey="neste"   current={sort} onClick={handleSort} style={{width:200}}/>
                <SortHeader label="Ansvarlig" sortKey="ansvarlig" current={sort} onClick={handleSort} style={{width:60}}/>
              </tr>
            </thead>
            <tbody>
              {sorted.map((k, i) => {
                const ansv = teamById[k.ansvarligId];
                const pkg = pakkeById[k.pakkeId];
                return (
                  <tr key={k.id}
                    onClick={() => navigate('kundeprofil', { id: k.id })}
                    style={{
                      borderBottom: i < sorted.length-1 ? `1px solid ${C.gray100}` : 'none',
                      cursor:'pointer',
                      background: k.handling ? `${k.handling.color}06` : '#fff',
                      transition:'background 100ms',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = C.gray50}
                    onMouseLeave={e => e.currentTarget.style.background = k.handling ? `${k.handling.color}06` : '#fff'}
                  >
                    {/* Bedrift + handling */}
                    <td style={{...listTd, paddingLeft: 18}}>
                      <div style={{display:'flex', alignItems:'center', gap:10}}>
                        {k.handling && (
                          <div title={k.handling.label} style={{
                            width:6, height:6, borderRadius:'50%', background: k.handling.color, flexShrink:0,
                          }}/>
                        )}
                        <div style={{minWidth:0}}>
                          <div style={{fontWeight:600, color:C.navy, lineHeight:1.3}}>{k.bedriftsnavn}</div>
                          {k.handling && (
                            <div style={{fontSize:11, color: k.handling.color, fontWeight:600, marginTop:2, display:'flex', alignItems:'center', gap:4}}>
                              <Icon name="alert-circle" size={10}/>{k.handling.label}
                            </div>
                          )}
                          {!k.handling && k.bransje && (
                            <div style={{fontSize:11, color:C.gray500, marginTop:2}}>{k.bransje}</div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Status (inline-endring) */}
                    <td style={listTd} onClick={e => e.stopPropagation()}>
                      <StatusSelect value={k.status} onChange={ns => moveStatus(k.id, ns)}/>
                    </td>

                    {/* Pakke */}
                    <td style={listTd}>
                      {pkg ? (
                        <div style={{fontSize:12, color:C.gray700}}>{pkg.navn}</div>
                      ) : <span style={{color:C.gray400}}>–</span>}
                    </td>

                    {/* Verdi */}
                    <td style={{...listTd, textAlign:'right', fontWeight:700, color:C.navy}}>
                      {k.verdi ? formatKr(k.verdi) : <span style={{color:C.gray400, fontWeight:500}}>–</span>}
                    </td>

                    {/* Sist kontakt */}
                    <td style={listTd}>
                      {k.sistKontakt ? (
                        <div>
                          <div style={{fontSize:12, color:C.gray700}}>{formatDateShort(k.sistKontakt).replace(/ \d{4}$/,'')}</div>
                          <div style={{fontSize:11, color: k.dagerSidenKontakt > 21 ? C.amber : C.gray500, marginTop:1}}>
                            {k.dagerSidenKontakt != null ? (k.dagerSidenKontakt === 0 ? 'i dag' : `${k.dagerSidenKontakt} dgr siden`) : ''}
                          </div>
                        </div>
                      ) : <span style={{color:C.gray400}}>–</span>}
                    </td>

                    {/* Neste steg */}
                    <td style={listTd}>
                      <NesteStegCell neste={k.nesteAktivitet} diff={k.nesteDiff}/>
                    </td>

                    {/* Ansvarlig */}
                    <td style={{...listTd, paddingRight:18}}>
                      {ansv
                        ? <Avatar initialer={ansv.initialer} size={28} color={teamColor(ansv.id)}/>
                        : <span style={{color:C.gray400, fontSize:11}}>–</span>}
                    </td>
                  </tr>
                );
              })}
              {sorted.length === 0 && (
                <tr><td colSpan={7} style={{padding:40, textAlign:'center', color:C.gray400, fontSize:13}}>
                  Ingen saker matcher filteret.
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ── Salgsliste-hjelpere ──────────────────────────────────────
function SortHeader({ label, sortKey, current, onClick, align='left', style={} }) {
  const active = sortKey && current.key === sortKey;
  const sortable = !!sortKey;
  return (
    <th style={{
      padding:'10px 14px', textAlign: align, fontSize:11, fontWeight:700,
      color: active ? C.navy : C.gray500, textTransform:'uppercase', letterSpacing:'.06em',
      cursor: sortable ? 'pointer' : 'default', userSelect:'none',
      ...style,
    }} onClick={() => sortable && onClick(sortKey)}>
      <span style={{display:'inline-flex', alignItems:'center', gap:4}}>
        {label}
        {active && <Icon name={current.dir === 'asc' ? 'arrow-up' : 'arrow-down'} size={10} color={C.navy}/>}
      </span>
    </th>
  );
}

function StatusSelect({ value, onChange }) {
  const s = STATUS_FARGER[value] || STATUS_FARGER.Lead;
  return (
    <div style={{position:'relative', display:'inline-block'}}>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          appearance:'none', WebkitAppearance:'none', MozAppearance:'none',
          background: s.bg, color: s.fg,
          fontSize:12, fontWeight:600,
          padding:'4px 22px 4px 10px',
          borderRadius:9999, border:'none',
          cursor:'pointer', fontFamily:'inherit', outline:'none',
        }}
      >
        {STATUS_LISTE.map(st => <option key={st} value={st}>{st}</option>)}
      </select>
      <div style={{position:'absolute', right:6, top:'50%', transform:'translateY(-50%)', pointerEvents:'none'}}>
        <Icon name="chevron-down" size={10} color={s.fg}/>
      </div>
    </div>
  );
}

function NesteStegCell({ neste, diff }) {
  if (!neste?.dato) return <span style={{color:C.gray400, fontSize:11, fontStyle:'italic'}}>Ingen planlagt</span>;
  const color = diff < 0 ? C.red : diff <= 3 ? C.amber : C.green;
  const meta = AKTIVITETSTYPER[neste.type] || AKTIVITETSTYPER.oppfølging;
  const dayLabel = diff < 0 ? `Forfalt ${Math.abs(diff)} dgr` : diff === 0 ? 'I dag' : diff === 1 ? 'I morgen' : `om ${diff} dgr`;
  return (
    <div style={{display:'flex', alignItems:'center', gap:10}}>
      <div style={{width:22, height:22, borderRadius:5, background: meta.bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0}}>
        <Icon name={meta.icon} size={11} color={meta.color}/>
      </div>
      <div style={{minWidth:0, flex:1}}>
        <div style={{fontSize:12, color:C.navy, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:180}}>
          {neste.beskrivelse}
        </div>
        <div style={{fontSize:11, color, fontWeight:600, marginTop:1}}>{dayLabel}</div>
      </div>
    </div>
  );
}

function FilterDropdown({ label, value, onChange, options }) {
  return (
    <label style={{display:'inline-flex', alignItems:'center', gap:8}}>
      <span style={{fontSize:11, fontWeight:600, color:C.gray500, textTransform:'uppercase', letterSpacing:'.05em'}}>{label}</span>
      <select value={value} onChange={e => onChange(e.target.value)} style={{
        padding:'6px 10px', border:`1px solid ${C.gray200}`, borderRadius:6,
        fontSize:12, fontFamily:'inherit', color:C.navy, background:'#fff', cursor:'pointer', fontWeight:500,
      }}>
        {options.map(o => <option key={o.value} value={o.value} disabled={o.disabled}>{o.label}</option>)}
      </select>
    </label>
  );
}

const listTd = {
  padding:'14px 14px',
  fontSize:13,
  color: C.navy,
  verticalAlign:'middle',
};

// ============================================================
// KALENDER
// ============================================================

function Kalender({ state, navigate }) {
  const { kunder, team } = state;
  const teamById = useMemo(() => Object.fromEntries(team.map(t => [t.id, t])), [team]);

  // Default: gjeldende måned
  const todayD = parseISO(TODAY);
  const [year, setYear] = useState(todayD.getFullYear());
  const [month, setMonth] = useState(todayD.getMonth());
  const [filterAnsvarlig, setFilterAnsvarlig] = useState('alle');

  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month+1, 0);
  const monthLabel = `${MAANEDER_LONG[month]} ${year}`;

  // Bygg liste over events (nesteAktivitet) for alle kunder
  const events = useMemo(() => {
    const evs = [];
    kunder.forEach(k => {
      if (k.nesteAktivitet?.dato) {
        evs.push({
          id: k.id + '_neste',
          kundeId: k.id,
          bedrift: k.bedriftsnavn,
          ansvarligId: k.ansvarligId,
          status: k.status,
          pakkeId: k.pakkeId,
          dato: k.nesteAktivitet.dato,
          type: k.nesteAktivitet.type,
          beskrivelse: k.nesteAktivitet.beskrivelse,
        });
      }
    });
    return evs;
  }, [kunder]);

  const eventsFiltered = filterAnsvarlig === 'alle' ? events : events.filter(e => e.ansvarligId === filterAnsvarlig);

  // Events for current month
  const monthStartISO = toISO(monthStart);
  const monthEndISO = toISO(monthEnd);
  const eventsThisMonth = eventsFiltered.filter(e => e.dato >= monthStartISO && e.dato <= monthEndISO);

  // Vunne kunder med leveranse denne måneden (oppstart eller løpende)
  const leveranserDenneMaaneden = eventsThisMonth.filter(e => e.status === 'Vunnet')
    .sort((a,b) => a.dato.localeCompare(b.dato));

  // Group events by date
  const eventsByDate = useMemo(() => {
    const map = {};
    eventsThisMonth.forEach(e => {
      if (!map[e.dato]) map[e.dato] = [];
      map[e.dato].push(e);
    });
    return map;
  }, [eventsThisMonth]);

  // Build calendar grid (6 rows × 7 cols max)
  const firstDayOfWeek = (monthStart.getDay() + 6) % 7; // mon=0
  const daysInMonth = monthEnd.getDate();
  const cells = [];
  // Lead-in (forrige måneds dager)
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const d = new Date(year, month, -i);
    cells.push({ date: d, current: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: new Date(year, month, d), current: true });
  }
  // Lead-out
  while (cells.length % 7 !== 0) {
    const last = cells[cells.length-1].date;
    cells.push({ date: new Date(last.getFullYear(), last.getMonth(), last.getDate()+1), current: false });
  }
  // Sørg for minst 5 rader = 35 celler (helst 6 = 42 for konsistent høyde)
  while (cells.length < 35) {
    const last = cells[cells.length-1].date;
    cells.push({ date: new Date(last.getFullYear(), last.getMonth(), last.getDate()+1), current: false });
  }

  const goPrev = () => { if (month === 0) { setYear(year-1); setMonth(11); } else setMonth(month-1); };
  const goNext = () => { if (month === 11) { setYear(year+1); setMonth(0); } else setMonth(month+1); };
  const goToday = () => { setYear(todayD.getFullYear()); setMonth(todayD.getMonth()); };

  return (
    <div>
      {/* Kontroller */}
      <div style={{
        background:'#fff', padding:'12px 16px', borderRadius:8, border:`1px solid ${C.gray200}`,
        marginBottom:14, display:'flex', alignItems:'center', gap:12, flexWrap:'wrap',
      }}>
        <div style={{display:'flex', alignItems:'center', gap:6}}>
          <button onClick={goPrev} style={calNavBtn} title="Forrige måned"><Icon name="chevron-left" size={16} color={C.navy}/></button>
          <div style={{fontSize:15, fontWeight:700, color:C.navy, minWidth:170, textAlign:'center', textTransform:'capitalize'}}>{monthLabel}</div>
          <button onClick={goNext} style={calNavBtn} title="Neste måned"><Icon name="chevron-right" size={16} color={C.navy}/></button>
          <button onClick={goToday} style={{marginLeft:8, padding:'6px 12px', border:`1px solid ${C.gray200}`, borderRadius:6, background:'#fff', cursor:'pointer', fontSize:12, fontWeight:600, color:C.gray700, fontFamily:'inherit'}}>I dag</button>
        </div>
        <div style={{flex:1}}/>
        <FilterDropdown
          label="Ansvarlig"
          value={filterAnsvarlig}
          onChange={setFilterAnsvarlig}
          options={[
            { value:'alle', label:'Alle' },
            ...team.map(t => ({ value: t.id, label: t.navn })),
          ]}
        />
        <KalLegend/>
      </div>

      {/* Leveranser denne måneden (for Vunnet kunder) */}
      {leveranserDenneMaaneden.length > 0 && (
        <Card padding={0} style={{marginBottom:14, overflow:'hidden'}}>
          <div style={{padding:'14px 18px', borderBottom:`1px solid ${C.gray100}`, display:'flex', alignItems:'center', gap:10, background:'#f4fbf3'}}>
            <Icon name="check-circle-2" size={16} color={C.green}/>
            <div style={{fontSize:14, fontWeight:700, color:C.navy}}>Leveranser denne måneden</div>
            <div style={{fontSize:12, color:C.gray500}}>{leveranserDenneMaaneden.length} aktive vunne kunder med planlagt aktivitet</div>
          </div>
          <div>
            {leveranserDenneMaaneden.map((e, i) => {
              const k = kunder.find(k => k.id === e.kundeId);
              const ansv = teamById[e.ansvarligId];
              const meta = AKTIVITETSTYPER[e.type] || AKTIVITETSTYPER.møte;
              const pakke = state.pakker.find(p => p.id === e.pakkeId);
              return (
                <div key={e.id}
                  onClick={() => navigate('kundeprofil', { id: e.kundeId })}
                  style={{
                    padding:'12px 18px', display:'grid', gridTemplateColumns:'90px 1fr 200px 32px',
                    gap:14, alignItems:'center', cursor:'pointer',
                    borderTop: i > 0 ? `1px solid ${C.gray50}` : 'none',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = C.gray50}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div>
                    <div style={{fontSize:11, color:C.gray500, fontWeight:600, textTransform:'uppercase', letterSpacing:'.05em'}}>{MAANEDER[parseISO(e.dato).getMonth()].replace('.', '')}</div>
                    <div style={{fontSize:20, fontWeight:700, color:C.navy, lineHeight:1, letterSpacing:'-0.02em'}}>{parseISO(e.dato).getDate()}.</div>
                  </div>
                  <div>
                    <div style={{fontSize:14, fontWeight:600, color:C.navy}}>{e.bedrift}</div>
                    <div style={{fontSize:12, color:C.gray500, marginTop:2, display:'flex', alignItems:'center', gap:6}}>
                      <Icon name={meta.icon} size={11} color={meta.color}/>
                      {meta.label}: {e.beskrivelse}
                    </div>
                  </div>
                  <div style={{fontSize:12, color:C.gray500}}>{pakke?.navn || ''}</div>
                  {ansv && <Avatar initialer={ansv.initialer} size={26} color={teamColor(ansv.id)}/>}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Kalender-grid */}
      <Card padding={0} style={{overflow:'hidden'}}>
        <div style={{display:'grid', gridTemplateColumns:'repeat(7, 1fr)', background:C.gray50, borderBottom:`1px solid ${C.gray100}`}}>
          {['Man','Tir','Ons','Tor','Fre','Lør','Søn'].map(d => (
            <div key={d} style={{padding:'10px 12px', fontSize:11, fontWeight:700, color:C.gray500, textTransform:'uppercase', letterSpacing:'.06em', textAlign:'left'}}>{d}</div>
          ))}
        </div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(7, 1fr)', gridAutoRows:'minmax(110px, 1fr)'}}>
          {cells.map((cell, i) => {
            const iso = toISO(cell.date);
            const isToday = iso === TODAY;
            const isWeekend = cell.date.getDay() === 0 || cell.date.getDay() === 6;
            const dayEvents = eventsByDate[iso] || [];
            return (
              <div key={i} style={{
                padding:8,
                borderRight: (i+1) % 7 !== 0 ? `1px solid ${C.gray100}` : 'none',
                borderTop: i >= 7 ? `1px solid ${C.gray100}` : 'none',
                background: !cell.current ? C.gray50 : isWeekend ? '#fdfdfe' : '#fff',
                opacity: cell.current ? 1 : 0.5,
                display:'flex', flexDirection:'column', gap:4, minHeight:0, overflow:'hidden',
              }}>
                <div style={{
                  display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:2,
                }}>
                  <div style={{
                    fontSize:12, fontWeight: isToday ? 700 : 500,
                    color: isToday ? '#fff' : (cell.current ? C.navy : C.gray400),
                    background: isToday ? C.bright : 'transparent',
                    width: 22, height: 22, borderRadius:'50%',
                    display:'inline-flex', alignItems:'center', justifyContent:'center',
                    lineHeight:1,
                  }}>{cell.date.getDate()}</div>
                </div>
                {dayEvents.slice(0, 3).map(e => <KalEvent key={e.id} event={e} teamById={teamById} onClick={() => navigate('kundeprofil', { id: e.kundeId })}/>)}
                {dayEvents.length > 3 && (
                  <div style={{fontSize:10, color:C.gray500, fontWeight:600, paddingLeft:4}}>+{dayEvents.length - 3} til</div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {eventsThisMonth.length === 0 && (
        <div style={{padding:'20px 16px', textAlign:'center', fontSize:13, color:C.gray500}}>
          Ingen planlagte aktiviteter i {monthLabel}.
        </div>
      )}
    </div>
  );
}

function KalEvent({ event, teamById, onClick }) {
  const sc = STATUS_FARGER[event.status] || STATUS_FARGER.Lead;
  const isVunnet = event.status === 'Vunnet';
  const diff = daysBetween(TODAY, event.dato);
  const forfalt = diff < 0;
  const bg = forfalt ? '#fbe6e6' : isVunnet ? '#e8f7e6' : sc.bg;
  const fg = forfalt ? C.red : isVunnet ? '#2e7c25' : sc.fg;
  const dotColor = forfalt ? C.red : sc.accent;
  const ansv = teamById[event.ansvarligId];

  return (
    <div
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      title={`${event.bedrift} — ${event.beskrivelse}`}
      style={{
        display:'flex', alignItems:'center', gap:5,
        padding:'3px 6px', borderRadius:4, background: bg, color: fg,
        fontSize:11, fontWeight:600, cursor:'pointer', minWidth:0,
        borderLeft:`3px solid ${dotColor}`,
      }}
    >
      <span style={{flex:1, minWidth:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>
        {event.bedrift}
      </span>
      {ansv && (
        <span style={{
          width:14, height:14, borderRadius:'50%', background: teamColor(ansv.id), color:'#fff',
          fontSize:8, fontWeight:700, display:'inline-flex', alignItems:'center', justifyContent:'center', flexShrink:0,
          letterSpacing:0,
        }}>{ansv.initialer.slice(0,2)}</span>
      )}
    </div>
  );
}

function KalLegend() {
  return (
    <div style={{display:'flex', gap:10, fontSize:11, color:C.gray500, alignItems:'center'}}>
      <span style={{display:'inline-flex', alignItems:'center', gap:5}}><span style={{width:8,height:8,borderRadius:2,background:C.green}}/>Vunnet/leveranse</span>
      <span style={{display:'inline-flex', alignItems:'center', gap:5}}><span style={{width:8,height:8,borderRadius:2,background:C.bright}}/>Pågående salg</span>
      <span style={{display:'inline-flex', alignItems:'center', gap:5}}><span style={{width:8,height:8,borderRadius:2,background:C.red}}/>Forfalt</span>
    </div>
  );
}

const calNavBtn = {
  width:32, height:32, borderRadius:6, border:`1px solid ${C.gray200}`,
  background:'#fff', cursor:'pointer', display:'inline-flex', alignItems:'center', justifyContent:'center', padding:0,
};

window.Pipeline = Pipeline;
