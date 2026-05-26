// ============================================================
// TILBUD — Bygger (modal) + Visning (printbar) + historikk
// ============================================================

const TILBUD_STATUS = {
  'Utkast':     { color: C.gray500, bg: C.gray100, icon:'file-text' },
  'Sendt':      { color: C.amber,   bg: '#fef4e3', icon:'send' },
  'Akseptert':  { color: C.green,   bg: '#e8f7e6', icon:'check-circle-2' },
  'Avslått':    { color: C.red,     bg: '#fbe6e6', icon:'x-circle' },
};

// ============================================================
// TILBUDSBYGGER — Modal
// ============================================================
function TilbudBuilder({ state, setState, kunde, onClose, onSaved }) {
  const { pakker, team, nesteTilbudsnr } = state;

  const [pakkeId, setPakkeId] = useState(kunde.pakkeId || pakker[0]?.id || '');
  const valgtPakke = pakker.find(p => p.id === pakkeId);

  // Snapshot av pakken inn i utkastet — endringer kun for dette tilbudet
  const [form, setForm] = useState(() => buildDraft(valgtPakke, kunde, team, nesteTilbudsnr));
  const [section, setSection] = useState('grunninfo'); // grunninfo|program|tillegg|pris

  // Når pakke endres, rebygg utkast (men behold bestillernummer + utstedtAv)
  const onPakkeChange = (id) => {
    setPakkeId(id);
    const p = pakker.find(x => x.id === id);
    setForm(prev => ({
      ...buildDraft(p, kunde, team, nesteTilbudsnr),
      utstedtAv: prev.utstedtAv,
      bestillernummer: prev.bestillernummer,
    }));
  };

  const upd = (k, v) => setForm(f => ({...f, [k]:v}));

  // Møte-redigering (kun for dette tilbudet)
  const updMøte = (id, patch) => upd('møter', form.møter.map(m => m.id===id ? {...m, ...patch} : m));
  const delMøte = (id) => { if (confirm('Fjerne møtet fra dette tilbudet?')) upd('møter', form.møter.filter(m => m.id!==id)); };
  const addMøte = () => upd('møter', [...form.møter, {
    id:'m'+Date.now(), fase:'', møtenr: form.møter.length+1,
    forarbeidT:0, møteT:1, etterarbeidT:0, innhold:'', hjemmeoppgave:'',
  }]);
  const moveMøte = (id, dir) => {
    const arr = [...form.møter];
    const i = arr.findIndex(m => m.id===id); const j = i + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    arr.forEach((m, idx) => m.møtenr = idx+1);
    upd('møter', arr);
  };

  // Tillegg
  const addTillegg = () => upd('tillegg', [...form.tillegg, { id:'a'+Date.now(), navn:'', pris:0 }]);
  const updTillegg = (id, patch) => upd('tillegg', form.tillegg.map(t => t.id===id ? {...t, ...patch} : t));
  const delTillegg = (id) => upd('tillegg', form.tillegg.filter(t => t.id!==id));

  const totalTimer = form.møter.reduce((s,m) => s + møteTimer(m), 0);
  const tilleggSum = form.tillegg.reduce((s,t) => s + (Number(t.pris)||0), 0);
  const totalEksMva = Number(form.pris) + tilleggSum;
  const mva = form.mvaFritak ? 0 : Math.round(totalEksMva * 0.25);
  const totalInkl = totalEksMva + mva;

  const save = (markerSomSendt) => {
    if (!valgtPakke) { alert('Velg en pakke først'); return; }
    if (!form.gyldigTil) { alert('Sett gyldighetsdato'); return; }
    const nyttTilbud = {
      ...form,
      id: 'tilbud_'+Date.now(),
      tilbudsnr: form.tilbudsnr,
      kundeId: kunde.id,
      pakkeId: valgtPakke.id,
      pakkeNavn: valgtPakke.navn,
      pris: Number(form.pris)||0,
      timepris: Number(form.timepris)||0,
      status: markerSomSendt ? 'Sendt' : 'Utkast',
      opprettet: TODAY,
      sendt: markerSomSendt ? TODAY : null,
    };

    setState(s => {
      const next = {
        ...s,
        tilbud: [...(s.tilbud||[]), nyttTilbud],
        nesteTilbudsnr: (s.nesteTilbudsnr||1) + 1,
      };
      if (markerSomSendt) {
        // Legg til tilbud_sendt aktivitet + oppdater status
        const akt = {
          id: Math.random().toString(36).slice(2, 10),
          type: 'tilbud_sendt',
          dato: TODAY,
          tittel: `Tilbud sendt — ${valgtPakke.navn}`,
          notat: `Tilbudsnr ${nyttTilbud.tilbudsnr}. Gyldig til ${formatDateShort(form.gyldigTil)}.`,
          loggetAv: form.utstedtAv || team[0]?.navn || '',
          beløp: Number(form.pris)||0,
          tilbudId: nyttTilbud.id,
        };
        next.kunder = s.kunder.map(k => k.id !== kunde.id ? k : ({
          ...k,
          aktiviteter: [...k.aktiviteter, akt],
          sistKontakt: TODAY,
          status: (k.status === 'Lead' || k.status === 'Kontaktet' || k.status === 'Behovskartlagt') ? 'Tilbud sendt' : k.status,
        }));
      }
      return next;
    });

    onSaved(nyttTilbud.id);
  };

  const sections = [
    {id:'grunninfo', label:'Grunninfo'},
    {id:'program',   label:`Program (${form.møter.length})`},
    {id:'tillegg',   label:`Tillegg (${form.tillegg.length})`},
    {id:'pris',      label:'Pris & vilkår'},
  ];

  return (
    <Modal open={true} onClose={onClose} title={`Nytt tilbud — ${kunde.bedriftsnavn}`} width={920}>
      {/* Pakkevelger på toppen */}
      <div style={{padding:'12px 14px', background:C.gray50, borderRadius:8, marginBottom:14, display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, alignItems:'end'}}>
        <Select label="Pakke *" value={pakkeId} onChange={e=>onPakkeChange(e.target.value)}
          options={pakker.map(p=>({value:p.id, label:p.navn}))}/>
        <Input label="Tilbudsnummer" value={form.tilbudsnr} onChange={e=>upd('tilbudsnr', e.target.value)}/>
        <Select label="Utstedt av" value={form.utstedtAv} onChange={e=>upd('utstedtAv', e.target.value)}
          options={team.map(t=>({value:t.navn, label:t.navn}))}/>
      </div>

      {/* Section nav */}
      <div style={{display:'flex', gap:4, marginBottom:14, borderBottom:`1px solid ${C.gray100}`}}>
        {sections.map(s => (
          <button key={s.id} type="button" onClick={()=>setSection(s.id)} style={{
            background:'transparent', border:'none', cursor:'pointer', fontFamily:'inherit',
            padding:'8px 14px', fontSize:13,
            fontWeight: section===s.id ? 600 : 500,
            color: section===s.id ? C.navy : C.gray500,
            borderBottom: `2px solid ${section===s.id ? C.navy : 'transparent'}`, marginBottom: -1,
          }}>{s.label}</button>
        ))}
      </div>

      {section === 'grunninfo' && (
        <div style={{display:'flex', flexDirection:'column', gap:12}}>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
            <Input label="Tilbudsdato" type="date" value={form.dato} onChange={e=>upd('dato', e.target.value)}/>
            <Input label="Gyldig til" type="date" value={form.gyldigTil} onChange={e=>upd('gyldigTil', e.target.value)}/>
          </div>
          <Input label="Bestillernummer / merking faktura" value={form.bestillernummer} onChange={e=>upd('bestillernummer', e.target.value)}
            placeholder="Valgfritt — fylles inn hvis kunde krever det"/>
          <Textarea label="Innledning" value={form.innledning} onChange={e=>upd('innledning', e.target.value)} rows={5}/>
          <Textarea label="Leveransebeskrivelse (inn i avtaleteksten)" value={form.leveransebeskrivelse}
            onChange={e=>upd('leveransebeskrivelse', e.target.value)} rows={2}
            placeholder="Kort beskrivelse av hva som leveres — flettes inn der det står «{{LEVERANSEBESKRIVELSE}}»."/>
          <Textarea label="Internt notat (vises ikke i tilbudet)" value={form.internNotat} onChange={e=>upd('internNotat', e.target.value)} rows={2}/>
        </div>
      )}

      {section === 'program' && (
        <div>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10}}>
            <div style={{fontSize:13, color:C.gray500}}>Tilpass programmet for denne kunden. Endringer treffer kun dette tilbudet.</div>
            <div style={{fontSize:12, color:C.gray500}}>Totalt: <span style={{fontWeight:700, color:C.navy}}>{totalTimer} t</span></div>
          </div>
          <div style={{display:'flex', flexDirection:'column', gap:10}}>
            {form.møter.map((m, i) => (
              <MøteRowTilbud key={m.id} m={m} i={i} total={form.møter.length}
                onUpd={p=>updMøte(m.id, p)} onDel={()=>delMøte(m.id)} onMove={d=>moveMøte(m.id, d)}/>
            ))}
          </div>
          <Button variant="secondary" type="button" icon="plus" onClick={addMøte} style={{marginTop:12}}>Legg til møte</Button>
        </div>
      )}

      {section === 'tillegg' && (
        <div>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10}}>
            <div style={{fontSize:13, color:C.gray500}}>Lisenser, materiell og annet som faktureres i tillegg.</div>
            <div style={{fontSize:12, color:C.gray500}}>Sum: <span style={{fontWeight:700, color:C.navy}}>{formatKr(tilleggSum)}</span></div>
          </div>
          <div style={{display:'flex', flexDirection:'column', gap:8}}>
            {form.tillegg.length === 0 && (
              <div style={{padding:'24px', textAlign:'center', color:C.gray400, fontSize:13, background:C.gray50, borderRadius:8}}>
                Ingen tillegg på dette tilbudet.
              </div>
            )}
            {form.tillegg.map(t => (
              <div key={t.id} style={{display:'grid', gridTemplateColumns:'1fr 140px 36px', gap:8, alignItems:'end'}}>
                <Input label="Navn" value={t.navn} onChange={e=>updTillegg(t.id, {navn:e.target.value})}/>
                <Input label="Pris (kr)" type="number" value={t.pris} onChange={e=>updTillegg(t.id, {pris:Number(e.target.value)||0})}/>
                <button type="button" onClick={()=>delTillegg(t.id)} style={{...iconBtnTilbud, marginBottom:1}}><Icon name="trash-2" size={14} color={C.red}/></button>
              </div>
            ))}
          </div>
          <Button variant="secondary" type="button" icon="plus" onClick={addTillegg} style={{marginTop:12}}>Legg til tillegg</Button>
        </div>
      )}

      {section === 'pris' && (
        <div style={{display:'flex', flexDirection:'column', gap:14}}>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12}}>
            <Input label="Timepris rådgiver (kr)" type="number" value={form.timepris} onChange={e=>upd('timepris', e.target.value)}/>
            <Input label="Pakkepris (kr, eks. mva.)" type="number" value={form.pris} onChange={e=>upd('pris', e.target.value)}/>
            <Select label="MVA" value={form.mvaFritak ? 'fritak' : 'standard'}
              onChange={e=>upd('mvaFritak', e.target.value==='fritak')}
              options={[{value:'standard', label:'25% standard'}, {value:'fritak', label:'Fritak'}]}/>
          </div>
          <div style={{padding:'14px 16px', background:C.gray50, borderRadius:8, fontSize:13, lineHeight:1.7}}>
            <div style={{display:'grid', gridTemplateColumns:'1fr auto', gap:8}}>
              <div>Pakkepris</div><div style={{textAlign:'right', fontWeight:600}}>{formatKr(form.pris)}</div>
              <div>+ Tillegg</div><div style={{textAlign:'right', fontWeight:600}}>{formatKr(tilleggSum)}</div>
              <div style={{paddingTop:6, borderTop:`1px solid ${C.gray200}`}}>Sum eks. mva.</div><div style={{textAlign:'right', paddingTop:6, borderTop:`1px solid ${C.gray200}`, fontWeight:700}}>{formatKr(totalEksMva)}</div>
              <div>{form.mvaFritak ? 'MVA (fritak)' : 'MVA 25%'}</div><div style={{textAlign:'right', fontWeight:600}}>{formatKr(mva)}</div>
              <div style={{paddingTop:6, borderTop:`1px solid ${C.gray200}`, fontWeight:700, color:C.navy}}>Total inkl. mva.</div><div style={{textAlign:'right', paddingTop:6, borderTop:`1px solid ${C.gray200}`, fontWeight:700, color:C.navy}}>{formatKr(totalInkl)}</div>
            </div>
          </div>
          <Textarea label="Betalingsbetingelser" value={form.betalingsbetingelser} onChange={e=>upd('betalingsbetingelser', e.target.value)} rows={2}/>
          <label style={{display:'flex', alignItems:'center', gap:10, padding:'10px 12px', background:C.gray50, borderRadius:8, cursor:'pointer'}}>
            <input type="checkbox" checked={!!form.bruker_standardvilkår} onChange={e=>upd('bruker_standardvilkår', e.target.checked)}
              style={{width:16, height:16, accentColor:C.navy, cursor:'pointer'}}/>
            <div>
              <div style={{fontSize:13, fontWeight:600, color:C.navy}}>Inkluder standardvilkår på slutten av tilbudet</div>
              <div style={{fontSize:11, color:C.gray500, marginTop:2}}>Full avtaletekst med flettede kundeopplysninger.</div>
            </div>
          </label>
        </div>
      )}

      {/* Footer */}
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', gap:10, marginTop:18, paddingTop:14, borderTop:`1px solid ${C.gray100}`}}>
        <div style={{fontSize:12, color:C.gray500}}>
          {form.møter.length} møter · {totalTimer} t · <span style={{fontWeight:700, color:C.navy}}>{formatKr(totalInkl)}</span> inkl. mva.
        </div>
        <div style={{display:'flex', gap:8}}>
          <Button variant="secondary" type="button" onClick={onClose}>Avbryt</Button>
          <Button variant="secondary" type="button" icon="file-text" onClick={()=>save(false)}>Lagre som utkast</Button>
          <Button variant="primary" type="button" icon="send" onClick={()=>save(true)}>Lagre & marker sendt</Button>
        </div>
      </div>
    </Modal>
  );
}

