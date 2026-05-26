// ============================================================
// INTERN — Mandagsmøter, ideer og interne notater for teamet
// ============================================================

const NOTAT_TYPER = {
  'mandagsmøte': { label: 'Mandagsmøte', icon: 'calendar',      color: C.navy,   bg: '#eef0f3' },
  'idé':         { label: 'Idé',          icon: 'lightbulb',     color: C.amber,  bg: '#fef4e3' },
  'annet':       { label: 'Annet notat',  icon: 'message-square',color: C.teal,   bg: '#d9e9e3' },
};

// Mal for mandagsmøte — seksjonene som vises i skjemaet og notatvisningen
const MANDAGSMØTE_SEKSJONER = [
  { id:'forrige',       label:'Status forrige uke',            placeholder:'Hva skjedde? Hva ble levert? Hva henger igjen?' },
  { id:'denne',         label:'Plan denne uken',                placeholder:'Hva skal hver enkelt jobbe med?' },
  { id:'kunder',        label:'Kunder/saker som krever oppmerksomhet', placeholder:'Konkrete kunder, tilbud, oppfølginger.' },
  { id:'beslutninger',  label:'Beslutninger',                   placeholder:'Hva ble besluttet i møtet?' },
  { id:'oppfølging',    label:'Oppfølging — hvem gjør hva',     placeholder:'Konkrete handlinger med ansvarlig og frist.' },
  { id:'annet',         label:'Annet',                          placeholder:'Eventuelle øvrige saker.' },
];

