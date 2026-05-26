// ============================================================
// RAPPORTER — Månedsrapport + Kunderapport (printbare)
// ============================================================

function Rapporter({ state, navigate }) {
  const [tab, setTab] = useState(() => {
    try { return sessionStorage.getItem('rapporter_tab') || 'manedsrapport'; }
    catch(e) { return 'manedsrapport'; }
  });
  useEffect(() => {
    try { sessionStorage.setItem('rapporter_tab', tab); } catch(e) {}
  }, [tab]);

  return (
    <div style={{padding:'28px 32px', maxWidth:1100, margin:'0 auto'}}>
      <div className="no-print" style={{marginBottom:20}}>
        <h1 style={{fontSize:28, fontWeight:700, color:C.navy, letterSpacing:'-0.01em', margin:0}}>Rapporter</h1>
        <p style={{fontSize:14, color:C.gray500, marginTop:4, margin:0}}>Månedsrapport for teamet og printbare kunderapporter</p>
      </div>

      <div className="no-print" style={{display:'flex', gap:4, marginBottom:18, borderBottom:`1px solid ${C.gray200}`}}>
        {[
          {id:'manedsrapport', label:'Månedsrapport', icon:'calendar-days'},
          {id:'kunderapport',  label:'Kunderapport',  icon:'building-2'},
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

      {tab === 'manedsrapport' && <Manedsrapport state={state} navigate={navigate}/>}
      {tab === 'kunderapport'  && <Kunderapport  state={state} navigate={navigate}/>}
    </div>
  );
}

// ============================================================
// MÅNEDSRAPPORT
// ============================================================

function Manedsrapport({ state, navigate }) {
  const { kunder, team } = state;
  const teamById = useMemo(() => Object.fromEntries(team.map(t => [t.id, t])), [team]);

  // Default: gjeldende måned (basert på TODAY)
  const todayD = parseISO(TODAY);
  const [year, setYear] = useState(todayD.getFullYear());
  const [month, setMonth] = useState(todayD.getMonth()); // 0-indeksert

  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month+1, 0);
  const monthStartISO = toISO(monthStart);
  const monthEndISO = toISO(monthEnd);
  const monthLabel = `${MAANEDER_LONG[month]} ${year}`;

  // Forrige måned for sammenligning
  const prev = new Date(year, month-1, 1);
  const prevStartISO = toISO(prev);
  const prevEndISO = toISO(new Date(year, month, 0));

  const goPrev = () => {
    if (month === 0) { setYear(year-1); setMonth(11); } else { setMonth(month-1); }
  };
  const goNext = () => {
    if (month === 11) { setYear(year+1); setMonth(0); } else { setMonth(month+1); }
  };
  const isFuture = monthStart > todayD;

  // Hent alle aktiviteter (flatt med kundeId/bedrift) i en gitt periode
  const aktInPeriod = (startISO, endISO) =>
    kunder.flatMap(k => k.aktiviteter.map(a => ({...a, kundeId:k.id, bedrift:k.bedriftsnavn, ansvarligId:k.ansvarligId})))
      .filter(a => a.dato >= startISO && a.dato <= endISO);

  const akt = aktInPeriod(monthStartISO, monthEndISO);
  const aktPrev = aktInPeriod(prevStartISO, prevEndISO);

  // KPIs for måneden
  const nyeLeads     = akt.filter(a => a.type === 'lead-mottatt').length;
  const tilbudSendt  = akt.filter(a => a.type === 'tilbud_sendt');
  const tilbudAks    = akt.filter(a => a.type === 'tilbud_akseptert');
  const tilbudAvs    = akt.filter(a => a.type === 'tilbud_avslått');
  const moter        = akt.filter(a => a.type === 'møte').length;
  const telefoner    = akt.filter(a => a.type === 'telefon').length;
  const eposter      = akt.filter(a => a.type === 'epost').length;
  const veiledning   = akt.filter(a => a.type === 'veiledningsnotat').length;

  const sumBeløp = (arr) => arr.reduce((s,a) => s + (a.beløp || 0), 0);
  const vunnetVerdi = sumBeløp(tilbudAks);
  const tilbudtVerdi = sumBeløp(tilbudSendt);

  const nyeLeadsPrev = aktPrev.filter(a => a.type === 'lead-mottatt').length;
  const vunnetPrev = aktPrev.filter(a => a.type === 'tilbud_akseptert').length;
  const vunnetVerdiPrev = sumBeløp(aktPrev.filter(a => a.type === 'tilbud_akseptert'));

  // Pipeline-status snapshot (per slutten av måneden — for fortid bruker vi nåværende, demo-forenkling)
  const pipelineAktive = kunder.filter(k => !['Vunnet','Tapt'].includes(k.status));
  const pipelineVerdi = pipelineAktive.reduce((s,k) => s + (k.verdi||0), 0);

  // Topp 3 saker (alle i framdrift, sortert på verdi)
  const topp = [...pipelineAktive].sort((a,b) => (b.verdi||0) - (a.verdi||0)).slice(0,3);

  // Per ansatt for måneden
  const perAnsatt = team.map(t => {
    const mine = akt.filter(a => a.ansvarligId === t.id);
    const sendt = mine.filter(a => a.type === 'tilbud_sendt');
    const aks = mine.filter(a => a.type === 'tilbud_akseptert');
    const avs = mine.filter(a => a.type === 'tilbud_avslått');
    const aktiviteter = mine.filter(a => ['møte','telefon','epost'].includes(a.type)).length;
    const vunnetIMnd = sumBeløp(aks);
    const ytdInntekt = inntektForAnsatt(kunder, t.id);
    const hitRate = sendt.length > 0 ? (aks.length / sendt.length) * 100 : null;
    return {
      team: t,
      sendt: sendt.length, sendtVerdi: sumBeløp(sendt),
      vunnet: aks.length, vunnetVerdi: vunnetIMnd,
      tapt: avs.length, taptVerdi: sumBeløp(avs),
      aktiviteter, hitRate,
      ytdInntekt,
      budsjett: t.budsjett || 0,
    };
  });

  const totalInntektYTD = inntektTotal(kunder);
  const totalBudsjett = budsjettTotal(team);
  const ytdPct = totalBudsjett > 0 ? (totalInntektYTD / totalBudsjett) * 100 : 0;
  const proRated = proRatedTarget(totalBudsjett, TODAY);
  const proRatedPct = totalBudsjett > 0 ? (proRated / totalBudsjett) * 100 : 0;

  const print = () => {
    document.body.classList.add('printing');
    setTimeout(() => {
      window.print();
      setTimeout(() => document.body.classList.remove('printing'), 200);
    }, 50);
  };

  return (
    <div>
      {/* Kontroller — skjules ved utskrift */}
      <div className="no-print" style={{
        display:'flex', justifyContent:'space-between', alignItems:'center',
        background:'#fff', padding:'12px 18px', borderRadius:8, border:`1px solid ${C.gray200}`,
        marginBottom:18,
      }}>
        <div style={{display:'flex', alignItems:'center', gap:6}}>
          <button onClick={goPrev} style={navBtn} title="Forrige måned"><Icon name="chevron-left" size={16} color={C.navy}/></button>
          <div style={{fontSize:14, fontWeight:600, color:C.navy, minWidth:170, textAlign:'center', textTransform:'capitalize'}}>{monthLabel}</div>
          <button onClick={goNext} disabled={isFuture} style={{...navBtn, opacity: isFuture ? 0.4 : 1}} title="Neste måned"><Icon name="chevron-right" size={16} color={C.navy}/></button>
          <button
            onClick={() => { setYear(todayD.getFullYear()); setMonth(todayD.getMonth()); }}
            style={{marginLeft:10, padding:'6px 12px', border:`1px solid ${C.gray200}`, borderRadius:6, background:'#fff', cursor:'pointer', fontSize:12, fontWeight:600, color:C.gray700, fontFamily:'inherit'}}
          >Denne måneden</button>
        </div>
        <Button variant="primary" icon="printer" onClick={print}>Skriv ut / lagre som PDF</Button>
      </div>

      {/* Rapport-innhold */}
      <div className="report-area" style={{background:'#fff', borderRadius:10, border:`1px solid ${C.gray200}`, overflow:'hidden'}}>
        {/* Cover */}
        <div style={{padding:'32px 40px 28px', borderBottom:`1px solid ${C.gray100}`, background: C.navy}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-end'}}>
            <div>
              <div style={{fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.55)', textTransform:'uppercase', letterSpacing:'.12em', marginBottom:10}}>Månedsrapport</div>
              <div style={{fontSize:32, fontWeight:700, color:'#fff', letterSpacing:'-0.02em', textTransform:'capitalize', lineHeight:1.1}}>{monthLabel}</div>
              <div style={{fontSize:13, color:'rgba(255,255,255,0.6)', marginTop:8}}>Ressurs AS · Arbeidslivstjenester · generert {formatDateLong(TODAY)}</div>
            </div>
            <img src="assets/Ressurs_R_hvit.png" alt="R" style={{height:60, width:'auto', opacity:0.95}}/>
          </div>
        </div>

        {/* Topplinje — KPIs */}
        <Section title="Sammendrag" subtitle="Hovedtall for måneden">
          <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:14}}>
            <ReportKPI label="Nye leads" value={nyeLeads} delta={delta(nyeLeads, nyeLeadsPrev)} accent={C.bright}/>
            <ReportKPI label="Vunnet" value={tilbudAks.length} sub={formatKr(vunnetVerdi)} delta={delta(tilbudAks.length, vunnetPrev)} accent={C.green}/>
            <ReportKPI label="Tilbud sendt" value={tilbudSendt.length} sub={formatKr(tilbudtVerdi)} accent={C.amber}/>
            <ReportKPI label="Tapt" value={tilbudAvs.length} sub={tilbudAvs.length > 0 ? formatKr(sumBeløp(tilbudAvs)) : '–'} accent={C.red}/>
          </div>
          {vunnetVerdiPrev > 0 && (
            <div style={{marginTop:14, padding:'10px 14px', background:C.gray50, borderRadius:7, fontSize:12, color:C.gray700, display:'flex', alignItems:'center', gap:8}}>
              <Icon name="trending-up" size={14} color={vunnetVerdi >= vunnetVerdiPrev ? C.green : C.red}/>
              <span>Vunnet verdi: <strong>{formatKr(vunnetVerdi)}</strong> denne måneden vs <strong>{formatKr(vunnetVerdiPrev)}</strong> forrige.
              {vunnetVerdiPrev > 0 && ` (${vunnetVerdi >= vunnetVerdiPrev ? '+' : ''}${Math.round(((vunnetVerdi-vunnetVerdiPrev)/vunnetVerdiPrev)*100)}%)`}</span>
            </div>
          )}
        </Section>

        {/* Resultat vs budsjett */}
        <Section title="Resultat vs budsjett" subtitle="Akkumulert hittil i år" topBorder>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:14}}>
            <div>
              <div style={{fontSize:32, fontWeight:700, color:C.navy, letterSpacing:'-0.02em'}}>{formatKr(totalInntektYTD)}</div>
              <div style={{fontSize:13, color:C.gray500, marginTop:2}}>av {formatKr(totalBudsjett)} samlet årsbudsjett</div>
            </div>
            <div style={{textAlign:'right'}}>
              <div style={{fontSize:32, fontWeight:700, color:C.navy, letterSpacing:'-0.02em'}}>{Math.round(ytdPct)}%</div>
              <div style={{fontSize:12, color:C.gray500, marginTop:2}}>av årsmål · pro-ratet {Math.round(proRatedPct)}%</div>
            </div>
          </div>
          <BudsjettBar pct={ytdPct} proRatedPct={proRatedPct}/>

          {/* Per-ansatt */}
          <div style={{marginTop:22, display:'flex', flexDirection:'column', gap:14}}>
            {perAnsatt.map(p => <AnsattBudsjettRad key={p.team.id} p={p}/>)}
          </div>
        </Section>

        {/* Per-ansatt aktivitet i måneden */}
        <Section title={`Per ansatt — ${monthLabel}`} subtitle="Hva ble logget denne måneden" topBorder>
          <div style={{overflow:'hidden', borderRadius:8, border:`1px solid ${C.gray100}`}}>
            <table style={{width:'100%', borderCollapse:'collapse', fontSize:13}}>
              <thead>
                <tr style={{background:C.gray50}}>
                  <th style={th}>Ansatt</th>
                  <th style={{...th, textAlign:'right'}}>Aktiviteter</th>
                  <th style={{...th, textAlign:'right'}}>Tilbud sendt</th>
                  <th style={{...th, textAlign:'right'}}>Vunnet</th>
                  <th style={{...th, textAlign:'right'}}>Hit rate</th>
                </tr>
              </thead>
              <tbody>
                {perAnsatt.map((p, i) => (
                  <tr key={p.team.id} style={{borderTop: i>0 ? `1px solid ${C.gray100}` : 'none'}}>
                    <td style={td}>
                      <div style={{display:'flex', alignItems:'center', gap:10}}>
                        <Avatar initialer={p.team.initialer} size={26} color={teamColor(p.team.id)}/>
                        <div>
                          <div style={{fontWeight:600, color:C.navy}}>{p.team.navn}</div>
                          <div style={{fontSize:11, color:C.gray500}}>{p.team.rolle}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{...td, textAlign:'right', fontWeight:600, color:C.navy}}>{p.aktiviteter}</td>
                    <td style={{...td, textAlign:'right'}}>
                      <div style={{fontWeight:600, color:C.navy}}>{p.sendt}</div>
                      {p.sendtVerdi > 0 && <div style={{fontSize:11, color:C.gray500}}>{formatKrShort(p.sendtVerdi)}</div>}
                    </td>
                    <td style={{...td, textAlign:'right'}}>
                      <div style={{fontWeight:600, color: p.vunnet > 0 ? C.green : C.navy}}>{p.vunnet}</div>
                      {p.vunnetVerdi > 0 && <div style={{fontSize:11, color:C.gray500}}>{formatKrShort(p.vunnetVerdi)}</div>}
                    </td>
                    <td style={{...td, textAlign:'right', color:C.gray700}}>{p.hitRate != null ? `${Math.round(p.hitRate)} %` : <span style={{color:C.gray400}}>–</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        {/* Topp 3 saker i framdrift */}
        <Section title="Topp 3 saker i framdrift" subtitle={`Samlet pipeline-verdi ${formatKr(pipelineVerdi)} fordelt på ${pipelineAktive.length} saker`} topBorder>
          {topp.length === 0 ? (
            <div style={{padding:20, textAlign:'center', color:C.gray400, fontSize:13}}>Ingen aktive saker.</div>
          ) : (
            <div style={{display:'flex', flexDirection:'column', gap:10}}>
              {topp.map(k => {
                const ansv = teamById[k.ansvarligId];
                return (
                  <div key={k.id} onClick={() => navigate('kundeprofil', { id: k.id })} className="no-print-cursor" style={{
                    padding:'14px 16px', background:C.gray50, borderRadius:8,
                    display:'grid', gridTemplateColumns:'1fr auto auto auto', gap:16, alignItems:'center',
                    cursor:'pointer',
                  }}>
                    <div>
                      <div style={{fontSize:14, fontWeight:600, color:C.navy}}>{k.bedriftsnavn}</div>
                      <div style={{fontSize:12, color:C.gray500, marginTop:2}}>{k.bransje} · sist kontakt {relativeDate(k.sistKontakt)}</div>
                    </div>
                    <StatusBadge status={k.status} size="sm"/>
                    <div style={{fontSize:14, fontWeight:700, color:C.navy, minWidth:80, textAlign:'right'}}>{formatKr(k.verdi)}</div>
                    {ansv && <Avatar initialer={ansv.initialer} size={26} color={teamColor(ansv.id)}/>}
                  </div>
                );
              })}
            </div>
          )}
        </Section>

        {/* Aktivitetslogg */}
        <Section title="Aktivitetslogg" subtitle={`${akt.length} aktiviteter logget i ${MAANEDER_LONG[month]}`} topBorder>
          <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:10}}>
            <ActMini icon="users" label="Møter" count={moter} color={C.blue}/>
            <ActMini icon="phone" label="Telefoner" count={telefoner} color={C.purple}/>
            <ActMini icon="mail" label="E-poster" count={eposter} color={C.gray500}/>
            <ActMini icon="clipboard-list" label="Veiledningsnotater" count={veiledning} color={C.teal}/>
          </div>
        </Section>

        {/* Footer */}
        <div style={{padding:'18px 40px', borderTop:`1px solid ${C.gray100}`, background:C.gray50, fontSize:11, color:C.gray500, display:'flex', justifyContent:'space-between'}}>
          <span>Ressurs AS · Arbeidslivstjenester · Konfidensielt</span>
          <span>Generert {formatDateLong(TODAY)}</span>
        </div>
      </div>
    </div>
  );
}

