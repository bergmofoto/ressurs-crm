// ============================================================
// INNSTILLINGER — Pakker, team, selskap, avtalemal, farger, data
// ============================================================

function Innstillinger({ state, setState }) {
  const { pakker, team, selskap, avtalemal } = state;
  const [tab, setTab] = useState('pakker');

  const updPakker     = (next) => setState(s => ({ ...s, pakker: next }));
  const updTeam       = (next) => setState(s => ({ ...s, team: next }));
  const updSelskap    = (next) => setState(s => ({ ...s, selskap: next }));
  const updAvtalemal  = (next) => setState(s => ({ ...s, avtalemal: next }));

  return (
    <div style={{padding:'28px 32px', maxWidth:1100, margin:'0 auto'}}>
      <div style={{marginBottom:20}}>
        <h1 style={{fontSize:28, fontWeight:700, color:C.navy, letterSpacing:'-0.01em', margin:0}}>Innstillinger</h1>
        <p style={{fontSize:14, color:C.gray500, marginTop:4, margin:0}}>Pakker, team, selskap og standardvilkår</p>
      </div>

      <div style={{display:'flex', gap:4, marginBottom:18, borderBottom:`1px solid ${C.gray200}`, flexWrap:'wrap'}}>
        {[
          {id:'pakker',     label:'Pakker',           icon:'package'},
          {id:'team',       label:'Team',             icon:'users'},
          {id:'selskap',    label:'Selskap',          icon:'building-2'},
          {id:'avtalemal',  label:'Avtalemal',        icon:'file-text'},
          {id:'farger',     label:'Fargeforklaring',  icon:'palette'},
          {id:'data',       label:'Data',             icon:'database'},
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

      {tab === 'pakker'    && <PakkerSection pakker={pakker} setPakker={updPakker}/>}
      {tab === 'team'      && <TeamSection team={team} setTeam={updTeam}/>}
      {tab === 'selskap'   && <SelskapSection selskap={selskap} setSelskap={updSelskap}/>}
      {tab === 'avtalemal' && <AvtalemalSection avtalemal={avtalemal} setAvtalemal={updAvtalemal}/>}
      {tab === 'farger'    && <FargerSection/>}
      {tab === 'data'      && <DataSection/>}
    </div>
  );
}

// ── Pakker ───────────────────────────────────────────────────
function PakkerSection({ pakker, setPakker }) {
  const [editing, setEditing] = useState(null);
  const [adding, setAdding] = useState(false);

  const blank = {
    navn:'', type:'skreddersydd', beskrivelse:'', målgruppe:'', innledning:'',
    møter:[], tillegg:[], timepris:1650, pris:0, mvaFritak:false,
    bruker_standardvilkår:true,
    betalingsbetingelser:'Faktureres etterskuddsvis per måned. Forfall 14 kalenderdager.',
  };

  const savePakke = (data, id) => {
    if (id) setPakker(pakker.map(p => p.id===id ? {...p, ...data} : p));
    else setPakker([...pakker, { id: 'p'+Date.now(), ...data }]);
    setEditing(null); setAdding(false);
  };
  const deletePakke = (id) => {
    if (!confirm('Er du sikker på at du vil slette denne pakken?')) return;
    setPakker(pakker.filter(p => p.id !== id));
  };
  const duplicatePakke = (p) => {
    const copy = JSON.parse(JSON.stringify(p));
    copy.id = 'p'+Date.now();
    copy.navn = p.navn + ' (kopi)';
    if (copy.møter) copy.møter = copy.møter.map(m => ({...m, id:'m'+Date.now()+Math.random().toString(36).slice(2,6)}));
    setPakker([...pakker, copy]);
  };

  return (
    <div>
      <Card padding={0}>
        <div style={{padding:'16px 22px', borderBottom:`1px solid ${C.gray100}`, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <div>
            <div style={{fontSize:15, fontWeight:700, color:C.navy}}>Pakker</div>
            <div style={{fontSize:12, color:C.gray500, marginTop:2}}>{pakker.length} pakker definert · grunnlag for tilbud</div>
          </div>
          <Button variant="primary" icon="plus" onClick={()=>setAdding(true)}>Ny pakke</Button>
        </div>
        <div>
          {pakker.length === 0 && (
            <div style={{padding:'40px 22px', textAlign:'center', color:C.gray400, fontSize:13}}>
              Ingen pakker definert ennå. Trykk «Ny pakke» for å legge til den første.
            </div>
          )}
          {pakker.map((p, i) => {
            const type = PAKKE_TYPER[p.type] || PAKKE_TYPER.skreddersydd;
            const antallMøter = (p.møter || []).length;
            const totalTimer = pakkeTimer(p);
            return (
              <div key={p.id} style={{
                padding:'16px 22px', display:'grid', gridTemplateColumns:'2fr 2fr 130px 130px 130px',
                gap:16, alignItems:'center',
                borderBottom: i < pakker.length-1 ? `1px solid ${C.gray100}` : 'none',
              }}>
                <div>
                  <div style={{fontSize:14, fontWeight:600, color:C.navy, marginBottom:4}}>{p.navn}</div>
                  <span style={{
                    fontSize:10, fontWeight:700, color:'#fff', background: type.color,
                    padding:'2px 8px', borderRadius:9999, textTransform:'uppercase', letterSpacing:'.05em',
                  }}>{type.label}</span>
                </div>
                <div style={{fontSize:13, color:C.gray500, lineHeight:1.4}}>{p.beskrivelse}</div>
                <div style={{textAlign:'center', fontSize:12, color:C.gray700}}>
                  {antallMøter > 0 ? (
                    <>
                      <div style={{fontWeight:600, color:C.navy}}>{antallMøter} møter</div>
                      <div style={{color:C.gray500, marginTop:2}}>{totalTimer} t totalt</div>
                    </>
                  ) : <span style={{color:C.gray400}}>–</span>}
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{fontSize:14, fontWeight:700, color:C.navy}}>{formatKr(p.pris)}</div>
                  <div style={{fontSize:11, color:C.gray500, marginTop:2}}>eks. mva.</div>
                </div>
                <div style={{display:'flex', gap:6, justifyContent:'flex-end'}}>
                  <button onClick={()=>duplicatePakke(p)} style={iconBtn} title="Dupliser"><Icon name="copy" size={14} color={C.gray500}/></button>
                  <button onClick={()=>setEditing(p)} style={iconBtn} title="Rediger"><Icon name="edit-3" size={14} color={C.gray500}/></button>
                  <button onClick={()=>deletePakke(p.id)} style={iconBtn} title="Slett"><Icon name="trash-2" size={14} color={C.red}/></button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {(editing || adding) && (
        <Modal open={true} onClose={()=>{setEditing(null); setAdding(false);}} title={editing ? 'Rediger pakke' : 'Ny pakke'} width={820}>
          <PakkeForm initial={editing || blank} onCancel={()=>{setEditing(null); setAdding(false);}}
            onSave={data => savePakke(data, editing?.id)}/>
        </Modal>
      )}
    </div>
  );
}

function PakkeForm({ initial, onCancel, onSave }) {
  const [form, setForm] = useState(() => JSON.parse(JSON.stringify(initial)));
  const [err, setErr] = useState('');
  const [section, setSection] = useState('grunninfo'); // 'grunninfo' | 'møter' | 'tillegg' | 'pris'

  const upd = (k, v) => setForm(f => ({...f, [k]: v}));

  // ── Møter-redigering ─────────────────────────────────────
  const addMøte = () => {
    const nytt = {
      id:'m'+Date.now(), fase:'', møtenr:(form.møter?.length||0)+1,
      forarbeidT:0, møteT:1, etterarbeidT:0, innhold:'', hjemmeoppgave:'',
    };
    upd('møter', [...(form.møter||[]), nytt]);
  };
  const updMøte = (id, patch) => {
    upd('møter', form.møter.map(m => m.id===id ? {...m, ...patch} : m));
  };
  const delMøte = (id) => {
    if (!confirm('Slette dette møtet fra pakken?')) return;
    upd('møter', form.møter.filter(m => m.id!==id));
  };
  const moveMøte = (id, dir) => {
    const arr = [...form.møter];
    const i = arr.findIndex(m => m.id===id);
    const j = i + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    arr.forEach((m, idx) => m.møtenr = idx+1);
    upd('møter', arr);
  };

  // ── Tillegg-redigering ───────────────────────────────────
  const addTillegg = () => upd('tillegg', [...(form.tillegg||[]), { id:'a'+Date.now(), navn:'', pris:0 }]);
  const updTillegg = (id, patch) => upd('tillegg', form.tillegg.map(t => t.id===id ? {...t, ...patch} : t));
  const delTillegg = (id) => upd('tillegg', form.tillegg.filter(t => t.id!==id));

  const submit = e => {
    e.preventDefault();
    if (!form.navn.trim()) { setErr('Navn er påkrevd'); setSection('grunninfo'); return; }
    if (!(Number(form.pris) >= 0)) { setErr('Ugyldig pris'); setSection('pris'); return; }
    onSave({
      ...form,
      navn: form.navn.trim(),
      beskrivelse: (form.beskrivelse||'').trim(),
      målgruppe: (form.målgruppe||'').trim(),
      innledning: (form.innledning||'').trim(),
      timepris: Number(form.timepris)||0,
      pris: Number(form.pris)||0,
    });
  };

  const totalTimer = pakkeTimer(form);
  const tilleggSum = pakkeTilleggSum(form);
  const beregnet = beregnetPakkepris(form);

  const sections = [
    {id:'grunninfo', label:'Grunninfo'},
    {id:'møter',     label:`Møter (${(form.møter||[]).length})`},
    {id:'tillegg',   label:`Tillegg (${(form.tillegg||[]).length})`},
    {id:'pris',      label:'Pris & vilkår'},
  ];

  return (
    <form onSubmit={submit}>
      {/* Section nav */}
      <div style={{display:'flex', gap:4, marginBottom:18, borderBottom:`1px solid ${C.gray100}`}}>
        {sections.map(s => (
          <button key={s.id} type="button" onClick={()=>setSection(s.id)} style={{
            background:'transparent', border:'none', cursor:'pointer', fontFamily:'inherit',
            padding:'8px 14px', fontSize:13,
            fontWeight: section===s.id ? 600 : 500,
            color: section===s.id ? C.navy : C.gray500,
            borderBottom: `2px solid ${section===s.id ? C.navy : 'transparent'}`,
            marginBottom: -1,
          }}>{s.label}</button>
        ))}
      </div>

      {/* GRUNNINFO */}
      {section === 'grunninfo' && (
        <div style={{display:'flex', flexDirection:'column', gap:12}}>
          <div style={{display:'grid', gridTemplateColumns:'2fr 1fr', gap:12}}>
            <Input label="Pakkenavn *" value={form.navn} onChange={e=>upd('navn', e.target.value)} error={err && !form.navn.trim() ? err : ''}/>
            <Select label="Pakketype" value={form.type} onChange={e=>upd('type', e.target.value)}
              options={Object.entries(PAKKE_TYPER).map(([k,v])=>({value:k, label:v.label}))}/>
          </div>
          <Input label="Korttekst" value={form.beskrivelse} onChange={e=>upd('beskrivelse', e.target.value)}
            placeholder="Én setning som beskriver pakken (vises i lister)"/>
          <Input label="Målgruppe" value={form.målgruppe} onChange={e=>upd('målgruppe', e.target.value)}
            placeholder="f.eks. Arbeidstakere i omstilling"/>
          <Textarea label="Innledning (vises øverst i tilbud)" value={form.innledning} onChange={e=>upd('innledning', e.target.value)}
            rows={5} placeholder="Beskrivelse av pakkens formål, metodikk og leveranseform."/>
        </div>
      )}

      {/* MØTER */}
      {section === 'møter' && (
        <div>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12}}>
            <div>
              <div style={{fontSize:14, fontWeight:600, color:C.navy}}>Møter / økter</div>
              <div style={{fontSize:12, color:C.gray500, marginTop:2}}>Programmets struktur. Vises i tilbudet som en plan.</div>
            </div>
            <div style={{fontSize:12, color:C.gray500}}>Totalt: <span style={{fontWeight:700, color:C.navy}}>{totalTimer} t</span></div>
          </div>

          {(form.møter || []).length === 0 && (
            <div style={{padding:'30px', textAlign:'center', color:C.gray400, fontSize:13, background:C.gray50, borderRadius:8, marginBottom:12}}>
              Ingen møter lagt til. Legg til møter for å bygge pakken som et strukturert program.
            </div>
          )}

          <div style={{display:'flex', flexDirection:'column', gap:10}}>
            {(form.møter || []).map((m, i) => (
              <MøteRow key={m.id} m={m} i={i} total={form.møter.length}
                onUpd={patch=>updMøte(m.id, patch)} onDel={()=>delMøte(m.id)} onMove={dir=>moveMøte(m.id, dir)}/>
            ))}
          </div>

          <Button variant="secondary" type="button" icon="plus" onClick={addMøte} style={{marginTop:12}}>Legg til møte</Button>
        </div>
      )}

      {/* TILLEGG */}
      {section === 'tillegg' && (
        <div>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12}}>
            <div>
              <div style={{fontSize:14, fontWeight:600, color:C.navy}}>Tillegg / verktøy</div>
              <div style={{fontSize:12, color:C.gray500, marginTop:2}}>F.eks. lisenser, materiell, programvare.</div>
            </div>
            <div style={{fontSize:12, color:C.gray500}}>Sum: <span style={{fontWeight:700, color:C.navy}}>{formatKr(tilleggSum)}</span></div>
          </div>

          <div style={{display:'flex', flexDirection:'column', gap:8}}>
            {(form.tillegg || []).map(t => (
              <div key={t.id} style={{display:'grid', gridTemplateColumns:'1fr 140px 36px', gap:8, alignItems:'end'}}>
                <Input label="Navn" value={t.navn} onChange={e=>updTillegg(t.id, {navn:e.target.value})}/>
                <Input label="Pris (kr)" type="number" value={t.pris} onChange={e=>updTillegg(t.id, {pris:Number(e.target.value)||0})}/>
                <button type="button" onClick={()=>delTillegg(t.id)} style={{...iconBtn, marginBottom:1}} title="Slett"><Icon name="trash-2" size={14} color={C.red}/></button>
              </div>
            ))}
          </div>

          <Button variant="secondary" type="button" icon="plus" onClick={addTillegg} style={{marginTop:12}}>Legg til tillegg</Button>
        </div>
      )}

      {/* PRIS & VILKÅR */}
      {section === 'pris' && (
        <div style={{display:'flex', flexDirection:'column', gap:14}}>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12}}>
            <Input label="Timepris rådgiver (kr)" type="number" value={form.timepris} onChange={e=>upd('timepris', e.target.value)}/>
            <Input label="Pakkepris (kr, eks. mva.) *" type="number" value={form.pris} onChange={e=>upd('pris', e.target.value)} error={err && !(Number(form.pris)>=0) ? err : ''}/>
            <Select label="MVA" value={form.mvaFritak ? 'fritak' : 'standard'} onChange={e=>upd('mvaFritak', e.target.value==='fritak')}
              options={[{value:'standard', label:'25% standard'}, {value:'fritak', label:'Fritak'}]}/>
          </div>

          <div style={{padding:'12px 14px', background:C.gray50, borderRadius:8, fontSize:12, color:C.gray700, lineHeight:1.6}}>
            <div style={{fontWeight:600, color:C.navy, marginBottom:6}}>Beregnet pris (kun til hjelp)</div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8}}>
              <div>Timer × timepris: <span style={{fontWeight:600, color:C.navy}}>{totalTimer} t × {formatKr(form.timepris)} = {formatKr(totalTimer * (Number(form.timepris)||0))}</span></div>
              <div>+ Tillegg: <span style={{fontWeight:600, color:C.navy}}>{formatKr(tilleggSum)}</span></div>
              <div style={{gridColumn:'1 / -1', marginTop:4, paddingTop:6, borderTop:`1px solid ${C.gray200}`}}>
                = <span style={{fontWeight:700, color:C.navy}}>{formatKr(beregnet)}</span> beregnet
                {Number(form.pris) !== beregnet && form.pris > 0 && (
                  <span style={{color:C.amber, marginLeft:8, fontSize:11}}>(avviker fra pakkepris — pakkepris brukes i tilbud)</span>
                )}
              </div>
            </div>
          </div>

          <Textarea label="Betalingsbetingelser" value={form.betalingsbetingelser} onChange={e=>upd('betalingsbetingelser', e.target.value)} rows={2}/>

          <label style={{display:'flex', alignItems:'center', gap:10, padding:'10px 12px', background:C.gray50, borderRadius:8, cursor:'pointer'}}>
            <input type="checkbox" checked={!!form.bruker_standardvilkår} onChange={e=>upd('bruker_standardvilkår', e.target.checked)}
              style={{width:16, height:16, accentColor: C.navy, cursor:'pointer'}}/>
            <div>
              <div style={{fontSize:13, fontWeight:600, color:C.navy}}>Inkluder standardvilkår fra avtalemal i tilbud</div>
              <div style={{fontSize:11, color:C.gray500, marginTop:2}}>Den fulle avtaleteksten flettes inn på slutten av tilbudet.</div>
            </div>
          </label>
        </div>
      )}

      {err && <div style={{fontSize:12, color:C.red, marginTop:10}}>{err}</div>}
      <div style={{display:'flex', justifyContent:'flex-end', gap:8, marginTop:18, paddingTop:14, borderTop:`1px solid ${C.gray100}`}}>
        <Button variant="secondary" type="button" onClick={onCancel}>Avbryt</Button>
        <Button variant="primary" type="submit">Lagre pakke</Button>
      </div>
    </form>
  );
}