function Intern({ state, setState }) {
  const { interneNotater = [], team } = state;
  const [tab, setTab] = useState('alle');   // alle | mandagsmøte | idé | annet
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState(null); // note object
  const [adding, setAdding] = useState(null);   // type string

  // Filtrer
  const filtered = useMemo(() => {
    let arr = [...interneNotater];
    if (tab !== 'alle') arr = arr.filter(n => n.type === tab);
    if (query) {
      const q = query.toLowerCase();
      arr = arr.filter(n =>
        (n.tittel||'').toLowerCase().includes(q) ||
        (n.forfatter||'').toLowerCase().includes(q) ||
        Object.values(n.seksjoner || {}).some(v => (v||'').toLowerCase().includes(q)) ||
        (n.innhold||'').toLowerCase().includes(q)
      );
    }
    arr.sort((a,b) => (b.dato||'').localeCompare(a.dato||'') || (b.opprettet||'').localeCompare(a.opprettet||''));
    return arr;
  }, [interneNotater, tab, query]);

  const save = (data, id) => {
    setState(s => {
      const list = s.interneNotater || [];
      if (id) {
        return { ...s, interneNotater: list.map(n => n.id===id ? { ...n, ...data, oppdatert: TODAY } : n) };
      }
      const nytt = { id: 'n'+Date.now(), opprettet: TODAY, ...data };
      return { ...s, interneNotater: [...list, nytt] };
    });
    setEditing(null); setAdding(null);
  };

  const slett = (id) => {
    if (!confirm('Slette dette notatet? Handlingen kan ikke angres.')) return;
    setState(s => ({ ...s, interneNotater: (s.interneNotater||[]).filter(n => n.id !== id) }));
  };

  // Stats — siste mandagsmøte
  const sistMøte = useMemo(() => {
    return [...interneNotater].filter(n => n.type === 'mandagsmøte')
      .sort((a,b) => (b.dato||'').localeCompare(a.dato||''))[0];
  }, [interneNotater]);

  return (
    <div style={{padding:'28px 32px', maxWidth:1100, margin:'0 auto'}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20, gap:16, flexWrap:'wrap'}}>
        <div>
          <h1 style={{fontSize:28, fontWeight:700, color:C.navy, letterSpacing:'-0.01em', margin:0}}>Intern</h1>
          <p style={{fontSize:14, color:C.gray500, marginTop:4, margin:0}}>
            Mandagsmøter, ideer og interne notater — synlig for hele teamet.
          </p>
        </div>
        <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
          <Button variant="secondary" icon="lightbulb" onClick={()=>setAdding('idé')}>Ny idé</Button>
          <Button variant="secondary" icon="message-square" onClick={()=>setAdding('annet')}>Nytt notat</Button>
          <Button variant="primary" icon="calendar" onClick={()=>setAdding('mandagsmøte')}>Nytt mandagsmøte</Button>
        </div>
      </div>

      {/* Stat-rad */}
      {interneNotater.length > 0 && (
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:12, marginBottom:18}}>
          <InternStat label="Notater totalt" value={interneNotater.length} icon="file-text" color={C.navy}/>
          <InternStat label="Mandagsmøter" value={interneNotater.filter(n=>n.type==='mandagsmøte').length} icon="calendar" color={C.blue}/>
          <InternStat label="Ideer" value={interneNotater.filter(n=>n.type==='idé').length} icon="lightbulb" color={C.amber}/>
          <InternStat label="Siste mandagsmøte" value={sistMøte ? formatDateShort(sistMøte.dato) : '–'} icon="clock" color={C.teal} small/>
        </div>
      )}

      {/* Faner + søk */}
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14, gap:12, flexWrap:'wrap', borderBottom:`1px solid ${C.gray200}`}}>
        <div style={{display:'flex', gap:4}}>
          {[
            {id:'alle',         label:`Alle (${interneNotater.length})`,                               icon:'inbox'},
            {id:'mandagsmøte',  label:`Mandagsmøter (${interneNotater.filter(n=>n.type==='mandagsmøte').length})`, icon:'calendar'},
            {id:'idé',          label:`Ideer (${interneNotater.filter(n=>n.type==='idé').length})`,    icon:'lightbulb'},
            {id:'annet',        label:`Annet (${interneNotater.filter(n=>n.type==='annet').length})`,  icon:'message-square'},
          ].map(t => (
            <button key={t.id} onClick={()=>setTab(t.id)} style={{
              background:'transparent', border:'none', cursor:'pointer', fontFamily:'inherit',
              padding:'10px 16px', fontSize:13,
              fontWeight: tab===t.id ? 600 : 500,
              color: tab===t.id ? C.navy : C.gray500,
              borderBottom: `2px solid ${tab===t.id ? C.navy : 'transparent'}`,
              marginBottom: -1,
              display:'inline-flex', alignItems:'center', gap:8,
            }}>
              <Icon name={t.icon} size={13}/>
              {t.label}
            </button>
          ))}
        </div>
        <div style={{position:'relative', width:240, paddingBottom:10}}>
          <Icon name="search" size={14} color={C.gray400} style={{position:'absolute', left:10, top:11, pointerEvents:'none'}}/>
          <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Søk i notater…" style={{
            width:'100%', padding:'8px 10px 8px 30px', fontSize:13, fontFamily:'inherit',
            border:`1px solid ${C.gray200}`, borderRadius:7, background:'#fff', color:C.gray900, outline:'none',
          }}/>
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <div style={{padding:'30px 12px', textAlign:'center', color:C.gray500}}>
            <Icon name="file-text" size={28} color={C.gray300} style={{marginBottom:10}}/>
            <div style={{fontSize:14, fontWeight:600, color:C.gray700, marginBottom:4}}>
              {interneNotater.length === 0 ? 'Ingen interne notater ennå' : 'Ingen treff'}
            </div>
            <div style={{fontSize:13, color:C.gray500, marginBottom:14}}>
              {interneNotater.length === 0
                ? 'Lag det første mandagsmøte-referatet, eller noter en idé.'
                : 'Prøv et annet søk eller fane.'}
            </div>
            {interneNotater.length === 0 && (
              <Button variant="primary" icon="calendar" onClick={()=>setAdding('mandagsmøte')}>Nytt mandagsmøte</Button>
            )}
          </div>
        </Card>
      ) : (
        <div style={{display:'flex', flexDirection:'column', gap:10}}>
          {filtered.map(n => (
            <NotatKort key={n.id} notat={n} team={team} onOpen={()=>setEditing(n)} onDelete={()=>slett(n.id)}/>
          ))}
        </div>
      )}

      {(adding || editing) && (
        <NotatModal
          team={team}
          notat={editing}
          initialType={adding}
          onClose={()=>{setAdding(null); setEditing(null);}}
          onSave={(data) => save(data, editing?.id)}
          onDelete={editing ? ()=>{ slett(editing.id); setEditing(null); } : null}
        />
      )}
    </div>
  );
}

function InternStat({ label, value, icon, color, small }) {
  return (
    <Card padding={14}>
      <div style={{display:'flex', alignItems:'center', gap:12}}>
        <div style={{
          width:34, height:34, borderRadius:8, background:`${color}15`,
          display:'flex', alignItems:'center', justifyContent:'center',
        }}>
          <Icon name={icon} size={16} color={color}/>
        </div>
        <div style={{minWidth:0}}>
          <div style={{fontSize:10, fontWeight:700, color:C.gray500, textTransform:'uppercase', letterSpacing:'.06em'}}>{label}</div>
          <div style={{fontSize: small ? 15 : 20, fontWeight:700, color:C.navy, marginTop:2, lineHeight:1.1}}>{value}</div>
        </div>
      </div>
    </Card>
  );
}