function delta(now, prev) {
  if (prev === 0 && now === 0) return null;
  return now - prev;
}

function Section({ title, subtitle, topBorder, children }) {
  return (
    <div style={{padding:'24px 40px', borderTop: topBorder ? `1px solid ${C.gray100}` : 'none'}}>
      <div style={{marginBottom:16}}>
        <div style={{fontSize:11, fontWeight:700, color:C.gray500, textTransform:'uppercase', letterSpacing:'.12em', marginBottom:6}}>{title}</div>
        {subtitle && <div style={{fontSize:13, color:C.gray500}}>{subtitle}</div>}
      </div>
      {children}
    </div>
  );
}

function ReportKPI({ label, value, sub, delta, accent }) {
  return (
    <div style={{padding:'14px 16px', background:C.gray50, borderRadius:8, borderLeft:`3px solid ${accent}`}}>
      <div style={{fontSize:11, fontWeight:600, color:C.gray500, textTransform:'uppercase', letterSpacing:'.05em', marginBottom:8}}>{label}</div>
      <div style={{display:'flex', alignItems:'baseline', gap:8}}>
        <div style={{fontSize:24, fontWeight:700, color:C.navy, letterSpacing:'-0.02em', lineHeight:1}}>{value}</div>
        {delta != null && delta !== 0 && (
          <div style={{fontSize:11, fontWeight:600, color: delta > 0 ? C.green : C.red, display:'inline-flex', alignItems:'center', gap:2}}>
            <Icon name={delta > 0 ? 'arrow-up' : 'arrow-down'} size={10}/>
            {Math.abs(delta)}
          </div>
        )}
      </div>
      {sub && <div style={{fontSize:12, color:C.gray500, marginTop:4}}>{sub}</div>}
    </div>
  );
}

