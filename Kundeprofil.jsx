// ============================================================
// KUNDEPROFIL — Customer profile (info + timeline + neste aktivitet)
// ============================================================

function Kundeprofil({ state, setState, navigate, kundeId }) {
  const { kunder, team, pakker } = state;
  const teamById  = useMemo(() => Object.fromEntries(team.map(t  => [t.id, t])),  [team]);
  const pakkeById = useMemo(() => Object.fromEntries(pakker.map(p => [p.id, p])), [pakker]);
  const kunde = kunder.find(k => k.id === kundeId);

  const [editOpen, setEditOpen] = useState(false);
  const [tilbudOpen, setTilbudOpen] = useState(false);

  if (!kunde) {
    return (
      <div style={{padding:40, textAlign:'center'}}>
        <div style={{fontSize:16, color:C.gray500, marginBottom:16}}>Fant ikke kunden.</div>
        <Button variant="primary" onClick={() => navigate('kunder')}>Tilbake til kunder</Button>
      </div>
    );
  }

  const updateKunde = (patch) => {
    setState(s => ({
      ...s,
      kunder: s.kunder.map(k => k.id === kunde.id ? { ...k, ...patch } : k),
    }));
  };

  const addActivity = (a) => {
    const id = Math.random().toString(36).slice(2, 10);
    const ny = { id, ...a };
    setState(s => ({
      ...s,
      kunder: s.kunder.map(k => k.id !== kunde.id ? k : ({
        ...k,
        aktiviteter: [...k.aktiviteter, ny],
        sistKontakt: a.dato > (k.sistKontakt||'') ? a.dato : k.sistKontakt,
        // Auto-update pipeline status for accepted/declined offers
        status: a.type === 'tilbud_akseptert' ? 'Vunnet'
              : a.type === 'tilbud_avslått'   ? 'Tapt'
              : a.type === 'tilbud_sendt'     ? (k.status === 'Lead' || k.status === 'Kontaktet' || k.status === 'Behovskartlagt' ? 'Tilbud sendt' : k.status)
              : k.status,
      })),
    }));
  };

  const ansv = teamById[kunde.ansvarligId];
  const pkg = pakkeById[kunde.pakkeId];

  // Activities sorted desc
  const activities = [...kunde.aktiviteter].sort((a,b) => b.dato.localeCompare(a.dato));

  return (
    <div style={{padding:'28px 32px', maxWidth:1200, margin:'0 auto'}}>
      {/* Back */}
      <button onClick={() => navigate('kunder')} style={{
        background:'none', border:'none', cursor:'pointer', color:C.gray500,
        fontSize:13, fontFamily:'inherit', display:'inline-flex', alignItems:'center', gap:6,
        padding:0, marginBottom:16,
      }}>
        <Icon name="arrow-left" size={14}/> Tilbake til kunder
      </button>

      {/* ── Toppseksjon: bedrifts- og kontaktinfo ── */}
      <Card padding={0} style={{marginBottom:20}}>
        <div style={{padding:'22px 24px', borderBottom:`1px solid ${C.gray100}`, display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:20, flexWrap:'wrap'}}>
          <div style={{flex:1, minWidth:300}}>
            <div style={{display:'flex', alignItems:'center', gap:12, marginBottom:6}}>
              <h1 style={{fontSize:24, fontWeight:700, color:C.navy, letterSpacing:'-0.01em', margin:0}}>{kunde.bedriftsnavn}</h1>
              <StatusBadge status={kunde.status}/>
            </div>
            <div style={{fontSize:13, color:C.gray500}}>{kunde.bransje} · Org.nr {kunde.orgnr}</div>
            <div style={{fontSize:13, color:C.gray500, marginTop:2}}>{kunde.adresse}</div>
          </div>
          <div style={{display:'flex', gap:10}}>
            <Button variant="secondary" icon="file-plus" onClick={() => setTilbudOpen(true)}>Lag tilbud</Button>
            <Button variant="secondary" icon="edit-3" onClick={() => setEditOpen(true)}>Rediger</Button>
          </div>
        </div>

        <div style={{padding:'20px 24px', display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:24, borderBottom:`1px solid ${C.gray100}`}}>
          <Stat label="Pakke" value={pkg?.navn || '–'} sub={pkg ? formatKr(pkg.pris) + ' / år' : ''}/>
          <Stat label="Verdi" value={formatKr(kunde.verdi)}/>
          <Stat label="Sist kontakt" value={formatDateShort(kunde.sistKontakt)} sub={relativeDate(kunde.sistKontakt)}/>
          <Stat label="Ansvarlig selger" value={ansv?.navn || '–'} sub={ansv?.rolle}/>
        </div>

        <div style={{padding:'20px 24px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:24}}>
          <ContactCard title="Primær kontaktperson" k={kunde.kontakt}/>
          {kunde.kontakt2?.navn ? (
            <ContactCard title="Sekundær kontaktperson" k={kunde.kontakt2}/>
          ) : (
            <div style={{padding:'14px 16px', border:`1px dashed ${C.gray200}`, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:4, color:C.gray400}}>
              <Icon name="user-plus" size={18} color={C.gray400}/>
              <div style={{fontSize:12}}>Ingen sekundær kontakt</div>
              <button onClick={()=>setEditOpen(true)} style={{background:'none', border:'none', color:C.blue, fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:'inherit'}}>Legg til</button>
            </div>
          )}
        </div>

        {kunde.notater && (
          <div style={{padding:'16px 24px', borderTop:`1px solid ${C.gray100}`, background: C.gray50}}>
            <div style={{fontSize:11, fontWeight:600, color:C.gray500, textTransform:'uppercase', letterSpacing:'.05em', marginBottom:6}}>Interne notater</div>
            <div style={{fontSize:13, color:C.navy, lineHeight:1.55, whiteSpace:'pre-wrap'}}>{kunde.notater}</div>
          </div>
        )}
      </Card>

      {/* ── Tilbudshistorikk ── */}
      <TilbudHistorikk state={state} kunde={kunde} navigate={navigate}/>

      {/* ── Aktivitetstidslinje + skjema ── */}
      <div style={{display:'grid', gridTemplateColumns:'1fr 360px', gap:20, alignItems:'start'}}>
        <Card padding={0}>
          <div style={{padding:'18px 22px', borderBottom:`1px solid ${C.gray100}`, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <div style={{fontSize:15, fontWeight:700, color:C.navy}}>Aktivitetstidslinje</div>
            <div style={{fontSize:12, color:C.gray500}}>{activities.length} aktiviteter</div>
          </div>
          <Timeline activities={activities}/>
        </Card>

        <div style={{display:'flex', flexDirection:'column', gap:20}}>
          {/* Next planned activity */}
          <NestePlanlagt kunde={kunde} updateKunde={updateKunde} addActivity={addActivity}/>
          {/* New activity form */}
          <NyAktivitetSkjema team={team} kunde={kunde} onAdd={addActivity}/>
        </div>
      </div>

      {editOpen && (
        <RedigerKundeModal state={state} kunde={kunde} onClose={()=>setEditOpen(false)}
          onSave={patch => { updateKunde(patch); setEditOpen(false); }}/>
      )}

      {tilbudOpen && (
        <TilbudBuilder
          state={state}
          setState={setState}
          kunde={kunde}
          onClose={()=>setTilbudOpen(false)}
          onSaved={(tilbudId)=>{ setTilbudOpen(false); navigate('tilbudview', { tilbudId }); }}
        />
      )}
    </div>
  );
}

function Stat({ label, value, sub }) {
  return (
    <div>
      <div style={{fontSize:11, fontWeight:600, color:C.gray500, textTransform:'uppercase', letterSpacing:'.05em', marginBottom:5}}>{label}</div>
      <div style={{fontSize:15, fontWeight:600, color:C.navy}}>{value}</div>
      {sub && <div style={{fontSize:12, color:C.gray500, marginTop:2}}>{sub}</div>}
    </div>
  );
}

function ContactCard({ title, k }) {
  return (
    <div style={{padding:'14px 16px', background:C.gray50, borderRadius:8}}>
      <div style={{fontSize:11, fontWeight:600, color:C.gray500, textTransform:'uppercase', letterSpacing:'.05em', marginBottom:8}}>{title}</div>
      <div style={{fontSize:15, fontWeight:600, color:C.navy}}>{k?.navn || '–'}</div>
      {k?.tittel && <div style={{fontSize:12, color:C.gray500, marginTop:2}}>{k.tittel}</div>}
      <div style={{display:'flex', gap:18, marginTop:10, fontSize:12, color:C.gray700, flexWrap:'wrap'}}>
        {k?.epost && (
          <span style={{display:'inline-flex', alignItems:'center', gap:6}}>
            <Icon name="mail" size={12} color={C.gray400}/> {k.epost}
          </span>
        )}
        {k?.telefon && (
          <span style={{display:'inline-flex', alignItems:'center', gap:6}}>
            <Icon name="phone" size={12} color={C.gray400}/> {k.telefon}
          </span>
        )}
      </div>
    </div>
  );
}

function Timeline({ activities }) {
  if (activities.length === 0) return (
    <div style={{padding:40, textAlign:'center', color:C.gray400, fontSize:13}}>Ingen aktiviteter logget ennå.</div>
  );
  return (
    <div style={{position:'relative', padding:'18px 22px 8px'}}>
      {/* vertical line */}
      <div style={{position:'absolute', left: 22 + 18, top: 30, bottom: 30, width:2, background:C.gray100}}/>
      <div style={{display:'flex', flexDirection:'column', gap:18}}>
        {activities.map(a => <TimelineItem key={a.id} a={a}/>)}
      </div>
    </div>
  );
}

function TimelineItem({ a }) {
  const meta = AKTIVITETSTYPER[a.type] || AKTIVITETSTYPER.epost;
  return (
    <div style={{display:'flex', gap:14, position:'relative'}}>
      <div style={{
        width:36, height:36, borderRadius:'50%', background: meta.bg,
        border:`2px solid #fff`, boxShadow:`0 0 0 1.5px ${meta.color}33`,
        display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, zIndex:1,
      }}>
        <Icon name={meta.icon} size={16} color={meta.color}/>
      </div>
      <div style={{
        flex:1,
        background: meta.note ? meta.bg : (meta.highlight ? meta.bg : '#fff'),
        border: meta.highlight ? `1.5px solid ${meta.color}` : meta.note ? `1px solid ${meta.color}33` : `1px solid ${C.gray100}`,
        borderRadius:8,
        padding:'12px 14px',
      }}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:10, marginBottom:4}}>
          <div style={{display:'flex', alignItems:'center', gap:8, flexWrap:'wrap'}}>
            <span style={{fontSize:11, fontWeight:700, color: meta.color, textTransform:'uppercase', letterSpacing:'.05em'}}>{meta.label}</span>
            {a.beløp != null && (
              <span style={{
                fontSize:11, fontWeight:700, color:'#fff', background: meta.color,
                padding:'2px 8px', borderRadius:9999,
              }}>{formatKr(a.beløp)}</span>
            )}
          </div>
          <span style={{fontSize:12, color:C.gray500, whiteSpace:'nowrap'}}>{formatDateShort(a.dato)}</span>
        </div>
        <div style={{fontSize:14, fontWeight:600, color:C.navy, marginBottom: a.notat?4:0}}>{a.tittel}</div>
        {a.notat && <div style={{fontSize:13, color:C.gray700, lineHeight:1.5}}>{a.notat}</div>}
        {a.loggetAv && (
          <div style={{fontSize:11, color:C.gray400, marginTop:8, display:'flex', alignItems:'center', gap:5}}>
            <Icon name="user" size={10}/> Logget av {a.loggetAv}
          </div>
        )}
      </div>
    </div>
  );
}

function NestePlanlagt({ kunde, updateKunde, addActivity }) {
  const ns = kunde.nesteAktivitet;
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(ns || { dato: TODAY, type: 'telefon', beskrivelse: '' });

  if (!ns && !editing) {
    return (
      <Card>
        <div style={{fontSize:11, fontWeight:700, color:C.gray500, textTransform:'uppercase', letterSpacing:'.05em', marginBottom:8}}>Neste planlagte aktivitet</div>
        <div style={{fontSize:13, color:C.gray400, marginBottom:12}}>Ingen planlagt aktivitet.</div>
        <Button variant="secondary" size="sm" icon="plus" onClick={()=>setEditing(true)}>Planlegg aktivitet</Button>
      </Card>
    );
  }

  if (editing) {
    return (
      <Card>
        <div style={{fontSize:11, fontWeight:700, color:C.gray500, textTransform:'uppercase', letterSpacing:'.05em', marginBottom:12}}>{ns ? 'Endre planlagt aktivitet' : 'Planlegg aktivitet'}</div>
        <div style={{display:'flex', flexDirection:'column', gap:10}}>
          <Input label="Dato" type="date" value={form.dato} onChange={e=>setForm({...form, dato:e.target.value})}/>
          <Select label="Type" value={form.type} onChange={e=>setForm({...form, type:e.target.value})}
            options={Object.entries(AKTIVITETSTYPER).filter(([k])=>k!=='lead-mottatt').map(([k,v])=>({value:k, label:v.label}))}/>
          <Textarea label="Beskrivelse" value={form.beskrivelse} onChange={e=>setForm({...form, beskrivelse:e.target.value})} rows={3}/>
          <div style={{display:'flex', gap:8, justifyContent:'flex-end'}}>
            <Button variant="secondary" size="sm" onClick={()=>{setEditing(false); setForm(ns||{dato:TODAY,type:'telefon',beskrivelse:''});}}>Avbryt</Button>
            <Button variant="primary" size="sm" onClick={()=>{updateKunde({nesteAktivitet:form}); setEditing(false);}}>Lagre</Button>
          </div>
        </div>
      </Card>
    );
  }

  const diff = daysBetween(TODAY, ns.dato);
  const accent = diff < 0 ? C.red : diff <= 3 ? C.amber : C.green;
  const accentBg = diff < 0 ? '#fbe6e6' : diff <= 3 ? '#fef4e3' : '#e8f7e6';
  const label = diff < 0 ? `Forfalt for ${Math.abs(diff)} dager siden` : diff === 0 ? 'Forfaller i dag' : diff === 1 ? 'I morgen' : `om ${diff} dager`;
  const meta = AKTIVITETSTYPER[ns.type] || AKTIVITETSTYPER.oppfølging;

  const markFullført = () => {
    addActivity({
      type: ns.type,
      dato: TODAY,
      tittel: ns.beskrivelse || meta.label,
      notat: 'Markert som fullført fra planlagt aktivitet.',
      loggetAv: 'Du',
    });
    updateKunde({ nesteAktivitet: null });
  };

  return (
    <Card padding={0} style={{overflow:'hidden'}}>
      <div style={{padding:'14px 18px', background: accentBg, borderBottom:`1px solid ${accent}33`, display:'flex', alignItems:'center', gap:10}}>
        <Icon name={meta.icon} size={16} color={accent}/>
        <div style={{flex:1}}>
          <div style={{fontSize:11, fontWeight:700, color: accent, textTransform:'uppercase', letterSpacing:'.05em'}}>Neste planlagte aktivitet</div>
          <div style={{fontSize:13, fontWeight:600, color: accent, marginTop:2}}>{label}</div>
        </div>
      </div>
      <div style={{padding:'16px 18px'}}>
        <div style={{fontSize:12, color:C.gray500, marginBottom:6}}>{meta.label} · {formatDateLong(ns.dato)}</div>
        <div style={{fontSize:14, color:C.navy, lineHeight:1.5, marginBottom:14}}>{ns.beskrivelse}</div>
        <div style={{display:'flex', gap:8}}>
          <Button variant="success" size="sm" icon="check" onClick={markFullført} style={{flex:1, justifyContent:'center'}}>Marker fullført</Button>
          <Button variant="secondary" size="sm" icon="edit-3" onClick={()=>setEditing(true)}>Endre</Button>
        </div>
      </div>
    </Card>
  );
}

function NyAktivitetSkjema({ team, kunde, onAdd }) {
  const [form, setForm] = useState({
    type: 'møte', dato: TODAY, tittel: '', notat: '', beløp:'',
    loggetAv: team[0]?.navn || 'Du',
  });
  const meta = AKTIVITETSTYPER[form.type];
  const showBelop = ['tilbud_sendt','tilbud_akseptert','tilbud_avslått'].includes(form.type);

  const submit = (e) => {
    e.preventDefault();
    if (!form.tittel.trim()) return;
    const payload = {
      type: form.type, dato: form.dato, tittel: form.tittel.trim(),
      notat: form.notat.trim(), loggetAv: form.loggetAv,
    };
    if (showBelop && form.beløp !== '') payload.beløp = Number(form.beløp);
    onAdd(payload);
    setForm(f => ({ ...f, tittel:'', notat:'', beløp:'' }));
  };

  return (
    <Card padding={0}>
      <div style={{padding:'14px 18px', borderBottom:`1px solid ${C.gray100}`}}>
        <div style={{fontSize:15, fontWeight:700, color:C.navy}}>Logg ny aktivitet</div>
      </div>
      <form onSubmit={submit} style={{padding:'16px 18px', display:'flex', flexDirection:'column', gap:10}}>
        <div style={{display:'grid', gridTemplateColumns:'1fr 110px', gap:10}}>
          <Select label="Type" value={form.type} onChange={e=>setForm({...form, type:e.target.value})}
            options={Object.entries(AKTIVITETSTYPER).filter(([k])=>k!=='lead-mottatt').map(([k,v])=>({value:k, label:v.label}))}/>
          <Input label="Dato" type="date" value={form.dato} onChange={e=>setForm({...form, dato:e.target.value})}/>
        </div>
        <Input label="Tittel" value={form.tittel} onChange={e=>setForm({...form, tittel:e.target.value})} placeholder="Kort tittel"/>
        <Textarea label="Notat" value={form.notat} onChange={e=>setForm({...form, notat:e.target.value})} rows={3} placeholder="Hva skjedde? Hva er neste steg?"/>
        {showBelop && (
          <Input label="Beløp (kr)" type="number" value={form.beløp} onChange={e=>setForm({...form, beløp:e.target.value})} placeholder="0"/>
        )}
        <Select label="Logget av" value={form.loggetAv} onChange={e=>setForm({...form, loggetAv:e.target.value})}
          options={team.map(t=>t.navn)}/>
        <Button variant="primary" type="submit" icon="plus-circle" style={{justifyContent:'center', marginTop:4}}>Legg til aktivitet</Button>
      </form>
    </Card>
  );
}

function RedigerKundeModal({ state, kunde, onClose, onSave }) {
  const { team, pakker } = state;
  const [form, setForm] = useState(JSON.parse(JSON.stringify(kunde)));
  const [errs, setErrs] = useState({});

  const upd = (path, v) => {
    setForm(f => {
      const next = {...f};
      if (path.includes('.')) {
        const [a,b] = path.split('.');
        next[a] = {...(next[a]||{}), [b]: v};
      } else next[path] = v;
      return next;
    });
  };

  const submit = (e) => {
    e?.preventDefault();
    const errors = validateKunde(form);
    if (Object.keys(errors).length) { setErrs(errors); return; }
    const { aktiviteter, nesteAktivitet, ...rest } = form;
    onSave(rest);
  };

  return (
    <Modal open={true} onClose={onClose} title="Rediger kunde" width={680}>
      <form onSubmit={submit} style={{display:'flex', flexDirection:'column', gap:14}}>
        <Input label="Bedriftsnavn *" value={form.bedriftsnavn} onChange={e=>upd('bedriftsnavn', e.target.value)} error={errs.bedriftsnavn}/>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
          <Input label="Organisasjonsnummer" value={form.orgnr||''} onChange={e=>upd('orgnr', e.target.value)}/>
          <Input label="Bransje" value={form.bransje||''} onChange={e=>upd('bransje', e.target.value)}/>
        </div>
        <Input label="Adresse" value={form.adresse||''} onChange={e=>upd('adresse', e.target.value)}/>

        <div style={{fontSize:11, fontWeight:700, color:C.gray500, textTransform:'uppercase', letterSpacing:'.05em', marginTop:6}}>Primær kontaktperson</div>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
          <Input label="Navn *" value={form.kontakt?.navn||''} onChange={e=>upd('kontakt.navn', e.target.value)} error={errs.kontaktNavn}/>
          <Input label="Tittel" value={form.kontakt?.tittel||''} onChange={e=>upd('kontakt.tittel', e.target.value)}/>
          <Input label="E-post" type="email" value={form.kontakt?.epost||''} onChange={e=>upd('kontakt.epost', e.target.value)} error={errs.kontaktEpost}/>
          <Input label="Telefon" value={form.kontakt?.telefon||''} onChange={e=>upd('kontakt.telefon', e.target.value)}/>
        </div>

        <div style={{fontSize:11, fontWeight:700, color:C.gray500, textTransform:'uppercase', letterSpacing:'.05em', marginTop:6}}>Sekundær kontaktperson (valgfritt)</div>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
          <Input label="Navn" value={form.kontakt2?.navn||''} onChange={e=>upd('kontakt2.navn', e.target.value)}/>
          <Input label="Tittel" value={form.kontakt2?.tittel||''} onChange={e=>upd('kontakt2.tittel', e.target.value)}/>
          <Input label="E-post" type="email" value={form.kontakt2?.epost||''} onChange={e=>upd('kontakt2.epost', e.target.value)} error={errs.kontakt2Epost}/>
          <Input label="Telefon" value={form.kontakt2?.telefon||''} onChange={e=>upd('kontakt2.telefon', e.target.value)}/>
        </div>

        <div style={{fontSize:11, fontWeight:700, color:C.gray500, textTransform:'uppercase', letterSpacing:'.05em', marginTop:6}}>Salgsinformasjon</div>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
          <Select label="Pakke" value={form.pakkeId} onChange={e=>upd('pakkeId', e.target.value)}
            options={pakker.map(p=>({value:p.id, label:p.navn}))}/>
          <Input label="Verdi (kr)" type="number" value={form.verdi||0} onChange={e=>upd('verdi', Number(e.target.value))}/>
          <Select label="Framdriftsstatus" value={form.status} onChange={e=>upd('status', e.target.value)} options={STATUS_LISTE}/>
          <Select label="Ansvarlig selger" value={form.ansvarligId} onChange={e=>upd('ansvarligId', e.target.value)}
            options={team.map(t=>({value:t.id, label:t.navn}))}/>
        </div>

        <Textarea label="Interne notater" value={form.notater||''} onChange={e=>upd('notater', e.target.value)}/>

        <div style={{display:'flex', justifyContent:'flex-end', gap:10, marginTop:10}}>
          <Button variant="secondary" type="button" onClick={onClose}>Avbryt</Button>
          <Button variant="primary" type="submit">Lagre endringer</Button>
        </div>
      </form>
    </Modal>
  );
}

window.Kundeprofil = Kundeprofil;