function MøteRow({ m, i, total, onUpd, onDel, onMove }) {
  const [open, setOpen] = useState(false);
  const totT = møteTimer(m);
  return (
    <div style={{border:`1px solid ${C.gray200}`, borderRadius:8, background:'#fff'}}>
      <div style={{padding:'12px 14px', display:'grid', gridTemplateColumns:'auto 1fr auto auto', gap:12, alignItems:'center'}}>
        <div style={{
          width:30, height:30, borderRadius:'50%', background:C.navy, color:'#fff',
          fontSize:13, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center',
        }}>{m.møtenr || i+1}</div>
        <div style={{minWidth:0}}>
          <input value={m.fase} onChange={e=>onUpd({fase:e.target.value})}
            placeholder="Fase / tittel — f.eks. «Oppstart»"
            style={{
              width:'100%', border:'none', outline:'none', background:'transparent',
              fontSize:14, fontWeight:600, color:C.navy, fontFamily:'inherit', padding:0,
            }}/>
          <div style={{fontSize:11, color:C.gray500, marginTop:3}}>
            Møte {m.møtenr || i+1} · {totT} t totalt
            {m.forarbeidT > 0 && ` · forarbeid ${m.forarbeidT} t`}
            {m.møteT > 0 && ` · møte ${m.møteT} t`}
            {m.etterarbeidT > 0 && ` · etterarbeid ${m.etterarbeidT} t`}
          </div>
        </div>
        <div style={{display:'flex', gap:4}}>
          <button type="button" onClick={()=>onMove(-1)} disabled={i===0} style={{...iconBtn, opacity: i===0?0.3:1}} title="Flytt opp"><Icon name="chevron-up" size={14} color={C.gray500}/></button>
          <button type="button" onClick={()=>onMove(1)} disabled={i===total-1} style={{...iconBtn, opacity: i===total-1?0.3:1}} title="Flytt ned"><Icon name="chevron-down" size={14} color={C.gray500}/></button>
        </div>
        <div style={{display:'flex', gap:4}}>
          <button type="button" onClick={()=>setOpen(o=>!o)} style={iconBtn} title={open?'Lukk':'Rediger'}><Icon name={open?'chevron-up':'edit-3'} size={14} color={C.gray500}/></button>
          <button type="button" onClick={onDel} style={iconBtn} title="Slett"><Icon name="trash-2" size={14} color={C.red}/></button>
        </div>
      </div>

      {open && (
        <div style={{padding:'4px 14px 14px', borderTop:`1px solid ${C.gray100}`, display:'flex', flexDirection:'column', gap:10}}>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginTop:10}}>
            <Input label="Forarbeid (timer)" type="number" step="0.5" value={m.forarbeidT} onChange={e=>onUpd({forarbeidT:Number(e.target.value)||0})}/>
            <Input label="Møte (timer)" type="number" step="0.5" value={m.møteT} onChange={e=>onUpd({møteT:Number(e.target.value)||0})}/>
            <Input label="Etterarbeid (timer)" type="number" step="0.5" value={m.etterarbeidT} onChange={e=>onUpd({etterarbeidT:Number(e.target.value)||0})}/>
          </div>
          <Textarea label="Innhold (én linje per punkt)" value={m.innhold} onChange={e=>onUpd({innhold:e.target.value})} rows={5}
            placeholder={"Skriv ett tema per linje — f.eks.\\nGjennomgang av situasjon\\nKartlegging av behov"}/>
          <Input label="Hjemmeoppgave (valgfritt)" value={m.hjemmeoppgave} onChange={e=>onUpd({hjemmeoppgave:e.target.value})}/>
        </div>
      )}
    </div>
  );
}