function BudsjettBar({ pct, proRatedPct, height=10, color }) {
  const w = Math.min(pct, 100);
  const c = color || (pct >= proRatedPct ? C.green : pct >= proRatedPct * 0.6 ? C.amber : C.red);
  return (
    <div style={{position:'relative', height, background:C.gray100, borderRadius:9999, overflow:'visible'}}>
      <div style={{width:`${w}%`, height:'100%', background:c, borderRadius:9999, transition:'width 400ms'}}/>
      {proRatedPct > 0 && proRatedPct < 100 && (
        <div title={`Pro-ratet mål ${Math.round(proRatedPct)}%`} style={{
          position:'absolute', left:`${proRatedPct}%`, top:-3, bottom:-3, width:2,
          background: C.navy, opacity:0.5, borderRadius:1,
        }}/>
      )}
    </div>
  );
}

function AnsattBudsjettRad({ p }) {
  const pct = p.budsjett > 0 ? (p.ytdInntekt / p.budsjett) * 100 : 0;
  const proRated = p.budsjett > 0 ? (proRatedTarget(p.budsjett, TODAY) / p.budsjett) * 100 : 0;
  const color = p.budsjett === 0 ? C.gray300
    : pct >= proRated ? C.green
    : pct >= proRated * 0.6 ? C.amber
    : C.red;
  return (
    <div style={{display:'grid', gridTemplateColumns:'200px 1fr 110px 100px', gap:14, alignItems:'center'}}>
      <div style={{display:'flex', alignItems:'center', gap:10}}>
        <Avatar initialer={p.team.initialer} size={28} color={teamColor(p.team.id)}/>
        <div>
          <div style={{fontSize:13, fontWeight:600, color:C.navy}}>{p.team.navn}</div>
          <div style={{fontSize:11, color:C.gray500}}>{p.team.rolle}</div>
        </div>
      </div>
      <BudsjettBar pct={pct} proRatedPct={proRated} color={color}/>
      <div style={{fontSize:12, color:C.gray700, textAlign:'right'}}>
        <span style={{fontWeight:700, color:C.navy}}>{formatKrShort(p.ytdInntekt)}</span>
        <span style={{color:C.gray400}}> / {formatKrShort(p.budsjett)}</span>
      </div>
      <div style={{fontSize:13, fontWeight:700, color:color, textAlign:'right'}}>
        {p.budsjett > 0 ? `${Math.round(pct)}%` : <span style={{color:C.gray400, fontWeight:500}}>Ikke satt</span>}
      </div>
    </div>
  );
}