// Bygg et utkast med standardverdier fra pakke + kunde
function buildDraft(pakke, kunde, team, nesteTilbudsnr) {
  const today = parseISO(TODAY);
  const gyldig = new Date(today.getFullYear(), today.getMonth(), today.getDate()+30);
  const utstedt = team[0]?.navn || '';

  if (!pakke) return {
    tilbudsnr: `TIL-${today.getFullYear()}-${String(nesteTilbudsnr).padStart(3,'0')}`,
    dato: TODAY, gyldigTil: toISO(gyldig), utstedtAv: utstedt,
    innledning:'', leveransebeskrivelse:'', bestillernummer:'', internNotat:'',
    møter:[], tillegg:[], timepris:0, pris:0, mvaFritak:false,
    bruker_standardvilkår:true, betalingsbetingelser:'',
  };

  return {
    tilbudsnr: `TIL-${today.getFullYear()}-${String(nesteTilbudsnr).padStart(3,'0')}`,
    dato: TODAY, gyldigTil: toISO(gyldig), utstedtAv: utstedt,
    innledning: pakke.innledning || pakke.beskrivelse || '',
    leveransebeskrivelse: `${pakke.navn}, beskrevet i dialog og gjennom informasjon på www.ressurstromso.no`,
    bestillernummer: '', internNotat: '',
    møter: JSON.parse(JSON.stringify(pakke.møter || [])),
    tillegg: JSON.parse(JSON.stringify(pakke.tillegg || [])),
    timepris: pakke.timepris || 0,
    pris: pakke.pris || 0,
    mvaFritak: !!pakke.mvaFritak,
    bruker_standardvilkår: pakke.bruker_standardvilkår !== false,
    betalingsbetingelser: pakke.betalingsbetingelser || 'Faktureres etterskuddsvis per måned. Forfall 14 kalenderdager.',
  };
}