// ── Team ─────────────────────────────────────────────────────
function TeamSection({ team, setTeam }) {
  const [editing, setEditing] = useState(null);
  const [adding, setAdding] = useState(false);
  const blank = { navn:'', rolle:'', initialer:'', epost:'', telefon:'', budsjett:0 };

  const totalBudsjett = team.reduce((s,t) => s + (t.budsjett||0), 0);

  const saveMember = (data, id) => {
    if (id) setTeam(team.map(t => t.id===id ? {...t, ...data} : t));
    else setTeam([...team, { id: 't'+Date.now(), ...data }]);
    setEditing(null); setAdding(false);
  };
  const deleteMember = (id) => {
    if (!confirm('Slette teammedlem? Kunder med dette teammedlemmet som ansvarlig vil bli stående uten ansvarlig.')) return;
    setTeam(team.filter(t => t.id !== id));
  };

  return (
    <div>
      <Card padding={0}>
        <div style={{padding:'16px 22px', borderBottom:`1px solid ${C.gray100}`, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <div>
            <div style={{fontSize:15, fontWeight:700, color:C.navy}}>Team</div>
            <div style={{fontSize:12, color:C.gray500, marginTop:2}}>{team.length} teammedlemmer · samlet årsbudsjett {formatKr(totalBudsjett)}</div>
          </div>
          <Button variant="primary" icon="user-plus" onClick={()=>setAdding(true)}>Nytt teammedlem</Button>
        </div>
        <div>
          {team.map((t, i) => (
            <div key={t.id} style={{
              padding:'14px 22px', display:'grid', gridTemplateColumns:'auto 1.2fr 1.4fr 140px 120px',
              gap:16, alignItems:'center',
              borderBottom: i < team.length-1 ? `1px solid ${C.gray100}` : 'none',
            }}>
              <Avatar initialer={t.initialer} size={36} color={teamColor(t.id)}/>
              <div>
                <div style={{fontSize:14, fontWeight:600, color:C.navy}}>{t.navn}</div>
                <div style={{fontSize:12, color:C.gray500, marginTop:2}}>{t.rolle}</div>
              </div>
              <div style={{fontSize:12, color:C.gray700, lineHeight:1.5}}>
                {t.epost && <div style={{display:'flex', alignItems:'center', gap:6}}><Icon name="mail" size={11} color={C.gray400}/>{t.epost}</div>}
                {t.telefon && <div style={{display:'flex', alignItems:'center', gap:6, marginTop:2}}><Icon name="phone" size={11} color={C.gray400}/>{t.telefon}</div>}
              </div>
              <div style={{textAlign:'right'}}>
                <div style={{fontSize:10, fontWeight:600, color:C.gray500, textTransform:'uppercase', letterSpacing:'.05em'}}>Årsbudsjett</div>
                <div style={{fontSize:14, fontWeight:700, color:C.navy, marginTop:2}}>{t.budsjett ? formatKr(t.budsjett) : <span style={{color:C.gray400, fontWeight:500}}>–</span>}</div>
              </div>
              <div style={{display:'flex', gap:6, justifyContent:'flex-end'}}>
                <button onClick={()=>setEditing(t)} style={iconBtn} title="Rediger"><Icon name="edit-3" size={14} color={C.gray500}/></button>
                <button onClick={()=>deleteMember(t.id)} style={iconBtn} title="Slett"><Icon name="trash-2" size={14} color={C.red}/></button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {(editing || adding) && (
        <Modal open={true} onClose={()=>{setEditing(null); setAdding(false);}} title={editing ? 'Rediger teammedlem' : 'Nytt teammedlem'} width={520}>
          <TeamForm initial={editing || blank} onCancel={()=>{setEditing(null); setAdding(false);}}
            onSave={data => saveMember(data, editing?.id)}/>
        </Modal>
      )}
    </div>
  );
}

function TeamForm({ initial, onCancel, onSave }) {
  const [form, setForm] = useState({ epost:'', telefon:'', budsjett: 0, ...initial });
  const [err, setErr] = useState('');

  const autoInitials = (navn) => {
    const parts = navn.trim().split(/\s+/);
    if (parts.length === 0) return '';
    if (parts.length === 1) return parts[0].slice(0,2).toUpperCase();
    return (parts[0][0] + parts[parts.length-1][0]).toUpperCase();
  };

  const submit = e => {
    e.preventDefault();
    if (!form.navn.trim()) { setErr('Navn er påkrevd'); return; }
    if (form.budsjett && !(Number(form.budsjett) >= 0)) { setErr('Ugyldig budsjett'); return; }
    const initialer = (form.initialer||'').trim() || autoInitials(form.navn);
    onSave({
      navn: form.navn.trim(),
      rolle: (form.rolle||'').trim(),
      initialer,
      epost: (form.epost||'').trim(),
      telefon: (form.telefon||'').trim(),
      budsjett: Number(form.budsjett) || 0,
    });
  };
  return (
    <form onSubmit={submit} style={{display:'flex', flexDirection:'column', gap:12}}>
      <Input label="Navn *" value={form.navn} onChange={e=>setForm({...form, navn:e.target.value, initialer: form.initialer || autoInitials(e.target.value)})} error={err && !form.navn.trim() ? err : ''}/>
      <Input label="Rolle" value={form.rolle} onChange={e=>setForm({...form, rolle:e.target.value})} placeholder="f.eks. Rådgiver"/>
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
        <Input label="E-post" type="email" value={form.epost} onChange={e=>setForm({...form, epost:e.target.value})} placeholder="navn@ressurstromso.no"/>
        <Input label="Telefon" value={form.telefon} onChange={e=>setForm({...form, telefon:e.target.value})}/>
      </div>
      <div style={{display:'grid', gridTemplateColumns:'120px 1fr', gap:12}}>
        <Input label="Initialer" value={form.initialer} onChange={e=>setForm({...form, initialer:e.target.value.toUpperCase().slice(0,3)})} placeholder="Auto"/>
        <Input label="Årsbudsjett (kr)" type="number" min="0" step="10000" value={form.budsjett} onChange={e=>setForm({...form, budsjett: e.target.value})} placeholder="f.eks. 500000"/>
      </div>
      <div style={{fontSize:12, color:C.gray500, marginTop:-4}}>
        Brukes til å måle resultat vs budsjett på oversiktssiden og i månedsrapporten. Sett til 0 for ansatte uten salgsmål.
      </div>
      {err && form.navn.trim() && <div style={{fontSize:12, color:C.red}}>{err}</div>}
      <div style={{display:'flex', justifyContent:'flex-end', gap:8, marginTop:6}}>
        <Button variant="secondary" type="button" onClick={onCancel}>Avbryt</Button>
        <Button variant="primary" type="submit">Lagre</Button>
      </div>
    </form>
  );
}

// ── Selskap ─────────────────────────────────────────────────
function SelskapSection({ selskap, setSelskap }) {
  const [form, setForm] = useState(selskap);
  const [saved, setSaved] = useState(false);
  const upd = (k, v) => setForm(f => ({...f, [k]:v}));
  const submit = (e) => {
    e.preventDefault();
    setSelskap(form);
    setSaved(true);
    setTimeout(()=>setSaved(false), 2000);
  };
  return (
    <Card>
      <div style={{fontSize:15, fontWeight:700, color:C.navy, marginBottom:6}}>Selskapsinformasjon</div>
      <div style={{fontSize:13, color:C.gray500, marginBottom:18, lineHeight:1.5}}>
        Brukes som avsender i tilbud og rapporter. Endringer her treffer alle dokumenter som genereres etter lagring.
      </div>
      <form onSubmit={submit} style={{display:'flex', flexDirection:'column', gap:12}}>
        <div style={{display:'grid', gridTemplateColumns:'2fr 1fr', gap:12}}>
          <Input label="Firmanavn" value={form.navn||''} onChange={e=>upd('navn', e.target.value)}/>
          <Input label="Organisasjonsnummer" value={form.orgnr||''} onChange={e=>upd('orgnr', e.target.value)}/>
        </div>
        <Input label="Adresse" value={form.adresse||''} onChange={e=>upd('adresse', e.target.value)} placeholder="Gateadresse"/>
        <div style={{display:'grid', gridTemplateColumns:'140px 1fr', gap:12}}>
          <Input label="Postnummer" value={form.postnr||''} onChange={e=>upd('postnr', e.target.value)}/>
          <Input label="Poststed" value={form.poststed||''} onChange={e=>upd('poststed', e.target.value)}/>
        </div>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
          <Input label="E-post" type="email" value={form.epost||''} onChange={e=>upd('epost', e.target.value)}/>
          <Input label="Telefon" value={form.telefon||''} onChange={e=>upd('telefon', e.target.value)}/>
        </div>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
          <Input label="Webside" value={form.web||''} onChange={e=>upd('web', e.target.value)}/>
          <Input label="Bankkontonummer" value={form.bankkonto||''} onChange={e=>upd('bankkonto', e.target.value)}/>
        </div>
        <div style={{display:'flex', justifyContent:'flex-end', gap:10, alignItems:'center', marginTop:8}}>
          {saved && <span style={{fontSize:13, color:C.green, fontWeight:600}}><Icon name="check" size={14}/> Lagret</span>}
          <Button variant="primary" type="submit" icon="save">Lagre selskapsinfo</Button>
        </div>
      </form>
    </Card>
  );
}

// ── Avtalemal ───────────────────────────────────────────────
function AvtalemalSection({ avtalemal, setAvtalemal }) {
  const [text, setText] = useState(avtalemal);
  const [saved, setSaved] = useState(false);
  const submit = e => {
    e.preventDefault();
    setAvtalemal(text);
    setSaved(true);
    setTimeout(()=>setSaved(false), 2000);
  };
  const resetTilStandard = () => {
    if (!confirm('Tilbakestille avtalemalen til standardteksten? Endringer du har gjort vil gå tapt.')) return;
    setText(window.SEED.avtalemal);
  };

  return (
    <Card>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14, gap:20, flexWrap:'wrap'}}>
        <div>
          <div style={{fontSize:15, fontWeight:700, color:C.navy, marginBottom:6}}>Standard avtalevilkår</div>
          <div style={{fontSize:13, color:C.gray500, lineHeight:1.5, maxWidth:680}}>
            Teksten flettes inn nederst i tilbud der pakken er merket med «Inkluder standardvilkår». Plassholdere som
            {' '}<code style={{background:C.gray100, padding:'1px 5px', borderRadius:3, fontSize:12}}>{'{{KUNDE_NAVN}}'}</code>,
            {' '}<code style={{background:C.gray100, padding:'1px 5px', borderRadius:3, fontSize:12}}>{'{{KUNDE_ORGNR}}'}</code>,
            {' '}<code style={{background:C.gray100, padding:'1px 5px', borderRadius:3, fontSize:12}}>{'{{KUNDE_ADRESSE}}'}</code>,
            {' '}<code style={{background:C.gray100, padding:'1px 5px', borderRadius:3, fontSize:12}}>{'{{BESTILLERNUMMER}}'}</code>,
            {' '}<code style={{background:C.gray100, padding:'1px 5px', borderRadius:3, fontSize:12}}>{'{{LEVERANSEBESKRIVELSE}}'}</code> og
            {' '}<code style={{background:C.gray100, padding:'1px 5px', borderRadius:3, fontSize:12}}>{'{{PAKKEPRIS}}'}</code> erstattes automatisk.
          </div>
        </div>
        <Button variant="ghost" type="button" icon="rotate-ccw" size="sm" onClick={resetTilStandard}>Tilbakestill</Button>
      </div>

      <form onSubmit={submit}>
        <textarea value={text} onChange={e=>setText(e.target.value)} style={{
          width:'100%', minHeight:480, padding:'14px 16px',
          border:`1.5px solid ${C.gray200}`, borderRadius:7,
          fontFamily:'ui-monospace, "SF Mono", Menlo, Consolas, monospace', fontSize:13, lineHeight:1.6,
          color:C.gray900, background:'#fff', outline:'none', resize:'vertical',
        }}/>
        <div style={{display:'flex', justifyContent:'flex-end', gap:10, alignItems:'center', marginTop:12}}>
          {saved && <span style={{fontSize:13, color:C.green, fontWeight:600}}><Icon name="check" size={14}/> Lagret</span>}
          <Button variant="primary" type="submit" icon="save">Lagre avtalemal</Button>
        </div>
      </form>
    </Card>
  );
}

// ── Fargeforklaring ──────────────────────────────────────────
function FargerSection() {
  return (
    <div>
      <Card padding={0}>
        <div style={{padding:'16px 22px', borderBottom:`1px solid ${C.gray100}`}}>
          <div style={{fontSize:15, fontWeight:700, color:C.navy}}>Framdriftsstatuser</div>
          <div style={{fontSize:12, color:C.gray500, marginTop:2}}>Visningshjelp — fargene gjenbrukes på badges, statusoversikt og oppfølginger.</div>
        </div>
        <div style={{padding:'18px 22px', display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px, 1fr))', gap:12}}>
          {STATUS_LISTE.map(s => {
            const c = STATUS_FARGER[s];
            return (
              <div key={s} style={{display:'flex', alignItems:'center', gap:12, padding:'12px', background:c.bg, borderRadius:8, borderLeft:`4px solid ${c.accent}`}}>
                <span style={{width:14, height:14, borderRadius:'50%', background:c.accent}}/>
                <div>
                  <div style={{fontSize:13, fontWeight:600, color:c.fg}}>{s}</div>
                  <div style={{fontSize:10, color:c.fg, opacity:0.7, marginTop:2, fontFamily:'monospace'}}>{c.accent}</div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card padding={0} style={{marginTop:16}}>
        <div style={{padding:'16px 22px', borderBottom:`1px solid ${C.gray100}`}}>
          <div style={{fontSize:15, fontWeight:700, color:C.navy}}>Aktivitetstyper</div>
          <div style={{fontSize:12, color:C.gray500, marginTop:2}}>Slik vises de ulike aktivitetene i tidslinjen.</div>
        </div>
        <div style={{padding:'18px 22px', display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px, 1fr))', gap:12}}>
          {Object.entries(AKTIVITETSTYPER).filter(([k])=>k!=='lead-mottatt').map(([k, meta]) => (
            <div key={k} style={{display:'flex', alignItems:'center', gap:12, padding:'12px', background:meta.bg, borderRadius:8}}>
              <div style={{width:32, height:32, borderRadius:8, background:'#fff', display:'flex', alignItems:'center', justifyContent:'center'}}>
                <Icon name={meta.icon} size={16} color={meta.color}/>
              </div>
              <div>
                <div style={{fontSize:13, fontWeight:600, color:meta.color}}>{meta.label}</div>
                {meta.highlight && <div style={{fontSize:10, color:meta.color, opacity:0.8, marginTop:2}}>Fremhevet</div>}
                {meta.note && <div style={{fontSize:10, color:meta.color, opacity:0.8, marginTop:2}}>Veiledningsnotat</div>}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ── Data / Reset ─────────────────────────────────────────────
function DataSection() {
  const [confirming, setConfirming] = useState(false);
  return (
    <Card>
      <div style={{fontSize:15, fontWeight:700, color:C.navy, marginBottom:6}}>Eksempeldata</div>
      <div style={{fontSize:13, color:C.gray500, marginBottom:16, lineHeight:1.5, maxWidth:560}}>
        Nullstill all data i appen og last inn eksempeldataene på nytt. Dette sletter alle kunder, aktiviteter, pakker, teammedlemmer og tilbud du har lagt til.
      </div>
      <Button variant="danger" icon="rotate-ccw" onClick={()=>setConfirming(true)}>Nullstill til eksempeldata</Button>

      <Modal open={confirming} onClose={()=>setConfirming(false)} title="Nullstille data?" width={440}>
        <div style={{fontSize:14, color:C.gray700, lineHeight:1.55, marginBottom:18}}>
          Alle endringer du har gjort vil bli slettet. Appen vil bli lastet inn på nytt med originale eksempeldata.
          <div style={{marginTop:10, padding:'10px 12px', background:'#fbe6e6', color:C.red, borderRadius:6, fontSize:13, fontWeight:600}}>
            Denne handlingen kan ikke angres.
          </div>
        </div>
        <div style={{display:'flex', justifyContent:'flex-end', gap:8}}>
          <Button variant="secondary" onClick={()=>setConfirming(false)}>Avbryt</Button>
          <Button variant="danger" icon="trash-2" onClick={resetStore}>Ja, nullstill</Button>
        </div>
      </Modal>
    </Card>
  );
}

const iconBtn = {
  width:30, height:30, borderRadius:6, border:`1px solid ${C.gray200}`,
  background:'#fff', cursor:'pointer', display:'inline-flex', alignItems:'center', justifyContent:'center', padding:0,
};

window.Innstillinger = Innstillinger;