function ActMini({ icon, label, count, color }) {
  return (
    <div style={{display:'flex', alignItems:'center', gap:12, padding:'12px 14px', background:C.gray50, borderRadius:7}}>
      <div style={{width:34, height:34, borderRadius:8, background:'#fff', display:'flex', alignItems:'center', justifyContent:'center'}}>
        <Icon name={icon} size={16} color={color}/>
      </div>
      <div>
        <div style={{fontSize:11, color:C.gray500, fontWeight:600, textTransform:'uppercase', letterSpacing:'.05em'}}>{label}</div>
        <div style={{fontSize:18, fontWeight:700, color:C.navy, lineHeight:1.1, marginTop:2}}>{count}</div>
      </div>
    </div>
  );
}

// ============================================================
// KUNDERAPPORT
// ============================================================

function Kunderapport({ state, navigate }) {
  const { kunder, team, pakker } = state;
  const teamById = useMemo(() => Object.fromEntries(team.map(t => [t.id, t])), [team]);
  const pakkeById = useMemo(() => Object.fromEntries(pakker.map(p => [p.id, p])), [pakker]);

  const [kundeId, setKundeId] = useState(() => {
    try {
      const saved = sessionStorage.getItem('kunderapport_kundeId');
      if (saved && kunder.some(k => k.id === saved)) return saved;
    } catch(e) {}
    return kunder[0]?.id;
  });
  useEffect(() => {
    try { sessionStorage.setItem('kunderapport_kundeId', kundeId); } catch(e) {}
  }, [kundeId]);

  const k = kunder.find(k => k.id === kundeId) || kunder[0];
  if (!k) {
    return <div style={{padding:30, textAlign:'center', color:C.gray500}}>Ingen kunder registrert.</div>;
  }
  const ansv = teamById[k.ansvarligId];
  const pakke = pakkeById[k.pakkeId];

  // Sorter aktiviteter eldst først for tidslinje
  const aktivitetEldstFørst = [...k.aktiviteter].sort((a,b) => a.dato.localeCompare(b.dato));

  // Førstegangs / siste kontakt
  const førsteAkt = aktivitetEldstFørst[0];
  const sisteAkt = aktivitetEldstFørst[aktivitetEldstFørst.length-1];

  // Tilbud-aktiviteter (oppsummering)
  const tilbudSendt = k.aktiviteter.filter(a => a.type === 'tilbud_sendt');
  const tilbudAks = k.aktiviteter.filter(a => a.type === 'tilbud_akseptert');

  const print = () => {
    document.body.classList.add('printing');
    setTimeout(() => {
      window.print();
      setTimeout(() => document.body.classList.remove('printing'), 200);
    }, 50);
  };

  return (
    <div>
      {/* Kontroller */}
      <div className="no-print" style={{
        display:'flex', justifyContent:'space-between', alignItems:'center', gap:14,
        background:'#fff', padding:'12px 18px', borderRadius:8, border:`1px solid ${C.gray200}`,
        marginBottom:18,
      }}>
        <div style={{display:'flex', alignItems:'center', gap:12, flex:1}}>
          <div style={{fontSize:12, fontWeight:600, color:C.gray500, textTransform:'uppercase', letterSpacing:'.05em'}}>Kunde</div>
          <select
            value={kundeId}
            onChange={e => setKundeId(e.target.value)}
            style={{
              padding:'8px 12px', border:`1px solid ${C.gray200}`, borderRadius:6,
              fontSize:14, fontFamily:'inherit', color:C.navy, background:'#fff', cursor:'pointer',
              fontWeight:600, minWidth:280,
            }}
          >
            {kunder.map(k => <option key={k.id} value={k.id}>{k.bedriftsnavn}</option>)}
          </select>
        </div>
        <Button variant="primary" icon="printer" onClick={print}>Skriv ut / lagre som PDF</Button>
      </div>

      {/* Rapport */}
      <div className="report-area" style={{background:'#fff', borderRadius:10, border:`1px solid ${C.gray200}`, overflow:'hidden'}}>
        {/* Cover */}
        <div style={{padding:'32px 40px 28px', borderBottom:`1px solid ${C.gray100}`, background: C.navy}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-end'}}>
            <div style={{flex:1, minWidth:0}}>
              <div style={{fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.55)', textTransform:'uppercase', letterSpacing:'.12em', marginBottom:10}}>Kunderapport</div>
              <div style={{fontSize:32, fontWeight:700, color:'#fff', letterSpacing:'-0.02em', lineHeight:1.1}}>{k.bedriftsnavn}</div>
              <div style={{fontSize:13, color:'rgba(255,255,255,0.6)', marginTop:8, display:'flex', gap:14, flexWrap:'wrap'}}>
                <span>Org.nr {k.orgnr || '–'}</span>
                <span>·</span>
                <span>{k.bransje}</span>
                <span>·</span>
                <span>{k.adresse}</span>
              </div>
            </div>
            <div style={{textAlign:'right', flexShrink:0, marginLeft:20}}>
              <StatusBadge status={k.status}/>
              <div style={{fontSize:26, fontWeight:700, color:'#fff', marginTop:10, letterSpacing:'-0.02em'}}>{formatKr(k.verdi)}</div>
              <div style={{fontSize:11, color:'rgba(255,255,255,0.55)', marginTop:2}}>Avtaleverdi</div>
            </div>
          </div>
        </div>

        {/* Kontakt + nøkkeltall */}
        <Section title="Kontakt og avtale">
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:24}}>
            {/* Venstre: kontakter */}
            <div>
              <div style={{fontSize:11, fontWeight:700, color:C.gray500, textTransform:'uppercase', letterSpacing:'.08em', marginBottom:8}}>Primær kontakt</div>
              <ContactBlock c={k.kontakt}/>
              {k.kontakt2?.navn && (
                <>
                  <div style={{fontSize:11, fontWeight:700, color:C.gray500, textTransform:'uppercase', letterSpacing:'.08em', marginTop:18, marginBottom:8}}>Sekundær kontakt</div>
                  <ContactBlock c={k.kontakt2}/>
                </>
              )}
            </div>
            {/* Høyre: nøkkeltall */}
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, alignContent:'start'}}>
              <Stat label="Pakke" value={pakke?.navn || '–'} sub={pakke ? formatKr(pakke.pris) : ''}/>
              <Stat label="Ansvarlig" value={ansv?.navn || '–'} sub={ansv?.rolle}/>
              <Stat label="Sist kontakt" value={formatDateShort(k.sistKontakt)} sub={relativeDate(k.sistKontakt)}/>
              <Stat label="Antall aktiviteter" value={k.aktiviteter.length} sub={`siden ${førsteAkt ? formatDateShort(førsteAkt.dato) : '–'}`}/>
            </div>
          </div>
        </Section>

        {/* Neste planlagte */}
        {k.nesteAktivitet?.dato && (
          <Section title="Neste planlagte aktivitet" topBorder>
            <NesteBlock neste={k.nesteAktivitet}/>
          </Section>
        )}

        {/* Notater */}
        {k.notater && (
          <Section title="Notater" topBorder>
            <div style={{fontSize:14, color:C.gray700, lineHeight:1.6, background:C.gray50, padding:'14px 16px', borderRadius:7, borderLeft:`3px solid ${C.bright}`}}>
              {k.notater}
            </div>
          </Section>
        )}

        {/* Aktivitetshistorikk */}
        <Section title="Aktivitetshistorikk" subtitle={`${aktivitetEldstFørst.length} ${aktivitetEldstFørst.length===1?'aktivitet':'aktiviteter'} — kronologisk, eldste først`} topBorder>
          <div style={{display:'flex', flexDirection:'column', gap:10}}>
            {aktivitetEldstFørst.map(a => <AktivitetRapportRad key={a.id} a={a}/>)}
            {aktivitetEldstFørst.length === 0 && <div style={{padding:20, textAlign:'center', color:C.gray400, fontSize:13}}>Ingen aktiviteter logget.</div>}
          </div>
        </Section>

        {/* Footer */}
        <div style={{padding:'18px 40px', borderTop:`1px solid ${C.gray100}`, background:C.gray50, fontSize:11, color:C.gray500, display:'flex', justifyContent:'space-between'}}>
          <span>Ressurs AS · Arbeidslivstjenester · Konfidensielt</span>
          <span>Generert {formatDateLong(TODAY)}</span>
        </div>
      </div>
    </div>
  );
}