function MøteRowTilbud({ m, i, total, onUpd, onDel, onMove }) {
  const [open, setOpen] = useState(false);
  const totT = møteTimer(m);
  return (
    <div style={{border:`1px solid ${C.gray200}`, borderRadius:8, background:'#fff'}}>
      <div style={{padding:'10px 12px', display:'grid', gridTemplateColumns:'auto 1fr auto auto', gap:10, alignItems:'center'}}>
        <div style={{
          width:28, height:28, borderRadius:'50%', background:C.navy, color:'#fff',
          fontSize:12, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center',
        }}>{m.møtenr || i+1}</div>
        <div style={{minWidth:0}}>
          <input value={m.fase} onChange={e=>onUpd({fase:e.target.value})}
            placeholder="Fase / tittel"
            style={{width:'100%', border:'none', outline:'none', background:'transparent',
              fontSize:14, fontWeight:600, color:C.navy, fontFamily:'inherit', padding:0}}/>
          <div style={{fontSize:11, color:C.gray500, marginTop:2}}>Møte {m.møtenr || i+1} · {totT} t</div>
        </div>
        <div style={{display:'flex', gap:4}}>
          <button type="button" onClick={()=>onMove(-1)} disabled={i===0} style={{...iconBtnTilbud, opacity:i===0?0.3:1}}><Icon name="chevron-up" size={13} color={C.gray500}/></button>
          <button type="button" onClick={()=>onMove(1)} disabled={i===total-1} style={{...iconBtnTilbud, opacity:i===total-1?0.3:1}}><Icon name="chevron-down" size={13} color={C.gray500}/></button>
        </div>
        <div style={{display:'flex', gap:4}}>
          <button type="button" onClick={()=>setOpen(o=>!o)} style={iconBtnTilbud}><Icon name={open?'chevron-up':'edit-3'} size={13} color={C.gray500}/></button>
          <button type="button" onClick={onDel} style={iconBtnTilbud}><Icon name="trash-2" size={13} color={C.red}/></button>
        </div>
      </div>
      {open && (
        <div style={{padding:'4px 12px 12px', borderTop:`1px solid ${C.gray100}`, display:'flex', flexDirection:'column', gap:10}}>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginTop:10}}>
            <Input label="Forarbeid (t)" type="number" step="0.5" value={m.forarbeidT} onChange={e=>onUpd({forarbeidT:Number(e.target.value)||0})}/>
            <Input label="Møte (t)" type="number" step="0.5" value={m.møteT} onChange={e=>onUpd({møteT:Number(e.target.value)||0})}/>
            <Input label="Etterarbeid (t)" type="number" step="0.5" value={m.etterarbeidT} onChange={e=>onUpd({etterarbeidT:Number(e.target.value)||0})}/>
          </div>
          <Textarea label="Innhold (én linje per punkt)" value={m.innhold} onChange={e=>onUpd({innhold:e.target.value})} rows={4}/>
          <Input label="Hjemmeoppgave" value={m.hjemmeoppgave} onChange={e=>onUpd({hjemmeoppgave:e.target.value})}/>
        </div>
      )}
    </div>
  );
}