function NotatKort({ notat, team, onOpen, onDelete }) {
  const meta = NOTAT_TYPER[notat.type] || NOTAT_TYPER.annet;
  const tilstedeNavn = (notat.tilstede || [])
    .map(id => team.find(t=>t.id===id)?.navn)
    .filter(Boolean);
  const mangler = team.filter(t => !(notat.tilstede||[]).includes(t.id));

  // Sammendrag — første noen tegn fra første utfylte seksjon eller innhold
  const sammendrag = (() => {
    if (notat.innhold) return notat.innhold.split('\n')[0];
    if (notat.seksjoner) {
      for (const sek of MANDAGSMØTE_SEKSJONER) {
        const v = notat.seksjoner[sek.id];
        if (v) return `${sek.label}: ${v.split('\n')[0]}`;
      }
    }
    return '';
  })();

  return (
    <Card padding={0} style={{cursor:'pointer'}} onClick={onOpen}>
      <div style={{padding:'14px 18px', display:'grid', gridTemplateColumns:'auto 1fr auto', gap:14, alignItems:'flex-start'}}>
        <div style={{
          width:38, height:38, borderRadius:8, background: meta.bg,
          display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
        }}>
          <Icon name={meta.icon} size={17} color={meta.color}/>
        </div>
        <div style={{minWidth:0}}>
          <div style={{display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:4}}>
            <span style={{
              fontSize:10, fontWeight:700, color:meta.color, background:meta.bg,
              padding:'2px 8px', borderRadius:9999, textTransform:'uppercase', letterSpacing:'.06em',
            }}>{meta.label}</span>
            <span style={{fontSize:12, color:C.gray500}}>{formatDateLong(notat.dato)}</span>
            {notat.forfatter && <span style={{fontSize:12, color:C.gray500}}>· av {notat.forfatter}</span>}
          </div>
          <div style={{fontSize:15, fontWeight:600, color:C.navy, marginBottom:6}}>{notat.tittel}</div>
          {sammendrag && (
            <div style={{fontSize:13, color:C.gray700, lineHeight:1.5, marginBottom:6, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden'}}>
              {sammendrag}
            </div>
          )}
          {notat.type === 'mandagsmøte' && (
            <div style={{display:'flex', gap:14, fontSize:11, color:C.gray500, marginTop:6, flexWrap:'wrap'}}>
              <div><strong style={{color:C.green, fontWeight:700}}>Til stede:</strong> {tilstedeNavn.length > 0 ? tilstedeNavn.join(', ') : <span style={{color:C.gray400}}>ingen registrert</span>}</div>
              {mangler.length > 0 && (
                <div><strong style={{color:C.amber, fontWeight:700}}>Fraværende:</strong> {mangler.map(t=>t.navn).join(', ')}</div>
              )}
            </div>
          )}
        </div>
        <div onClick={e=>e.stopPropagation()} style={{display:'flex', gap:4}}>
          <button onClick={onOpen} style={iconBtnIntern} title="Åpne"><Icon name="chevron-right" size={14} color={C.gray500}/></button>
        </div>
      </div>
    </Card>
  );
}

function NotatModal({ team, notat, initialType, onClose, onSave, onDelete }) {
  const type = notat?.type || initialType;
  const meta = NOTAT_TYPER[type] || NOTAT_TYPER.annet;

  const blank = {
    type,
    dato: TODAY,
    tittel: type === 'mandagsmøte' ? `Mandagsmøte ${formatDateShort(TODAY)}` : '',
    forfatter: team[0]?.navn || '',
    tilstede: type === 'mandagsmøte' ? team.map(t=>t.id) : [],
    seksjoner: type === 'mandagsmøte' ? Object.fromEntries(MANDAGSMØTE_SEKSJONER.map(s=>[s.id, ''])) : null,
    innhold: type !== 'mandagsmøte' ? '' : '',
  };

  const [form, setForm] = useState(() => notat ? JSON.parse(JSON.stringify(notat)) : blank);
  const [err, setErr] = useState('');

  const upd = (k, v) => setForm(f => ({...f, [k]:v}));
  const updSek = (id, v) => setForm(f => ({...f, seksjoner: {...(f.seksjoner||{}), [id]: v}}));
  const toggleTilstede = (tid) => {
    const cur = form.tilstede || [];
    upd('tilstede', cur.includes(tid) ? cur.filter(x=>x!==tid) : [...cur, tid]);
  };

  const submit = e => {
    e.preventDefault();
    if (!form.tittel.trim()) { setErr('Tittel er påkrevd'); return; }
    if (!form.dato) { setErr('Dato er påkrevd'); return; }
    onSave({
      ...form,
      tittel: form.tittel.trim(),
      forfatter: (form.forfatter||'').trim(),
    });
  };

  return (
    <Modal open={true} onClose={onClose} title={notat ? 'Rediger notat' : `Nytt ${meta.label.toLowerCase()}`} width={760}>
      <form onSubmit={submit}>
        {/* Type-banner */}
        <div style={{
          padding:'10px 14px', borderRadius:8, background: meta.bg,
          display:'flex', alignItems:'center', gap:10, marginBottom:16,
        }}>
          <Icon name={meta.icon} size={16} color={meta.color}/>
          <div style={{fontSize:13, fontWeight:600, color:meta.color}}>{meta.label}</div>
        </div>

        {/* Topp-felter */}
        <div style={{display:'grid', gridTemplateColumns:'1fr 180px 1fr', gap:12, marginBottom:14}}>
          <Input label="Tittel *" value={form.tittel} onChange={e=>upd('tittel', e.target.value)}
            error={err && !form.tittel.trim() ? err : ''} placeholder={type==='mandagsmøte' ? 'Mandagsmøte uke …' : 'Kort tittel'}/>
          <Input label="Dato *" type="date" value={form.dato} onChange={e=>upd('dato', e.target.value)}/>
          <Select label="Forfatter" value={form.forfatter} onChange={e=>upd('forfatter', e.target.value)}
            options={[{value:'', label:'—'}, ...team.map(t=>({value:t.navn, label:t.navn}))]}/>
        </div>

        {/* Tilstede — kun mandagsmøte */}
        {type === 'mandagsmøte' && (
          <div style={{marginBottom:16}}>
            <div style={{fontSize:11, fontWeight:600, color:C.gray700, marginBottom:8, textTransform:'uppercase', letterSpacing:'.05em'}}>Til stede</div>
            <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
              {team.map(t => {
                const on = (form.tilstede||[]).includes(t.id);
                return (
                  <button key={t.id} type="button" onClick={()=>toggleTilstede(t.id)} style={{
                    display:'inline-flex', alignItems:'center', gap:8,
                    padding:'6px 12px 6px 6px', borderRadius:9999, cursor:'pointer',
                    border:`1.5px solid ${on ? C.navy : C.gray200}`,
                    background: on ? '#eef0f3' : '#fff', fontFamily:'inherit',
                  }}>
                    <Avatar initialer={t.initialer} size={22} color={teamColor(t.id)}/>
                    <span style={{fontSize:12, fontWeight: on ? 600 : 500, color: on ? C.navy : C.gray500}}>{t.navn}</span>
                    {on && <Icon name="check" size={12} color={C.green}/>}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* INNHOLD */}
        {type === 'mandagsmøte' ? (
          <div style={{display:'flex', flexDirection:'column', gap:12}}>
            {MANDAGSMØTE_SEKSJONER.map(sek => (
              <Textarea key={sek.id}
                label={sek.label}
                value={form.seksjoner?.[sek.id] || ''}
                onChange={e=>updSek(sek.id, e.target.value)}
                rows={3}
                placeholder={sek.placeholder}/>
            ))}
          </div>
        ) : (
          <Textarea label="Innhold"
            value={form.innhold || ''}
            onChange={e=>upd('innhold', e.target.value)}
            rows={10}
            placeholder={type === 'idé' ? 'Beskriv ideen — bakgrunn, hva den løser, hva som må til.' : 'Skriv notatet her.'}/>
        )}

        {err && <div style={{fontSize:12, color:C.red, marginTop:10}}>{err}</div>}

        <div style={{display:'flex', justifyContent:'space-between', gap:8, marginTop:18, paddingTop:14, borderTop:`1px solid ${C.gray100}`}}>
          <div>
            {onDelete && <Button variant="ghost" type="button" icon="trash-2" onClick={onDelete}>Slett notat</Button>}
          </div>
          <div style={{display:'flex', gap:8}}>
            <Button variant="secondary" type="button" onClick={onClose}>Avbryt</Button>
            <Button variant="primary" type="submit">{notat ? 'Lagre endringer' : 'Lagre notat'}</Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

const iconBtnIntern = {
  width:30, height:30, borderRadius:6, border:`1px solid ${C.gray200}`,
  background:'#fff', cursor:'pointer', display:'inline-flex', alignItems:'center', justifyContent:'center', padding:0,
};

window.Intern = Intern;