function ContactBlock({ c }) {
  if (!c?.navn) return <div style={{fontSize:13, color:C.gray400, fontStyle:'italic'}}>Ingen kontakt registrert.</div>;
  return (
    <div style={{fontSize:13, color:C.gray700, lineHeight:1.6}}>
      <div style={{fontSize:15, fontWeight:700, color:C.navy, marginBottom:2}}>{c.navn}</div>
      {c.tittel && <div style={{fontSize:12, color:C.gray500, marginBottom:6}}>{c.tittel}</div>}
      {c.epost && <div style={{display:'flex', alignItems:'center', gap:8}}><Icon name="mail" size={12} color={C.gray400}/>{c.epost}</div>}
      {c.telefon && <div style={{display:'flex', alignItems:'center', gap:8}}><Icon name="phone" size={12} color={C.gray400}/>{c.telefon}</div>}
    </div>
  );
}

function Stat({ label, value, sub }) {
  return (
    <div style={{padding:'12px 14px', background:C.gray50, borderRadius:7}}>
      <div style={{fontSize:10, fontWeight:700, color:C.gray500, textTransform:'uppercase', letterSpacing:'.08em', marginBottom:4}}>{label}</div>
      <div style={{fontSize:14, fontWeight:700, color:C.navy, lineHeight:1.3}}>{value}</div>
      {sub && <div style={{fontSize:11, color:C.gray500, marginTop:2}}>{sub}</div>}
    </div>
  );
}