const iconBtnTilbud = {
  width:28, height:28, borderRadius:6, border:`1px solid ${C.gray200}`,
  background:'#fff', cursor:'pointer', display:'inline-flex', alignItems:'center', justifyContent:'center', padding:0,
};

// ============================================================
// TILBUDSVISNING — printbar A4-side
// ============================================================
function TilbudVisning({ state, setState, navigate, tilbudId }) {
  const tilbud = (state.tilbud || []).find(t => t.id === tilbudId);
  if (!tilbud) {
    return (
      <div style={{padding:40, textAlign:'center'}}>
        <div style={{fontSize:16, color:C.gray500, marginBottom:16}}>Fant ikke tilbudet.</div>
        <Button variant="primary" onClick={() => navigate('kunder')}>Tilbake til kunder</Button>
      </div>
    );
  }

  const kunde = state.kunder.find(k => k.id === tilbud.kundeId);
  const selskap = state.selskap || {};
  const status = TILBUD_STATUS[tilbud.status] || TILBUD_STATUS.Utkast;

  const oppdaterStatus = (nyStatus) => {
    if (!confirm(`Endre status til «${nyStatus}»?`)) return;
    setState(s => {
      const next = {
        ...s,
        tilbud: s.tilbud.map(t => t.id===tilbud.id ? {...t, status:nyStatus, [statusFelt(nyStatus)]: TODAY} : t),
      };
      // Speil til kunde-tidslinjen + pipeline-status
      const aktType = nyStatus === 'Sendt' ? 'tilbud_sendt' : nyStatus === 'Akseptert' ? 'tilbud_akseptert' : nyStatus === 'Avslått' ? 'tilbud_avslått' : null;
      if (aktType) {
        const akt = {
          id: Math.random().toString(36).slice(2, 10),
          type: aktType, dato: TODAY,
          tittel: `${nyStatus} — ${tilbud.pakkeNavn} (${tilbud.tilbudsnr})`,
          notat: '',
          loggetAv: tilbud.utstedtAv || '',
          beløp: tilbud.pris,
          tilbudId: tilbud.id,
        };
        next.kunder = s.kunder.map(k => k.id !== kunde.id ? k : ({
          ...k,
          aktiviteter: [...k.aktiviteter, akt],
          sistKontakt: TODAY,
          status: nyStatus === 'Akseptert' ? 'Vunnet'
                : nyStatus === 'Avslått'   ? 'Tapt'
                : nyStatus === 'Sendt' && (k.status === 'Lead' || k.status === 'Kontaktet' || k.status === 'Behovskartlagt') ? 'Tilbud sendt'
                : k.status,
        }));
      }
      return next;
    });
  };

  const slett = () => {
    if (!confirm(`Slette tilbud ${tilbud.tilbudsnr}? Aktivitetene i kundens tidslinje blir stående.`)) return;
    setState(s => ({...s, tilbud: s.tilbud.filter(t => t.id !== tilbud.id)}));
    navigate('kundeprofil', { kundeId: kunde.id });
  };

  const print = () => window.print();

  const tilleggSum = (tilbud.tillegg||[]).reduce((s,t) => s + (Number(t.pris)||0), 0);
  const totalEksMva = (Number(tilbud.pris)||0) + tilleggSum;
  const mva = tilbud.mvaFritak ? 0 : Math.round(totalEksMva * 0.25);
  const totalInkl = totalEksMva + mva;
  const totalTimer = (tilbud.møter||[]).reduce((s,m)=>s+møteTimer(m), 0);

  // Avtaletekst med fletting
  const avtaleFlettet = tilbud.bruker_standardvilkår ? flettAvtalemal(state.avtalemal, {
    KUNDE_NAVN: kunde?.bedriftsnavn || '',
    KUNDE_ORGNR: kunde?.orgnr || '',
    KUNDE_ADRESSE: kunde?.adresse || '',
    BESTILLERNUMMER: tilbud.bestillernummer || '',
    LEVERANSEBESKRIVELSE: tilbud.leveransebeskrivelse || tilbud.pakkeNavn,
    PAKKEPRIS: formatKr(tilbud.pris).replace(' kr', ',-'),
  }) : '';

  return (
    <div style={{padding:'24px 32px', maxWidth:1100, margin:'0 auto'}}>
      {/* Toolbar — skjules på utskrift */}
      <div className="no-print" style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16, gap:12, flexWrap:'wrap'}}>
        <button onClick={() => navigate('kundeprofil', { kundeId: kunde?.id })} style={{
          background:'none', border:'none', cursor:'pointer', color:C.gray500,
          fontSize:13, fontFamily:'inherit', display:'inline-flex', alignItems:'center', gap:6, padding:0,
        }}>
          <Icon name="arrow-left" size={14}/> Tilbake til {kunde?.bedriftsnavn || 'kunde'}
        </button>
        <div style={{display:'flex', gap:8, alignItems:'center', flexWrap:'wrap'}}>
          <span style={{
            display:'inline-flex', alignItems:'center', gap:6,
            padding:'5px 12px', borderRadius:9999,
            background: status.bg, color: status.color,
            fontSize:12, fontWeight:700, textTransform:'uppercase', letterSpacing:'.05em',
          }}>
            <Icon name={status.icon} size={12}/> {tilbud.status}
          </span>
          {tilbud.status === 'Utkast'    && <Button size="sm" variant="secondary" icon="send"            onClick={()=>oppdaterStatus('Sendt')}>Marker sendt</Button>}
          {tilbud.status === 'Sendt'     && <Button size="sm" variant="success"   icon="check-circle-2"  onClick={()=>oppdaterStatus('Akseptert')}>Marker akseptert</Button>}
          {tilbud.status === 'Sendt'     && <Button size="sm" variant="secondary" icon="x-circle"        onClick={()=>oppdaterStatus('Avslått')}>Marker avslått</Button>}
          <Button size="sm" variant="secondary" icon="trash-2" onClick={slett}>Slett</Button>
          <Button size="sm" variant="primary" icon="printer" onClick={print}>Skriv ut / lagre som PDF</Button>
        </div>
      </div>

      {/* Selve dokumentet */}
      <div className="report-area" style={{
        background:'#fff', borderRadius:10,
        boxShadow:'0 1px 3px rgba(22,39,61,0.06), 0 2px 8px rgba(22,39,61,0.04)',
        border:`1px solid ${C.gray100}`,
        padding:'42px 48px', color:C.navy,
      }}>
        {/* TOPP — selskap + tilbudsmeta */}
        <div style={{display:'grid', gridTemplateColumns:'1fr auto', gap:32, marginBottom:32, borderBottom:`3px solid ${C.navy}`, paddingBottom:18}}>
          <div>
            <img src="assets/Ressurs_R_bla.png" alt="Ressurs Kompetanse AS" style={{height:60, width:'auto', marginBottom:12, display:'block'}}/>
            <div style={{fontSize:18, fontWeight:700, color:C.navy}}>{selskap.navn || 'Ressurs Kompetanse AS'}</div>
            <div style={{fontSize:12, color:C.gray500, marginTop:4, lineHeight:1.6}}>
              {selskap.adresse && <div>{selskap.adresse}{selskap.postnr || selskap.poststed ? `, ${selskap.postnr||''} ${selskap.poststed||''}`.trim() : ''}</div>}
              <div>Org.nr {selskap.orgnr || '927 687 038'}</div>
              {(selskap.epost || selskap.telefon) && (
                <div>{selskap.epost}{selskap.epost && selskap.telefon ? ' · ' : ''}{selskap.telefon}</div>
              )}
              {selskap.web && <div>{selskap.web}</div>}
            </div>
          </div>
          <div style={{textAlign:'right'}}>
            <div style={{fontSize:11, fontWeight:700, color:C.gray500, textTransform:'uppercase', letterSpacing:'.12em', marginBottom:4}}>Tilbud</div>
            <div style={{fontSize:22, fontWeight:700, color:C.navy, letterSpacing:'-0.01em'}}>{tilbud.tilbudsnr}</div>
            <div style={{fontSize:12, color:C.gray500, marginTop:10, lineHeight:1.6}}>
              <div>Utstedt {formatDateLong(tilbud.dato)}</div>
              <div>Gyldig til {formatDateLong(tilbud.gyldigTil)}</div>
              {tilbud.utstedtAv && <div>Utstedt av {tilbud.utstedtAv}</div>}
              {tilbud.bestillernummer && <div>Bestillernr. {tilbud.bestillernummer}</div>}
            </div>
          </div>
        </div>

        {/* KUNDE */}
        <div style={{marginBottom:28}}>
          <div style={{fontSize:11, fontWeight:700, color:C.gray500, textTransform:'uppercase', letterSpacing:'.1em', marginBottom:6}}>Til</div>
          <div style={{fontSize:18, fontWeight:700, color:C.navy}}>{kunde?.bedriftsnavn || '–'}</div>
          <div style={{fontSize:13, color:C.gray700, marginTop:4, lineHeight:1.6}}>
            {kunde?.orgnr && <div>Org.nr {kunde.orgnr}</div>}
            {kunde?.adresse && <div>{kunde.adresse}</div>}
            {kunde?.kontakt?.navn && (
              <div style={{marginTop:6}}>Att: <strong style={{color:C.navy}}>{kunde.kontakt.navn}</strong>{kunde.kontakt.tittel ? `, ${kunde.kontakt.tittel}` : ''}</div>
            )}
            {kunde?.kontakt?.epost && <div>{kunde.kontakt.epost}{kunde.kontakt.telefon ? ` · ${kunde.kontakt.telefon}` : ''}</div>}
          </div>
        </div>

        {/* TITTEL */}
        <h2 style={{fontSize:26, fontWeight:700, color:C.navy, margin:'0 0 12px', letterSpacing:'-0.01em'}}>
          Tilbud — {tilbud.pakkeNavn}
        </h2>

        {/* INNLEDNING */}
        {tilbud.innledning && (
          <p style={{fontSize:14, color:C.gray700, lineHeight:1.65, margin:'0 0 24px', whiteSpace:'pre-wrap'}}>
            {tilbud.innledning}
          </p>
        )}

        {/* PROGRAM */}
        {(tilbud.møter||[]).length > 0 && (
          <section style={{marginBottom:28, pageBreakInside:'avoid'}}>
            <h3 style={{fontSize:14, fontWeight:700, color:C.navy, margin:'0 0 12px', textTransform:'uppercase', letterSpacing:'.08em'}}>Program</h3>
            <div style={{display:'flex', flexDirection:'column', gap:12}}>
              {tilbud.møter.map((m, i) => {
                const totT = møteTimer(m);
                const innholdLines = (m.innhold||'').split('\n').filter(l => l.trim());
                return (
                  <div key={m.id} style={{
                    display:'grid', gridTemplateColumns:'90px 1fr', gap:16,
                    paddingBottom:12, borderBottom: i<tilbud.møter.length-1 ? `1px solid ${C.gray100}` : 'none',
                  }}>
                    <div>
                      <div style={{fontSize:11, fontWeight:700, color:C.bright, textTransform:'uppercase', letterSpacing:'.08em'}}>Møte {m.møtenr || i+1}</div>
                      <div style={{fontSize:12, color:C.gray500, marginTop:6, lineHeight:1.5}}>
                        {m.forarbeidT > 0 && <div>Forarbeid: {m.forarbeidT} t</div>}
                        {m.møteT > 0 &&      <div>Møte: {m.møteT} t</div>}
                        {m.etterarbeidT > 0 && <div>Etterarbeid: {m.etterarbeidT} t</div>}
                        <div style={{marginTop:4, fontWeight:600, color:C.navy}}>Sum: {totT} t</div>
                      </div>
                    </div>
                    <div>
                      <div style={{fontSize:15, fontWeight:600, color:C.navy, marginBottom:8}}>{m.fase || `Møte ${m.møtenr || i+1}`}</div>
                      {innholdLines.length > 0 && (
                        <ul style={{margin:0, padding:'0 0 0 18px', fontSize:13, color:C.gray700, lineHeight:1.6}}>
                          {innholdLines.map((line, k) => <li key={k}>{line}</li>)}
                        </ul>
                      )}
                      {m.hjemmeoppgave && (
                        <div style={{marginTop:8, padding:'6px 10px', background:C.gray50, borderRadius:6, fontSize:12, color:C.gray700}}>
                          <strong style={{color:C.navy}}>Hjemmeoppgave:</strong> {m.hjemmeoppgave}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{marginTop:10, textAlign:'right', fontSize:12, color:C.gray500}}>
              Totalt program: <strong style={{color:C.navy}}>{totalTimer} timer</strong>
            </div>
          </section>
        )}

        {/* TILLEGG */}
        {(tilbud.tillegg||[]).length > 0 && (
          <section style={{marginBottom:24, pageBreakInside:'avoid'}}>
            <h3 style={{fontSize:14, fontWeight:700, color:C.navy, margin:'0 0 10px', textTransform:'uppercase', letterSpacing:'.08em'}}>Tillegg</h3>
            <table style={{width:'100%', borderCollapse:'collapse', fontSize:13}}>
              <tbody>
                {tilbud.tillegg.map(t => (
                  <tr key={t.id} style={{borderBottom:`1px solid ${C.gray100}`}}>
                    <td style={{padding:'8px 0', color:C.gray700}}>{t.navn}</td>
                    <td style={{padding:'8px 0', textAlign:'right', fontWeight:600, color:C.navy}}>{formatKr(t.pris)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {/* PRIS */}
        <section style={{marginBottom:24, pageBreakInside:'avoid'}}>
          <h3 style={{fontSize:14, fontWeight:700, color:C.navy, margin:'0 0 10px', textTransform:'uppercase', letterSpacing:'.08em'}}>Pris</h3>
          <table style={{width:'100%', borderCollapse:'collapse', fontSize:13}}>
            <tbody>
              <tr style={{borderBottom:`1px solid ${C.gray100}`}}>
                <td style={{padding:'8px 0', color:C.gray700}}>Pakkepris {tilbud.pakkeNavn}</td>
                <td style={{padding:'8px 0', textAlign:'right', fontWeight:600, color:C.navy}}>{formatKr(tilbud.pris)}</td>
              </tr>
              {tilleggSum > 0 && (
                <tr style={{borderBottom:`1px solid ${C.gray100}`}}>
                  <td style={{padding:'8px 0', color:C.gray700}}>Tillegg</td>
                  <td style={{padding:'8px 0', textAlign:'right', fontWeight:600, color:C.navy}}>{formatKr(tilleggSum)}</td>
                </tr>
              )}
              <tr style={{borderBottom:`1px solid ${C.gray200}`}}>
                <td style={{padding:'10px 0', color:C.gray700, fontWeight:600}}>Sum eks. mva.</td>
                <td style={{padding:'10px 0', textAlign:'right', fontWeight:700, color:C.navy}}>{formatKr(totalEksMva)}</td>
              </tr>
              <tr>
                <td style={{padding:'8px 0', color:C.gray700}}>{tilbud.mvaFritak ? 'MVA (fritak)' : 'MVA 25%'}</td>
                <td style={{padding:'8px 0', textAlign:'right', fontWeight:600, color:C.navy}}>{formatKr(mva)}</td>
              </tr>
              <tr style={{borderTop:`2px solid ${C.navy}`}}>
                <td style={{padding:'12px 0', color:C.navy, fontWeight:700, fontSize:15}}>Total inkl. mva.</td>
                <td style={{padding:'12px 0', textAlign:'right', fontWeight:700, color:C.navy, fontSize:18}}>{formatKr(totalInkl)}</td>
              </tr>
            </tbody>
          </table>
          {tilbud.timepris > 0 && (
            <div style={{fontSize:11, color:C.gray500, marginTop:8}}>
              Timepris rådgiver: {formatKr(tilbud.timepris)} eks. mva. Reisetid og utlegg etter avtale.
            </div>
          )}
        </section>

        {/* BETALINGSBETINGELSER */}
        {tilbud.betalingsbetingelser && (
          <section style={{marginBottom:24, pageBreakInside:'avoid'}}>
            <h3 style={{fontSize:14, fontWeight:700, color:C.navy, margin:'0 0 8px', textTransform:'uppercase', letterSpacing:'.08em'}}>Betalingsbetingelser</h3>
            <p style={{fontSize:13, color:C.gray700, lineHeight:1.65, margin:0, whiteSpace:'pre-wrap'}}>{tilbud.betalingsbetingelser}</p>
          </section>
        )}

        {/* STANDARDVILKÅR */}
        {tilbud.bruker_standardvilkår && avtaleFlettet && (
          <section style={{marginTop:32, paddingTop:24, borderTop:`2px solid ${C.gray200}`, pageBreakBefore:'always'}}>
            <pre style={{
              margin:0, padding:0,
              fontFamily:'inherit', fontSize:12, color:C.gray700, lineHeight:1.7,
              whiteSpace:'pre-wrap', wordWrap:'break-word',
            }}>{avtaleFlettet}</pre>
          </section>
        )}

        {/* SIGNATUR */}
        <section style={{marginTop:48, pageBreakInside:'avoid'}}>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:48}}>
            <div>
              <div style={{borderBottom:`1px solid ${C.navy}`, height:48}}/>
              <div style={{fontSize:11, color:C.gray500, marginTop:6}}>Sted og dato</div>
            </div>
            <div/>
          </div>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:48, marginTop:36}}>
            <div>
              <div style={{borderBottom:`1px solid ${C.navy}`, height:48}}/>
              <div style={{fontSize:11, color:C.gray500, marginTop:6}}>{selskap.navn || 'Ressurs Kompetanse AS'}</div>
            </div>
            <div>
              <div style={{borderBottom:`1px solid ${C.navy}`, height:48}}/>
              <div style={{fontSize:11, color:C.gray500, marginTop:6}}>{kunde?.bedriftsnavn || 'Kunde'}</div>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <div style={{marginTop:48, paddingTop:14, borderTop:`1px solid ${C.gray200}`, fontSize:10, color:C.gray400, display:'flex', justifyContent:'space-between'}}>
          <div>{selskap.navn || 'Ressurs Kompetanse AS'} · Org.nr {selskap.orgnr || '927 687 038'}</div>
          <div>{tilbud.tilbudsnr}</div>
        </div>
      </div>
    </div>
  );
}

function statusFelt(s) {
  return s === 'Sendt' ? 'sendt' : s === 'Akseptert' ? 'akseptert' : s === 'Avslått' ? 'avslått' : 'opprettet';
}

// ============================================================
// TILBUDSHISTORIKK — liste-snippet på kundeprofil
// ============================================================
function TilbudHistorikk({ state, kunde, navigate }) {
  const tilbud = (state.tilbud || []).filter(t => t.kundeId === kunde.id)
    .sort((a,b) => (b.dato||'').localeCompare(a.dato||''));

  if (tilbud.length === 0) return null;

  return (
    <Card padding={0} style={{marginBottom:20}}>
      <div style={{padding:'14px 22px', borderBottom:`1px solid ${C.gray100}`, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <div style={{fontSize:15, fontWeight:700, color:C.navy}}>Tilbud</div>
        <div style={{fontSize:12, color:C.gray500}}>{tilbud.length} {tilbud.length===1?'tilbud':'tilbud'} på denne kunden</div>
      </div>
      <div>
        {tilbud.map((t, i) => {
          const status = TILBUD_STATUS[t.status] || TILBUD_STATUS.Utkast;
          return (
            <button key={t.id} onClick={()=>navigate('tilbudview', { tilbudId: t.id })} style={{
              width:'100%', textAlign:'left', cursor:'pointer',
              padding:'14px 22px', display:'grid', gridTemplateColumns:'auto 1fr auto 130px auto',
              gap:16, alignItems:'center', background:'#fff', border:'none', fontFamily:'inherit',
              borderBottom: i < tilbud.length-1 ? `1px solid ${C.gray100}` : 'none',
            }}>
              <div style={{
                width:36, height:36, borderRadius:8, background: status.bg,
                display:'flex', alignItems:'center', justifyContent:'center',
              }}>
                <Icon name={status.icon} size={16} color={status.color}/>
              </div>
              <div>
                <div style={{fontSize:13, fontWeight:600, color:C.navy}}>{t.pakkeNavn}</div>
                <div style={{fontSize:11, color:C.gray500, marginTop:2}}>{t.tilbudsnr} · {formatDateShort(t.dato)} · gyldig til {formatDateShort(t.gyldigTil)}</div>
              </div>
              <span style={{
                fontSize:10, fontWeight:700, color: status.color, background: status.bg,
                padding:'3px 10px', borderRadius:9999, textTransform:'uppercase', letterSpacing:'.05em',
              }}>{t.status}</span>
              <div style={{textAlign:'right', fontSize:14, fontWeight:700, color:C.navy}}>{formatKr(t.pris)}</div>
              <Icon name="chevron-right" size={16} color={C.gray400}/>
            </button>
          );
        })}
      </div>
    </Card>
  );
}

Object.assign(window, { TilbudBuilder, TilbudVisning, TilbudHistorikk, TILBUD_STATUS });
