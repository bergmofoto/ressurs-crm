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
  const [editingAct, setEditingAct] = useState(null);  // aktivitet under redigering
  const [statusOpen, setStatusOpen] = useState(false);  // status-nedtrekk åpen?
  const [selProsessId, setSelProsessId] = useState(null);   // valgt prosess
  const [prosessModal, setProsessModal] = useState(null);   // {mode:'new'} | {mode:'edit', prosess}

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

  // ── Prosesser (flere pakker/salg per kunde) ──
  const prosesser = kundeProsesser(kunde);
  const selectedProsess = prosesser.find(p => p.id === selProsessId) || prosesser[0] || null;
  const commitProsesser = (liste) => updateKunde(kundeAvledet(liste));
  const saveNyProsess = (p) => {
    const np = { ...p, id: 'pr' + Date.now() };
    commitProsesser([...prosesser, np]);
    setSelProsessId(np.id);
    setProsessModal(null);
  };
  const saveEditProsess = (p) => {
    commitProsesser(prosesser.map(x => x.id === p.id ? p : x));
    setProsessModal(null);
  };
  const slettProsess = (id) => {
    if (!window.confirm('Slette denne prosessen? Aktiviteter i tidslinjen blir stående på kunden.')) return;
    const liste = prosesser.filter(p => p.id !== id);
    commitProsesser(liste);
    if ((selProsessId || selectedProsess?.id) === id) setSelProsessId(liste[0]?.id || null);
  };
  const setProsessStatus = (status) => {
    if (!selectedProsess) return;
    commitProsesser(prosesser.map(p => p.id === selectedProsess.id ? { ...p, status } : p));
    setStatusOpen(false);
  };

  const addActivity = (a) => {
    const id = Math.random().toString(36).slice(2, 10);
    const pid = a.prosessId || selectedProsess?.id || null;
    const ny = { id, ...a };
    setState(s => ({
      ...s,
      kunder: s.kunder.map(k => {
        if (k.id !== kunde.id) return k;
        // Auto-oppdater riktig prosess sin status ved tilbudshendelser
        const liste = kundeProsesser(k).map(p => {
          if (p.id !== pid) return p;
          const ns = a.type === 'tilbud_akseptert' ? 'Vunnet'
                   : a.type === 'tilbud_avslått'   ? 'Tapt'
                   : a.type === 'tilbud_sendt'     ? (['Lead','Kontaktet','Behovskartlagt'].includes(p.status) ? 'Tilbud sendt' : p.status)
                   : p.status;
          return ns === p.status ? p : { ...p, status: ns };
        });
        return {
          ...k,
          aktiviteter: [...k.aktiviteter, ny],
          sistKontakt: a.dato > (k.sistKontakt||'') ? a.dato : k.sistKontakt,
          ...kundeAvledet(liste),
        };
      }),
    }));
  };

  // Slett en aktivitet fra tidslinjen
  const deleteActivity = (id) => {
    if (!window.confirm('Slette denne aktiviteten? Handlingen kan ikke angres.')) return;
    setState(s => ({
      ...s,
      kunder: s.kunder.map(k => k.id !== kunde.id ? k : ({
        ...k,
        aktiviteter: k.aktiviteter.filter(a => a.id !== id),
      })),
    }));
  };

  // Oppdater en aktivitet
  const updateActivity = (id, patch) => {
    setState(s => ({
      ...s,
      kunder: s.kunder.map(k => k.id !== kunde.id ? k : ({
        ...k,
        aktiviteter: k.aktiviteter.map(a => a.id === id ? { ...a, ...patch } : a),
      })),
    }));
    setEditingAct(null);
  };

  // Endre framdriftsstatus direkte fra profilen

  const ansv = teamById[kunde.ansvarligId];
  const pkg = selectedProsess ? pakkeById[selectedProsess.pakkeId] : null;

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
            </div>
            <div style={{fontSize:13, color:C.gray500}}>{kunde.bransje} · Org.nr {kunde.orgnr}</div>
            <div style={{fontSize:13, color:C.gray500, marginTop:2}}>{kunde.adresse}</div>
          </div>
          <div style={{display:'flex', gap:10}}>
            <Button variant="secondary" icon="file-plus" onClick={() => setTilbudOpen(true)}>Lag tilbud</Button>
            <Button variant="secondary" icon="pencil" onClick={() => setEditOpen(true)}>Rediger</Button>
          </div>
        </div>

        {/* ── Prosess-bånd: bytt mellom kundens pakker/salg ── */}
        <ProsessBand
          prosesser={prosesser} pakkeById={pakkeById} selectedId={selectedProsess?.id}
          totalVerdi={kunde.verdi}
          onSelect={setSelProsessId}
          onNy={() => setProsessModal({ mode:'new' })}
        />

        {/* ── Valgt prosess: pakke, verdi, status ── */}
        <div style={{padding:'18px 24px', borderBottom:`1px solid ${C.gray100}`}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: selectedProsess ? 14 : 0}}>
            <div style={{fontSize:11, fontWeight:700, color:C.gray500, textTransform:'uppercase', letterSpacing:'.05em'}}>
              Valgt prosess{selectedProsess ? ` · sist kontakt ${formatDateShort(kunde.sistKontakt)}` : ''}
            </div>
            {selectedProsess && (
              <div style={{display:'flex', gap:6}}>
                <button onClick={()=>setProsessModal({ mode:'edit', prosess:selectedProsess })} title="Rediger prosess" style={profilIconBtn}><Icon name="pencil" size={14} color={C.gray500}/></button>
                <button onClick={()=>slettProsess(selectedProsess.id)} title="Slett prosess" style={profilIconBtn}><Icon name="trash-2" size={14} color={C.gray500}/></button>
              </div>
            )}
          </div>
          {selectedProsess ? (
            <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:24, alignItems:'start'}}>
              <Stat label="Pakke" value={pkg?.navn || prosessNavn(selectedProsess, pakkeById)} sub={pkg ? formatKr(pkg.pris) + ' / år' : ''}/>
              <div>
                <div style={statLabelStyle}>Status</div>
                <StatusVelger status={selectedProsess.status} open={statusOpen} setOpen={setStatusOpen} onPick={setProsessStatus}/>
              </div>
              <Stat label="Verdi (denne prosessen)" value={formatKr(selectedProsess.verdi)}/>
              <Stat label="Ansvarlig selger" value={ansv?.navn || '–'} sub={ansv?.rolle}/>
            </div>
          ) : (
            <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', gap:16, paddingTop:4}}>
              <div style={{fontSize:13, color:C.gray500}}>Ingen prosess registrert på denne kunden ennå.</div>
              <Button variant="secondary" size="sm" icon="plus" onClick={()=>setProsessModal({ mode:'new' })}>Legg til prosess</Button>
            </div>
          )}
          {selectedProsess?.notat && (
            <div style={{marginTop:14, fontSize:13, color:C.gray700, lineHeight:1.5, background:C.gray50, borderRadius:7, padding:'10px 12px', whiteSpace:'pre-wrap'}}>{selectedProsess.notat}</div>
          )}
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
          <Timeline activities={activities} onEdit={setEditingAct} onDelete={deleteActivity}/>
        </Card>

        <div style={{display:'flex', flexDirection:'column', gap:20}}>
          {/* Next planned activity */}
          <NestePlanlagt kunde={kunde} updateKunde={updateKunde} addActivity={addActivity}/>
          {/* New activity form */}
          <NyAktivitetSkjema team={team} kunde={kunde} onAdd={addActivity}
            prosesser={prosesser} selectedProsessId={selectedProsess?.id} pakkeById={pakkeById}/>
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
          prosess={selectedProsess}
          onClose={()=>setTilbudOpen(false)}
          onSaved={(tilbudId)=>{ setTilbudOpen(false); navigate('tilbudview', { tilbudId }); }}
        />
      )}

      {prosessModal && (
        <ProsessModal state={state} modal={prosessModal} onClose={()=>setProsessModal(null)}
          onSave={prosessModal.mode==='new' ? saveNyProsess : saveEditProsess}/>
      )}

      {editingAct && (
        <RedigerAktivitetModal
          team={team}
          aktivitet={editingAct}
          onClose={()=>setEditingAct(null)}
          onSave={patch => updateActivity(editingAct.id, patch)}
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

function Timeline({ activities, onEdit, onDelete }) {
  if (activities.length === 0) return (
    <div style={{padding:40, textAlign:'center', color:C.gray400, fontSize:13}}>Ingen aktiviteter logget ennå.</div>
  );
  return (
    <div style={{position:'relative', padding:'18px 22px 8px'}}>
      {/* vertical line */}
      <div style={{position:'absolute', left: 22 + 18, top: 30, bottom: 30, width:2, background:C.gray100}}/>
      <div style={{display:'flex', flexDirection:'column', gap:18}}>
        {activities.map(a => <TimelineItem key={a.id} a={a} onEdit={onEdit} onDelete={onDelete}/>)}
      </div>
    </div>
  );
}

function TimelineItem({ a, onEdit, onDelete }) {
  const meta = AKTIVITETSTYPER[a.type] || AKTIVITETSTYPER.epost;
  const [hover, setHover] = useState(false);
  return (
    <div style={{display:'flex', gap:14, position:'relative'}}
      onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)}>
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
            {a.prosessNavn && (
              <span style={{fontSize:10, fontWeight:600, color:C.gray500, background:C.gray100, padding:'2px 8px', borderRadius:9999, whiteSpace:'nowrap'}}>{a.prosessNavn}</span>
            )}
            {a.beløp != null && (
              <span style={{
                fontSize:11, fontWeight:700, color:'#fff', background: meta.color,
                padding:'2px 8px', borderRadius:9999,
              }}>{formatKr(a.beløp)}</span>
            )}
          </div>
          <div style={{display:'flex', alignItems:'center', gap:6, flexShrink:0}}>
            <span style={{fontSize:12, color:C.gray500, whiteSpace:'nowrap'}}>{formatDateShort(a.dato)}</span>
            {(onEdit || onDelete) && (
              <div style={{display:'flex', gap:2, opacity: hover ? 1 : 0.25, transition:'opacity 120ms'}}>
                {onEdit && (
                  <button onClick={()=>onEdit(a)} title="Rediger aktivitet" style={{
                    background:'none', border:'none', cursor:'pointer', color:C.gray400,
                    padding:4, borderRadius:5, display:'flex', alignItems:'center',
                  }}
                    onMouseEnter={e=>{e.currentTarget.style.background=C.gray100; e.currentTarget.style.color=C.navy;}}
                    onMouseLeave={e=>{e.currentTarget.style.background='none'; e.currentTarget.style.color=C.gray400;}}>
                    <Icon name="pencil" size={13}/>
                  </button>
                )}
                {onDelete && (
                  <button onClick={()=>onDelete(a.id)} title="Slett aktivitet" style={{
                    background:'none', border:'none', cursor:'pointer', color:C.gray400,
                    padding:4, borderRadius:5, display:'flex', alignItems:'center',
                  }}
                    onMouseEnter={e=>{e.currentTarget.style.background='#fbe6e6'; e.currentTarget.style.color=C.red;}}
                    onMouseLeave={e=>{e.currentTarget.style.background='none'; e.currentTarget.style.color=C.gray400;}}>
                    <Icon name="trash-2" size={13}/>
                  </button>
                )}
              </div>
            )}
          </div>
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

// ── Status-velger: klikkbart statusmerke i profil-toppen ─────
function StatusVelger({ status, open, setOpen, onPick }) {
  return (
    <div style={{position:'relative'}}>
      <button onClick={()=>setOpen(!open)} title="Endre framdriftsstatus" style={{
        background:'none', border:'none', cursor:'pointer', padding:0,
        display:'inline-flex', alignItems:'center', gap:5, fontFamily:'inherit',
      }}>
        <StatusBadge status={status}/>
        <Icon name="chevron-down" size={14} color={C.gray400}/>
      </button>
      {open && (
        <>
          {/* klikk-utenfor-lukker for nedtrekket */}
          <div onClick={()=>setOpen(false)} style={{position:'fixed', inset:0, zIndex:40}}/>
          <div style={{
            position:'absolute', top:'calc(100% + 6px)', left:0, zIndex:41,
            background:'#fff', borderRadius:10, border:`1px solid ${C.gray100}`,
            boxShadow:'0 8px 28px rgba(22,39,61,0.16)', padding:6, minWidth:190,
          }}>
            <div style={{fontSize:10, fontWeight:600, color:C.gray400, textTransform:'uppercase', letterSpacing:'.05em', padding:'6px 8px 4px'}}>Sett status</div>
            {STATUS_LISTE.map(s => {
              const farge = STATUS_FARGER[s] || {};
              const valgt = s === status;
              return (
                <button key={s} onClick={()=>onPick(s)} style={{
                  display:'flex', alignItems:'center', gap:9, width:'100%',
                  background: valgt ? C.gray50 : 'transparent', border:'none', cursor:'pointer',
                  padding:'8px 9px', borderRadius:6, textAlign:'left', fontFamily:'inherit',
                  fontSize:13, fontWeight: valgt ? 700 : 500, color: C.navy,
                }}
                  onMouseEnter={e=>{ if(!valgt) e.currentTarget.style.background=C.gray50; }}
                  onMouseLeave={e=>{ if(!valgt) e.currentTarget.style.background='transparent'; }}>
                  <span style={{width:9, height:9, borderRadius:'50%', background: farge.dot || C.gray400, flexShrink:0}}/>
                  <span style={{flex:1}}>{s}</span>
                  {valgt && <Icon name="check" size={14} color={C.green}/>}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ── Modal for å redigere en aktivitet i tidslinjen ───────────
function RedigerAktivitetModal({ team, aktivitet, onClose, onSave }) {
  const [form, setForm] = useState({
    type: aktivitet.type,
    dato: aktivitet.dato,
    tittel: aktivitet.tittel || '',
    notat: aktivitet.notat || '',
    beløp: aktivitet.beløp != null ? String(aktivitet.beløp) : '',
    loggetAv: aktivitet.loggetAv || (team[0]?.navn || ''),
  });
  const showBelop = ['tilbud_sendt','tilbud_akseptert','tilbud_avslått'].includes(form.type);

  const submit = (e) => {
    e.preventDefault();
    if (!form.tittel.trim()) return;
    const patch = {
      type: form.type, dato: form.dato, tittel: form.tittel.trim(),
      notat: form.notat.trim(), loggetAv: form.loggetAv,
    };
    // Beløp: sett hvis relevant, ellers fjern feltet
    patch.beløp = (showBelop && form.beløp !== '') ? Number(form.beløp) : null;
    onSave(patch);
  };

  return (
    <Modal open={true} onClose={onClose} title="Rediger aktivitet" width={520}>
      <form onSubmit={submit} style={{display:'flex', flexDirection:'column', gap:12}}>
        <div style={{display:'grid', gridTemplateColumns:'1fr 140px', gap:12}}>
          <Select label="Type" value={form.type} onChange={e=>setForm({...form, type:e.target.value})}
            options={Object.entries(AKTIVITETSTYPER).filter(([k])=>k!=='lead-mottatt').map(([k,v])=>({value:k, label:v.label}))}/>
          <Input label="Dato" type="date" value={form.dato} onChange={e=>setForm({...form, dato:e.target.value})}/>
        </div>
        <Input label="Tittel *" value={form.tittel} onChange={e=>setForm({...form, tittel:e.target.value})} placeholder="Kort tittel"/>
        <Textarea label="Notat" value={form.notat} onChange={e=>setForm({...form, notat:e.target.value})} rows={3}/>
        {showBelop && (
          <Input label="Beløp (kr)" type="number" value={form.beløp} onChange={e=>setForm({...form, beløp:e.target.value})} placeholder="0"/>
        )}
        <Select label="Logget av" value={form.loggetAv} onChange={e=>setForm({...form, loggetAv:e.target.value})}
          options={team.map(t=>t.navn)}/>
        <div style={{
          fontSize:12, color:C.gray500, background:C.gray50, borderRadius:7,
          padding:'9px 11px', lineHeight:1.5,
        }}>
          Merk: å endre aktivitetstype her endrer <strong>ikke</strong> kundens framdriftsstatus automatisk. Status justeres på statusmerket øverst.
        </div>
        <div style={{display:'flex', justifyContent:'flex-end', gap:10, marginTop:6}}>
          <Button variant="secondary" type="button" onClick={onClose}>Avbryt</Button>
          <Button variant="primary" type="submit">Lagre endringer</Button>
        </div>
      </form>
    </Modal>
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
          <Button variant="secondary" size="sm" icon="pencil" onClick={()=>setEditing(true)}>Endre</Button>
        </div>
      </div>
    </Card>
  );
}

function NyAktivitetSkjema({ team, kunde, onAdd, prosesser = [], selectedProsessId, pakkeById }) {
  const [form, setForm] = useState({
    type: 'møte', dato: TODAY, tittel: '', notat: '', beløp:'',
    loggetAv: team[0]?.navn || 'Du',
    prosessId: selectedProsessId || prosesser[0]?.id || '',
  });
  const showBelop = ['tilbud_sendt','tilbud_akseptert','tilbud_avslått'].includes(form.type);

  const submit = (e) => {
    e.preventDefault();
    if (!form.tittel.trim()) return;
    const valgtPid = form.prosessId || selectedProsessId || prosesser[0]?.id || null;
    const pObj = prosesser.find(p => p.id === valgtPid);
    const payload = {
      type: form.type, dato: form.dato, tittel: form.tittel.trim(),
      notat: form.notat.trim(), loggetAv: form.loggetAv,
    };
    if (valgtPid) { payload.prosessId = valgtPid; payload.prosessNavn = prosessNavn(pObj, pakkeById); }
    if (showBelop && form.beløp !== '') payload.beløp = Number(form.beløp);
    onAdd(payload);
    setForm(f => ({ ...f, tittel:'', notat:'', beløp:'' }));
  };

  return (
    <Card padding={0}>
      <div style={{padding:'14px 18px', borderBottom:`1px solid ${C.gray100}`}}>
        <div style={{fontSize:15, fontWeight:700, color:C.navy}}>Logg aktivitet</div>
      </div>
      <form onSubmit={submit} style={{padding:'16px 18px', display:'flex', flexDirection:'column', gap:10}}>
        <div style={{display:'grid', gridTemplateColumns:'1fr 110px', gap:10}}>
          <Select label="Type" value={form.type} onChange={e=>setForm({...form, type:e.target.value})}
            options={Object.entries(AKTIVITETSTYPER).filter(([k])=>k!=='lead-mottatt').map(([k,v])=>({value:k, label:v.label}))}/>
          <Input label="Dato" type="date" value={form.dato} onChange={e=>setForm({...form, dato:e.target.value})}/>
        </div>
        {prosesser.length > 1 && (
          <Select label="Gjelder prosess" value={form.prosessId} onChange={e=>setForm({...form, prosessId:e.target.value})}
            options={prosesser.map(p=>({value:p.id, label:prosessNavn(p, pakkeById)}))}/>
        )}
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
  const { team } = state;
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

        <div style={{fontSize:11, fontWeight:700, color:C.gray500, textTransform:'uppercase', letterSpacing:'.05em', marginTop:6}}>Ansvar</div>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, alignItems:'end'}}>
          <Select label="Ansvarlig selger" value={form.ansvarligId} onChange={e=>upd('ansvarligId', e.target.value)}
            options={team.map(t=>({value:t.id, label:t.navn}))}/>
          <div style={{fontSize:12, color:C.gray500, lineHeight:1.5, paddingBottom:9}}>
            Pakker, verdi og status styres som <strong style={{color:C.navy}}>prosesser</strong> på kundekortet.
          </div>
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

// ── Prosess-bånd + modal + stilkonstanter ──
const statLabelStyle = { fontSize:11, fontWeight:600, color:C.gray500, textTransform:'uppercase', letterSpacing:'.05em', marginBottom:5 };
const profilIconBtn = {
  width:30, height:30, borderRadius:6, border:`1px solid ${C.gray200}`,
  background:'#fff', cursor:'pointer', display:'inline-flex', alignItems:'center', justifyContent:'center', padding:0,
};

function ProsessBand({ prosesser, pakkeById, selectedId, totalVerdi, onSelect, onNy }) {
  return (
    <div style={{padding:'14px 24px', borderBottom:`1px solid ${C.gray100}`, background:C.gray50, display:'flex', alignItems:'center', gap:14, flexWrap:'wrap'}}>
      <div style={{display:'flex', gap:8, flexWrap:'wrap', flex:1, minWidth:0}}>
        {prosesser.map(p => {
          const sc = STATUS_FARGER[p.status] || STATUS_FARGER.Lead;
          const aktiv = p.id === selectedId;
          return (
            <button key={p.id} onClick={()=>onSelect(p.id)} style={{
              display:'inline-flex', alignItems:'center', gap:8, cursor:'pointer', fontFamily:'inherit',
              padding:'7px 12px', borderRadius:8, background:'#fff',
              border:`1.5px solid ${aktiv ? C.navy : C.gray200}`,
              boxShadow: aktiv ? '0 1px 3px rgba(22,39,61,0.12)' : 'none',
            }}>
              <span style={{width:8, height:8, borderRadius:'50%', background:sc.dot, flexShrink:0}}/>
              <span style={{fontSize:13, fontWeight:600, color:C.navy, maxWidth:170, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{prosessNavn(p, pakkeById)}</span>
              <span style={{fontSize:12, color:C.gray500}}>{formatKr(p.verdi)}</span>
            </button>
          );
        })}
        <button onClick={onNy} title="Legg til ny prosess" style={{
          display:'inline-flex', alignItems:'center', gap:6, cursor:'pointer', fontFamily:'inherit',
          padding:'7px 12px', borderRadius:8, border:`1.5px dashed ${C.gray300}`, background:'transparent',
          color:C.blue, fontWeight:600, fontSize:13,
        }}><Icon name="plus" size={13}/> Ny prosess</button>
      </div>
      {prosesser.length > 0 && (
        <div style={{textAlign:'right', flexShrink:0}}>
          <div style={{fontSize:10, fontWeight:600, color:C.gray500, textTransform:'uppercase', letterSpacing:'.05em'}}>Total for kunden</div>
          <div style={{fontSize:17, fontWeight:700, color:C.navy, lineHeight:1.2}}>{formatKr(totalVerdi)}</div>
          <div style={{fontSize:11, color:C.gray400}}>{prosesser.length} {prosesser.length===1?'prosess':'prosesser'}</div>
        </div>
      )}
    </div>
  );
}

function ProsessModal({ state, modal, onClose, onSave }) {
  const { pakker } = state;
  const erNy = modal.mode === 'new';
  const [form, setForm] = useState(erNy
    ? { navn:'', pakkeId: pakker[0]?.id || '', verdi: pakker[0]?.pris || 0, status:'Lead', opprettet: TODAY, notat:'' }
    : { ...modal.prosess });
  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const submit = (e) => { e?.preventDefault(); onSave(form); };
  return (
    <Modal open={true} onClose={onClose} title={erNy ? 'Ny prosess' : 'Rediger prosess'} width={560}>
      <form onSubmit={submit} style={{display:'flex', flexDirection:'column', gap:14}}>
        <Input label="Navn på prosessen (valgfritt)" value={form.navn} onChange={e=>upd('navn', e.target.value)}
          placeholder="F.eks. «Ekspertbistand — Per Hansen». Tomt = pakkenavn."/>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
          <Select label="Pakke" value={form.pakkeId} onChange={e=>{
            const v = e.target.value; upd('pakkeId', v);
            const p = pakker.find(x=>x.id===v);
            if (p && (erNy || !form.verdi)) upd('verdi', p.pris);
          }} options={pakker.map(p=>({value:p.id, label:p.navn}))}/>
          <Input label="Verdi (kr)" type="number" value={form.verdi} onChange={e=>upd('verdi', Number(e.target.value)||0)}/>
        </div>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
          <Select label="Framdriftsstatus" value={form.status} onChange={e=>upd('status', e.target.value)} options={STATUS_LISTE}/>
          <Input label="Opprettet" type="date" value={form.opprettet} onChange={e=>upd('opprettet', e.target.value)}/>
        </div>
        <Textarea label="Notat (valgfritt)" value={form.notat} onChange={e=>upd('notat', e.target.value)} rows={2}/>
        <div style={{display:'flex', justifyContent:'flex-end', gap:10, marginTop:6}}>
          <Button variant="secondary" type="button" onClick={onClose}>Avbryt</Button>
          <Button variant="primary" type="submit">{erNy ? 'Legg til prosess' : 'Lagre endringer'}</Button>
        </div>
      </form>
    </Modal>
  );
}

window.Kundeprofil = Kundeprofil;