function NesteBlock({ neste }) {
  const diff = daysBetween(TODAY, neste.dato);
  const color = diff < 0 ? C.red : diff <= 3 ? C.amber : C.green;
  const bg    = diff < 0 ? '#fbe6e6' : diff <= 3 ? '#fef4e3' : '#e8f7e6';
  const label = diff < 0 ? `Forfalt for ${Math.abs(diff)} dager siden` : diff===0?'Forfaller i dag': diff===1?'I morgen': `om ${diff} dager`;
  const meta = AKTIVITETSTYPER[neste.type] || AKTIVITETSTYPER.oppfølging;
  return (
    <div style={{display:'flex', alignItems:'center', gap:14, padding:'14px 16px', background:bg, borderRadius:7, borderLeft:`3px solid ${color}`}}>
      <div style={{width:38, height:38, borderRadius:8, background:'#fff', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0}}>
        <Icon name={meta.icon} size={16} color={meta.color}/>
      </div>
      <div style={{flex:1}}>
        <div style={{fontSize:14, fontWeight:600, color:C.navy}}>{meta.label}: {neste.beskrivelse}</div>
        <div style={{fontSize:12, color:C.gray500, marginTop:2}}>{formatDateLong(neste.dato)}</div>
      </div>
      <div style={{fontSize:12, fontWeight:700, color, background:'#fff', padding:'6px 12px', borderRadius:9999, whiteSpace:'nowrap'}}>{label}</div>
    </div>
  );
}

