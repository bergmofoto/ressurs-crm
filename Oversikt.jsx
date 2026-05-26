// ============================================================
// OVERSIKT (Dashboard)
// ============================================================

function Oversikt({ state, navigate }) {
  const { kunder, team, pakker } = state;

  const teamById = useMemo(() => Object.fromEntries(team.map(t => [t.id, t])), [team]);
  const pakkeById = useMemo(() => Object.fromEntries(pakker.map(p => [p.id, p])), [pakker]);

  // KPIs
  const aktiveKunder = kunder.filter(k => k.status === 'Vunnet').length;
  const pipelineVerdi = kunder
    .filter(k => ['Tilbud sendt','Forhandling'].includes(k.status))
    .reduce((s,k) => s + (k.verdi || 0), 0);

  // Aktiviteter denne uken: man-søn rundt TODAY
  const today = parseISO(TODAY);
  const dow = (today.getDay()+6) % 7; // mon=0
  const monday = new Date(today); monday.setDate(today.getDate() - dow);
  const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6);
  const mondayISO = toISO(monday), sundayISO = toISO(sunday);
  const aktiviteterDenneUken = kunder.flatMap(k => k.aktiviteter.map(a => ({...a, kundeId:k.id})))
    .filter(a => a.dato >= mondayISO && a.dato <= sundayISO).length;

  // Resultat vs budsjett
  const totalInntekt = inntektTotal(kunder);
  const totalBudsjett = budsjettTotal(team);
  const budsjettPct = totalBudsjett > 0 ? (totalInntekt / totalBudsjett) * 100 : 0;
  const proRated = proRatedTarget(totalBudsjett, TODAY);
  const proRatedPct = totalBudsjett > 0 ? (proRated / totalBudsjett) * 100 : 0;
  const budsjettColor = totalBudsjett === 0 ? C.gray400
    : totalInntekt >= proRated ? C.green
    : totalInntekt >= proRated * 0.6 ? C.amber
    : C.red;

  // Pipeline per status
  const perStatus = STATUS_LISTE.map(s => {
    const items = kunder.filter(k => k.status === s);
    return { status: s, antall: items.length, verdi: items.reduce((sum,k)=>sum+(k.verdi||0),0) };
  });
  const maxVerdi = Math.max(...perStatus.map(p => p.verdi), 1);

  // Kunder med forfalt eller kommende aktivitet (≤7 dager)
  const opp = kunder
    .filter(k => k.nesteAktivitet?.dato)
    .map(k => {
      const diff = daysBetween(TODAY, k.nesteAktivitet.dato);
      return { ...k, diff };
    })
    .filter(k => k.diff <= 7)
    .sort((a,b) => a.diff - b.diff);

  // Sortering/filter på oppfølginger
  const [oppSort, setOppSort] = useState('dato'); // 'dato' | 'ansvarlig'
  const [oppFilter, setOppFilter] = useState('alle'); // 'alle' | teamId

  const oppFiltered = oppFilter === 'alle' ? opp : opp.filter(k => k.ansvarligId === oppFilter);

  // Grupperte oppfølginger per ansvarlig (når oppSort === 'ansvarlig')
  const oppGruppert = useMemo(() => {
    if (oppSort !== 'ansvarlig') return null;
    const groups = {};
    oppFiltered.forEach(k => {
      const id = k.ansvarligId || '_uten';
      if (!groups[id]) groups[id] = [];
      groups[id].push(k);
    });
    // Behold team-rekkefølge, sett "uten ansvarlig" sist
    const ordered = team.map(t => ({ team: t, items: groups[t.id] || [] })).filter(g => g.items.length > 0);
    if (groups._uten) ordered.push({ team: null, items: groups._uten });
    return ordered;
  }, [oppSort, oppFiltered, team]);

  // Siste 8 aktiviteter på tvers
  const sisteAktiviteter = kunder.flatMap(k =>
    k.aktiviteter.map(a => ({...a, kundeId:k.id, bedrift:k.bedriftsnavn}))
  ).sort((a,b) => b.dato.localeCompare(a.dato)).slice(0, 8);

  return (
    <div style={{padding:'28px 32px', maxWidth:1400, margin:'0 auto'}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24}}>
        <div>
          <h1 style={{fontSize:28, fontWeight:700, color:C.navy, letterSpacing:'-0.01em', margin:0}}>Oversikt</h1>
          <p style={{fontSize:14, color:C.gray500, marginTop:4, margin:0}}>Torsdag {formatDateLong(TODAY)}</p>
        </div>
        <Button icon="user-plus" variant="primary" onClick={() => navigate('kunder', { newCustomer: true })}>Ny kunde</Button>
      </div>

      {/* KPI cards */}
      <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:16, marginBottom:24}}>
        <KPICard label="Aktive kunder" value={aktiveKunder} sub="Vunne avtaler" accent={C.green} icon="briefcase"/>
        <KPICard label="Verdi i framdrift" value={formatKr(pipelineVerdi)} sub="Tilbud sendt + forhandling" accent={C.amber} icon="trending-up"/>
        <KPICard label="Aktiviteter denne uken" value={aktiviteterDenneUken} sub={`${formatDateShort(mondayISO).replace(' 2026','')}–${formatDateShort(sundayISO).replace(' 2026','')}`} accent={C.blue} icon="calendar"/>
        <BudsjettKPICard
          actual={totalInntekt}
          budsjett={totalBudsjett}
          pct={budsjettPct}
          proRatedPct={proRatedPct}
          color={budsjettColor}
          onClick={() => navigate('rapporter')}
        />
      </div>

      {/* Pipeline bars */}
      <Card style={{marginBottom:24}} padding={0}>
        <div style={{padding:'18px 24px', borderBottom:`1px solid ${C.gray100}`, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <div style={{fontSize:15, fontWeight:700, color:C.navy}}>Fordeling per status</div>
          <button onClick={() => navigate('pipeline')} style={{fontSize:13, color:C.blue, background:'none', border:'none', cursor:'pointer', fontWeight:600, fontFamily:'inherit'}}>Åpne framdriftsoversikt →</button>
        </div>
        <div style={{padding:'18px 24px', display:'flex', flexDirection:'column', gap:12}}>
          {perStatus.map(p => {
            const sc = STATUS_FARGER[p.status];
            const w = p.verdi > 0 ? (p.verdi / maxVerdi) * 100 : 0;
            return (
              <div key={p.status} style={{display:'grid', gridTemplateColumns:'150px 1fr 140px', gap:14, alignItems:'center'}}>
                <div style={{display:'flex', alignItems:'center', gap:8}}>
                  <span style={{width:8, height:8, borderRadius:'50%', background:sc.dot}}/>
                  <span style={{fontSize:13, fontWeight:600, color:C.navy}}>{p.status}</span>
                </div>
                <div style={{position:'relative', height:24, background:C.gray50, borderRadius:6, overflow:'hidden'}}>
                  <div style={{width:`${Math.max(w, p.antall>0?4:0)}%`, height:'100%', background:sc.accent, opacity:0.85, borderRadius:6, transition:'width 300ms'}}/>
                  <div style={{position:'absolute', left:10, top:0, bottom:0, display:'flex', alignItems:'center', fontSize:12, fontWeight:600, color: w>15 ? '#fff' : C.gray700}}>
                    {p.antall} {p.antall === 1 ? 'kunde' : 'kunder'}
                  </div>
                </div>
                <div style={{fontSize:13, fontWeight:600, color:C.navy, textAlign:'right'}}>{formatKr(p.verdi)}</div>
              </div>
            );
          })}
        </div>
      </Card>

      <div style={{display:'grid', gridTemplateColumns:'1.2fr 1fr', gap:20}}>
        {/* Oppfølginger */}
        <Card padding={0}>
          <div style={{padding:'18px 22px', borderBottom:`1px solid ${C.gray100}`}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12}}>
              <div>
                <div style={{fontSize:15, fontWeight:700, color:C.navy}}>Oppfølginger</div>
                <div style={{fontSize:12, color:C.gray500, marginTop:2}}>Forfalt eller innen 7 dager · {oppFiltered.length} {oppFiltered.length===1?'sak':'saker'}</div>
              </div>
              <Legend/>
            </div>
            <div style={{display:'flex', gap:10, alignItems:'center', flexWrap:'wrap'}}>
              <SegmentedToggle
                value={oppSort}
                onChange={setOppSort}
                options={[
                  { value:'dato',      label:'Forfallsdato', icon:'calendar' },
                  { value:'ansvarlig', label:'Per ansvarlig', icon:'users' },
                ]}
              />
              <select
                value={oppFilter}
                onChange={e=>setOppFilter(e.target.value)}
                style={{
                  padding:'6px 10px', border:`1px solid ${C.gray200}`, borderRadius:6,
                  fontSize:12, fontFamily:'inherit', color:C.navy, background:'#fff', cursor:'pointer',
                  fontWeight:500,
                }}
              >
                <option value="alle">Alle ansvarlige</option>
                {team.map(t => <option key={t.id} value={t.id}>{t.navn}</option>)}
              </select>
            </div>
          </div>
          <div>
            {oppFiltered.length === 0 && (
              <div style={{padding:30, textAlign:'center', color:C.gray400, fontSize:13}}>
                {oppFilter === 'alle'
                  ? 'Ingen oppfølginger forfaller den neste uken.'
                  : 'Ingen oppfølginger for valgt ansvarlig den neste uken.'}
              </div>
            )}
            {oppSort === 'dato' && oppFiltered.map(k =>
              <OppfolgingRow key={k.id} kunde={k} team={teamById} onClick={() => navigate('kundeprofil', { id: k.id })}/>
            )}
            {oppSort === 'ansvarlig' && oppGruppert && oppGruppert.map(g => (
              <div key={g.team?.id || '_uten'}>
                <div style={{
                  padding:'10px 22px', background:C.gray50,
                  borderTop:`1px solid ${C.gray100}`, borderBottom:`1px solid ${C.gray100}`,
                  display:'flex', alignItems:'center', gap:10,
                }}>
                  {g.team
                    ? <><Avatar initialer={g.team.initialer} size={22} color={teamColor(g.team.id)}/>
                        <div style={{fontSize:13, fontWeight:700, color:C.navy}}>{g.team.navn}</div>
                        <div style={{fontSize:11, color:C.gray500}}>· {g.team.rolle}</div></>
                    : <div style={{fontSize:13, fontWeight:700, color:C.gray500}}>Uten ansvarlig</div>}
                  <div style={{marginLeft:'auto', fontSize:11, fontWeight:600, color:C.gray500, background:'#fff', padding:'2px 8px', borderRadius:9999, border:`1px solid ${C.gray200}`}}>
                    {g.items.length} {g.items.length===1?'sak':'saker'}
                  </div>
                </div>
                {g.items.map(k =>
                  <OppfolgingRow key={k.id} kunde={k} team={teamById} onClick={() => navigate('kundeprofil', { id: k.id })}/>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Siste aktivitet */}
        <Card padding={0}>
          <div style={{padding:'18px 22px', borderBottom:`1px solid ${C.gray100}`, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <div style={{fontSize:15, fontWeight:700, color:C.navy}}>Siste aktivitet</div>
            <div style={{fontSize:12, color:C.gray500}}>Siste 8</div>
          </div>
          <div>
            {sisteAktiviteter.map((a, i) => {
              const meta = AKTIVITETSTYPER[a.type] || AKTIVITETSTYPER.epost;
              return (
                <div key={i} onClick={() => navigate('kundeprofil', { id: a.kundeId })}
                  style={{padding:'12px 22px', display:'flex', gap:12, alignItems:'flex-start', cursor:'pointer',
                    borderBottom: i < sisteAktiviteter.length-1 ? `1px solid ${C.gray50}` : 'none',
                    transition:'background 100ms',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = C.gray50}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{
                    width:32, height:32, borderRadius:8, background: meta.bg,
                    display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
                  }}>
                    <Icon name={meta.icon} size={15} color={meta.color}/>
                  </div>
                  <div style={{flex:1, minWidth:0}}>
                    <div style={{fontSize:12, color:C.gray500, marginBottom:2}}>{a.bedrift}</div>
                    <div style={{fontSize:13, fontWeight:600, color:C.navy, lineHeight:1.3}}>{a.tittel}</div>
                    <div style={{fontSize:11, color:C.gray400, marginTop:3}}>{meta.label} · {formatDateShort(a.dato)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}

// Spesialisert KPI-kort for "Resultat vs budsjett" — viser progress bar med pro-ratet mark
function BudsjettKPICard({ actual, budsjett, pct, proRatedPct, color, onClick }) {
  const w = Math.min(pct, 100);
  return (
    <div onClick={onClick} style={{
      background:'#fff', borderRadius:10, padding:'18px 20px',
      boxShadow:'0 1px 3px rgba(22,39,61,0.06), 0 2px 8px rgba(22,39,61,0.04)',
      border:`1px solid ${C.gray100}`,
      position:'relative', overflow:'hidden',
      cursor: onClick ? 'pointer' : 'default',
      transition:'transform 120ms, box-shadow 120ms',
    }}
      onMouseEnter={e => { if (onClick) { e.currentTarget.style.transform='translateY(-1px)'; e.currentTarget.style.boxShadow='0 4px 14px rgba(22,39,61,0.08)'; }}}
      onMouseLeave={e => { if (onClick) { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='0 1px 3px rgba(22,39,61,0.06), 0 2px 8px rgba(22,39,61,0.04)'; }}}
    >
      <div style={{position:'absolute', top:0, left:0, right:0, height:3, background:color}}/>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10}}>
        <div style={{fontSize:11, fontWeight:600, color:C.gray500, textTransform:'uppercase', letterSpacing:'.05em'}}>Resultat vs budsjett</div>
        <div style={{width:28, height:28, borderRadius:7, background:`${color}15`, display:'flex', alignItems:'center', justifyContent:'center'}}>
          <Icon name="target" size={14} color={color}/>
        </div>
      </div>
      <div style={{display:'flex', alignItems:'baseline', gap:8, marginBottom:8}}>
        <div style={{fontSize:26, fontWeight:700, color:C.navy, letterSpacing:'-0.02em', lineHeight:1.1}}>{formatKrShort(actual)}</div>
        <div style={{fontSize:13, fontWeight:600, color:C.gray500}}>av {formatKrShort(budsjett)}</div>
      </div>
      {budsjett > 0 ? (
        <div style={{position:'relative', height:6, background:C.gray100, borderRadius:9999, overflow:'visible'}}>
          <div style={{width:`${w}%`, height:'100%', background:color, borderRadius:9999, transition:'width 400ms'}}/>
          {/* pro-ratet mål (hvor de "burde være" akkurat nå) */}
          {proRatedPct > 0 && proRatedPct < 100 && (
            <div title={`Pro-ratet mål ${Math.round(proRatedPct)}%`} style={{
              position:'absolute', left:`${proRatedPct}%`, top:-3, bottom:-3, width:2,
              background: C.navy, opacity:0.5, borderRadius:1,
            }}/>
          )}
        </div>
      ) : (
        <div style={{fontSize:11, color:C.gray400, fontStyle:'italic'}}>Ingen budsjett satt — oppdater under Innstillinger → Team</div>
      )}
      <div style={{fontSize:12, color:C.gray500, marginTop:8, display:'flex', justifyContent:'space-between'}}>
        <span>{Math.round(pct)}% av årsmål</span>
        {budsjett > 0 && <span style={{color:C.gray400}}>Mål YTD: {Math.round(proRatedPct)}%</span>}
      </div>
    </div>
  );
}

// Segmented toggle (pill-stil) for sort/filter
function SegmentedToggle({ value, onChange, options }) {
  return (
    <div style={{display:'inline-flex', background:C.gray50, borderRadius:7, padding:2, gap:2, border:`1px solid ${C.gray200}`}}>
      {options.map(o => {
        const active = o.value === value;
        return (
          <button key={o.value} onClick={()=>onChange(o.value)} style={{
            padding:'5px 10px', borderRadius:5, border:'none', cursor:'pointer',
            background: active ? '#fff' : 'transparent',
            color: active ? C.navy : C.gray500,
            fontSize:12, fontWeight:600, fontFamily:'inherit',
            display:'inline-flex', alignItems:'center', gap:5,
            boxShadow: active ? '0 1px 2px rgba(22,39,61,0.08)' : 'none',
            transition:'all 120ms',
          }}>
            {o.icon && <Icon name={o.icon} size={11}/>}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function KPICard({ label, value, sub, accent, icon }) {
  return (
    <div style={{
      background:'#fff', borderRadius:10, padding:'18px 20px',
      boxShadow:'0 1px 3px rgba(22,39,61,0.06), 0 2px 8px rgba(22,39,61,0.04)',
      border:`1px solid ${C.gray100}`,
      position:'relative', overflow:'hidden',
    }}>
      <div style={{position:'absolute', top:0, left:0, right:0, height:3, background:accent}}/>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10}}>
        <div style={{fontSize:11, fontWeight:600, color:C.gray500, textTransform:'uppercase', letterSpacing:'.05em'}}>{label}</div>
        <div style={{width:28, height:28, borderRadius:7, background:`${accent}15`, display:'flex', alignItems:'center', justifyContent:'center'}}>
          <Icon name={icon} size={14} color={accent}/>
        </div>
      </div>
      <div style={{fontSize:26, fontWeight:700, color:C.navy, letterSpacing:'-0.02em', lineHeight:1.1}}>{value}</div>
      <div style={{fontSize:12, color:C.gray500, marginTop:6}}>{sub}</div>
    </div>
  );
}

function Legend() {
  return (
    <div style={{display:'flex', gap:12, fontSize:11, color:C.gray500}}>
      <span style={{display:'inline-flex', alignItems:'center', gap:5}}><span style={{width:8,height:8,borderRadius:'50%',background:C.red}}/>Forfalt</span>
      <span style={{display:'inline-flex', alignItems:'center', gap:5}}><span style={{width:8,height:8,borderRadius:'50%',background:C.amber}}/>≤3 dager</span>
      <span style={{display:'inline-flex', alignItems:'center', gap:5}}><span style={{width:8,height:8,borderRadius:'50%',background:C.green}}/>Senere</span>
    </div>
  );
}

function OppfolgingRow({ kunde, team, onClick }) {
  const diff = kunde.diff;
  const color = diff < 0 ? C.red : diff <= 3 ? C.amber : C.green;
  const bg    = diff < 0 ? '#fbe6e6' : diff <= 3 ? '#fef4e3' : '#e8f7e6';
  const label = diff < 0 ? `Forfalt for ${Math.abs(diff)} ${Math.abs(diff)===1?'dag':'dager'} siden` : diff===0?'Forfaller i dag': diff===1?'I morgen': `om ${diff} dager`;
  const meta = AKTIVITETSTYPER[kunde.nesteAktivitet.type] || AKTIVITETSTYPER.oppfølging;
  const ansv = team[kunde.ansvarligId];
  return (
    <div onClick={onClick} style={{
      padding:'14px 22px', borderBottom:`1px solid ${C.gray50}`,
      display:'flex', alignItems:'center', gap:14, cursor:'pointer',
      borderLeft:`3px solid ${color}`,
      transition:'background 100ms',
    }}
      onMouseEnter={e => e.currentTarget.style.background = C.gray50}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <div style={{
        width:36, height:36, borderRadius:8, background:meta.bg,
        display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
      }}>
        <Icon name={meta.icon} size={16} color={meta.color}/>
      </div>
      <div style={{flex:1, minWidth:0}}>
        <div style={{fontSize:14, fontWeight:600, color:C.navy}}>{kunde.bedriftsnavn}</div>
        <div style={{fontSize:12, color:C.gray500, marginTop:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>
          {meta.label}: {kunde.nesteAktivitet.beskrivelse}
        </div>
      </div>
      {ansv && <Avatar initialer={ansv.initialer} size={28} color={teamColor(ansv.id)}/>}
      <div style={{
        fontSize:11, fontWeight:600, color, background:bg, padding:'4px 10px', borderRadius:9999, whiteSpace:'nowrap',
      }}>{label}</div>
    </div>
  );
}

window.Oversikt = Oversikt;