function AktivitetRapportRad({ a }) {
  const meta = AKTIVITETSTYPER[a.type] || AKTIVITETSTYPER.epost;
  return (
    <div style={{
      display:'grid', gridTemplateColumns:'90px 38px 1fr auto', gap:14, alignItems:'flex-start',
      padding:'12px 14px', background: meta.note ? meta.bg : C.gray50, borderRadius:7,
      borderLeft: meta.highlight ? `3px solid ${meta.color}` : `3px solid transparent`,
    }}>
      <div style={{fontSize:12, color:C.gray500, paddingTop:9, fontWeight:500}}>{formatDateShort(a.dato)}</div>
      <div style={{width:34, height:34, borderRadius:8, background:'#fff', display:'flex', alignItems:'center', justifyContent:'center', marginTop:1}}>
        <Icon name={meta.icon} size={15} color={meta.color}/>
      </div>
      <div style={{minWidth:0}}>
        <div style={{display:'flex', alignItems:'center', gap:8, flexWrap:'wrap'}}>
          <div style={{fontSize:11, fontWeight:700, color:meta.color, textTransform:'uppercase', letterSpacing:'.05em'}}>{meta.label}</div>
          {a.loggetAv && <div style={{fontSize:11, color:C.gray400}}>· {a.loggetAv}</div>}
        </div>
        <div style={{fontSize:14, fontWeight:600, color:C.navy, marginTop:3}}>{a.tittel}</div>
        {a.notat && <div style={{fontSize:13, color:C.gray700, marginTop:4, lineHeight:1.5}}>{a.notat}</div>}
      </div>
      {a.beløp != null && (
        <div style={{
          fontSize:12, fontWeight:700, color: meta.color, background:'#fff',
          padding:'4px 10px', borderRadius:9999, whiteSpace:'nowrap', marginTop:6,
          border:`1px solid ${meta.color}30`,
        }}>{formatKr(a.beløp)}</div>
      )}
    </div>
  );
}

const navBtn = {
  width:32, height:32, borderRadius:6, border:`1px solid ${C.gray200}`,
  background:'#fff', cursor:'pointer', display:'inline-flex', alignItems:'center', justifyContent:'center', padding:0,
};

const th = {
  padding:'10px 14px', textAlign:'left', fontSize:11, fontWeight:700,
  color: C.gray500, textTransform:'uppercase', letterSpacing:'.06em',
};
const td = {
  padding:'12px 14px', fontSize:13, color: C.navy, verticalAlign:'middle',
};

window.Rapporter = Rapporter;
