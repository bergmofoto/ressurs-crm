// ============================================================
// KUNDER — Customer list with search, filters, sortable table
// ============================================================

function Kunder({ state, setState, navigate, initialNew }) {
  const { kunder, team, pakker } = state;
  const teamById  = useMemo(() => Object.fromEntries(team.map(t  => [t.id, t])),  [team]);
  const pakkeById = useMemo(() => Object.fromEntries(pakker.map(p => [p.id, p])), [pakker]);

  const [search, setSearch] = useState('');
  const [statusF, setStatusF] = useState('');
  const [pakkeF,  setPakkeF]  = useState('');
  const [ansvF,   setAnsvF]   = useState('');
  const [sort, setSort] = useState({ col: 'bedriftsnavn', dir: 'asc' });
  const [showNew, setShowNew] = useState(!!initialNew);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let rows = kunder.filter(k => {
      if (statusF && k.status !== statusF) return false;
      if (pakkeF && k.pakkeId !== pakkeF) return false;
      if (ansvF && k.ansvarligId !== ansvF) return false;
      if (q) {
        const hay = [
          k.bedriftsnavn, k.kontakt?.navn, k.kontakt2?.navn, k.notater,
        ].join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    // Sort
    const dir = sort.dir === 'asc' ? 1 : -1;
    rows.sort((a, b) => {
      let av, bv;
      switch (sort.col) {
        case 'bedriftsnavn': av = a.bedriftsnavn; bv = b.bedriftsnavn; break;
        case 'kontakt':      av = a.kontakt?.navn || ''; bv = b.kontakt?.navn || ''; break;
        case 'pakke':        av = pakkeById[a.pakkeId]?.navn || ''; bv = pakkeById[b.pakkeId]?.navn || ''; break;
        case 'status':       av = STATUS_LISTE.indexOf(a.status); bv = STATUS_LISTE.indexOf(b.status); break;
        case 'verdi':        av = a.verdi || 0; bv = b.verdi || 0; break;
        case 'sistKontakt':  av = a.sistKontakt || ''; bv = b.sistKontakt || ''; break;
        case 'neste':        av = a.nesteAktivitet?.dato || '9999'; bv = b.nesteAktivitet?.dato || '9999'; break;
        case 'ansvarlig':    av = teamById[a.ansvarligId]?.navn || ''; bv = teamById[b.ansvarligId]?.navn || ''; break;
        default: av=''; bv='';
      }
      if (av < bv) return -1*dir;
      if (av > bv) return  1*dir;
      return 0;
    });
    return rows;
  }, [kunder, search, statusF, pakkeF, ansvF, sort, teamById, pakkeById]);

  const onSort = col => setSort(s => ({ col, dir: s.col === col && s.dir === 'asc' ? 'desc' : 'asc' }));

  const handleCreate = (data) => {
    const id = 'k' + Date.now();
    const ny = { id, ...data, aktiviteter: [], nesteAktivitet: null, sistKontakt: TODAY };
    setState(s => ({ ...s, kunder: [...s.kunder, ny] }));
    setShowNew(false);
    navigate('kundeprofil', { id });
  };

  return (
    <div style={{padding:'28px 32px', maxWidth:1400, margin:'0 auto'}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20}}>
        <div>
          <h1 style={{fontSize:28, fontWeight:700, color:C.navy, letterSpacing:'-0.01em', margin:0}}>Kunder</h1>
          <p style={{fontSize:14, color:C.gray500, marginTop:4, margin:0}}>{kunder.length} kunder · viser {filtered.length}</p>
        </div>
        <Button icon="user-plus" variant="primary" onClick={() => setShowNew(true)}>Ny kunde</Button>
      </div>

      {/* Filters */}
      <Card style={{marginBottom:16, padding:'14px 16px'}}>
        <div style={{display:'grid', gridTemplateColumns:'minmax(220px, 1fr) 180px 200px 180px', gap:12, alignItems:'end'}}>
          <div style={{position:'relative'}}>
            <Icon name="search" size={14} color={C.gray400} style={{position:'absolute', left:11, top:'50%', transform:'translateY(-50%)'}}/>
            <input
              value={search} onChange={e=>setSearch(e.target.value)}
              placeholder="Søk i bedriftsnavn, kontaktperson, notater…"
              style={{width:'100%', padding:'9px 12px 9px 34px', border:`1.5px solid ${C.gray200}`, borderRadius:7,
                fontSize:14, fontFamily:'inherit', color:C.navy, background:'#fff', outline:'none'}}
            />
          </div>
          <Select label="Framdriftsstatus" value={statusF} onChange={e=>setStatusF(e.target.value)}
            options={[{value:'', label:'Alle statuser'}, ...STATUS_LISTE.map(s=>({value:s,label:s}))]}/>
          <Select label="Pakke" value={pakkeF} onChange={e=>setPakkeF(e.target.value)}
            options={[{value:'', label:'Alle pakker'}, ...pakker.map(p=>({value:p.id,label:p.navn}))]}/>
          <Select label="Ansvarlig selger" value={ansvF} onChange={e=>setAnsvF(e.target.value)}
            options={[{value:'', label:'Alle selgere'}, ...team.map(t=>({value:t.id,label:t.navn}))]}/>
        </div>
        {(search||statusF||pakkeF||ansvF) && (
          <div style={{marginTop:10}}>
            <button onClick={()=>{setSearch('');setStatusF('');setPakkeF('');setAnsvF('');}}
              style={{background:'none', border:'none', color:C.blue, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit', padding:0}}>
              Nullstill filtre
            </button>
          </div>
        )}
      </Card>

      <Card padding={0} style={{overflow:'hidden'}}>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%', borderCollapse:'collapse', minWidth:1000}}>
            <thead>
              <tr style={{background:C.gray50, borderBottom:`1px solid ${C.gray100}`}}>
                <SortHeader col="bedriftsnavn" sort={sort} onSort={onSort}>Bedrift</SortHeader>
                <SortHeader col="kontakt"      sort={sort} onSort={onSort}>Kontaktperson</SortHeader>
                <SortHeader col="pakke"        sort={sort} onSort={onSort}>Pakke</SortHeader>
                <SortHeader col="status"       sort={sort} onSort={onSort}>Status</SortHeader>
                <SortHeader col="verdi"        sort={sort} onSort={onSort} align="right">Verdi</SortHeader>
                <SortHeader col="sistKontakt"  sort={sort} onSort={onSort}>Sist kontakt</SortHeader>
                <SortHeader col="neste"        sort={sort} onSort={onSort}>Neste aktivitet</SortHeader>
                <SortHeader col="ansvarlig"    sort={sort} onSort={onSort}>Ansvarlig</SortHeader>
              </tr>
            </thead>
            <tbody>
              {filtered.map(k => {
                const ansv = teamById[k.ansvarligId];
                const pkg = pakkeById[k.pakkeId];
                const diff = k.nesteAktivitet?.dato ? daysBetween(TODAY, k.nesteAktivitet.dato) : null;
                const nesteColor = diff == null ? C.gray400 : diff < 0 ? C.red : diff <= 3 ? C.amber : C.gray700;
                return (
                  <tr key={k.id}
                    onClick={() => navigate('kundeprofil', { id: k.id })}
                    style={{borderBottom:`1px solid ${C.gray100}`, cursor:'pointer', transition:'background 100ms'}}
                    onMouseEnter={e => e.currentTarget.style.background = C.gray50}
                    onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                  >
                    <td style={{padding:'12px 16px'}}>
                      <div style={{fontSize:14, fontWeight:600, color:C.navy}}>{k.bedriftsnavn}</div>
                      <div style={{fontSize:11, color:C.gray400, marginTop:2}}>{k.bransje} · {k.orgnr}</div>
                    </td>
                    <td style={{padding:'12px 16px'}}>
                      <div style={{fontSize:13, color:C.navy}}>{k.kontakt?.navn || '–'}</div>
                      <div style={{fontSize:11, color:C.gray400, marginTop:2}}>{k.kontakt?.tittel}</div>
                    </td>
                    <td style={{padding:'12px 16px', fontSize:13, color:C.gray700}}>{pkg?.navn || '–'}</td>
                    <td style={{padding:'12px 16px'}}><StatusBadge status={k.status} size="sm"/></td>
                    <td style={{padding:'12px 16px', fontSize:13, fontWeight:600, color:C.navy, textAlign:'right'}}>{formatKr(k.verdi)}</td>
                    <td style={{padding:'12px 16px', fontSize:12, color:C.gray500}}>{k.sistKontakt ? formatDateShort(k.sistKontakt) : '–'}</td>
                    <td style={{padding:'12px 16px'}}>
                      <div style={{fontSize:12, color: nesteColor, fontWeight: diff!=null && diff<=3 ? 600 : 400}}>
                        {k.nesteAktivitet?.dato ? formatDateShort(k.nesteAktivitet.dato) : 'Ingen planlagt'}
                      </div>
                      {k.nesteAktivitet?.type && <div style={{fontSize:11, color:C.gray400, marginTop:2}}>{AKTIVITETSTYPER[k.nesteAktivitet.type]?.label || k.nesteAktivitet.type}</div>}
                    </td>
                    <td style={{padding:'12px 16px'}}>
                      {ansv ? (
                        <div style={{display:'flex', alignItems:'center', gap:8}}>
                          <Avatar initialer={ansv.initialer} size={26} color={teamColor(ansv.id)}/>
                          <span style={{fontSize:12, color:C.gray700}}>{ansv.navn.split(' ')[0]}</span>
                        </div>
                      ) : '–'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div style={{padding:50, textAlign:'center', color:C.gray400, fontSize:14}}>
            Ingen kunder matcher filtrene.
          </div>
        )}
      </Card>

      {showNew && <NyKundeModal state={state} onClose={()=>setShowNew(false)} onCreate={handleCreate}/>}
    </div>
  );
}

function SortHeader({ col, sort, onSort, align='left', children }) {
  const active = sort.col === col;
  return (
    <th onClick={() => onSort(col)} style={{
      padding:'12px 16px', textAlign:align, fontSize:11, fontWeight:600,
      color: active ? C.navy : C.gray500, textTransform:'uppercase', letterSpacing:'.05em',
      cursor:'pointer', userSelect:'none', whiteSpace:'nowrap',
    }}>
      <span style={{display:'inline-flex', alignItems:'center', gap:4}}>
        {children}
        <Icon name={active ? (sort.dir==='asc'?'chevron-up':'chevron-down') : 'chevrons-up-down'}
              size={12} color={active ? C.navy : C.gray300}/>
      </span>
    </th>
  );
}

function NyKundeModal({ state, onClose, onCreate }) {
  const { team, pakker } = state;
  const [form, setForm] = useState({
    bedriftsnavn:'', orgnr:'', bransje:'', adresse:'',
    kontakt: { navn:'', tittel:'', epost:'', telefon:'' },
    kontakt2: { navn:'', tittel:'', epost:'', telefon:'' },
    ansvarligId: team[0]?.id || '',
    pakkeId: pakker[0]?.id || '',
    status: 'Lead',
    verdi: pakker[0]?.pris || 0,
    notater:'',
  });
  const [errs, setErrs] = useState({});

  const upd = (path, v) => {
    setForm(f => {
      const next = {...f};
      if (path.includes('.')) {
        const [a,b] = path.split('.');
        next[a] = {...next[a], [b]: v};
      } else next[path] = v;
      return next;
    });
  };

  const submit = (e) => {
    e?.preventDefault();
    const errors = validateKunde(form);
    if (Object.keys(errors).length) { setErrs(errors); return; }
    onCreate(form);
  };

  return (
    <Modal open={true} onClose={onClose} title="Ny kunde" width={640}>
      <form onSubmit={submit} style={{display:'flex', flexDirection:'column', gap:14}}>
        <Input label="Bedriftsnavn *" value={form.bedriftsnavn} onChange={e=>upd('bedriftsnavn', e.target.value)} error={errs.bedriftsnavn}/>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
          <Input label="Organisasjonsnummer" value={form.orgnr} onChange={e=>upd('orgnr', e.target.value)}/>
          <Input label="Bransje" value={form.bransje} onChange={e=>upd('bransje', e.target.value)}/>
        </div>
        <Input label="Adresse" value={form.adresse} onChange={e=>upd('adresse', e.target.value)}/>

        <div style={{fontSize:11, fontWeight:600, color:C.gray500, textTransform:'uppercase', letterSpacing:'.05em', marginTop:6}}>Kontaktperson</div>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
          <Input label="Navn *" value={form.kontakt.navn} onChange={e=>upd('kontakt.navn', e.target.value)} error={errs.kontaktNavn}/>
          <Input label="Tittel" value={form.kontakt.tittel} onChange={e=>upd('kontakt.tittel', e.target.value)}/>
          <Input label="E-post" type="email" value={form.kontakt.epost} onChange={e=>upd('kontakt.epost', e.target.value)} error={errs.kontaktEpost}/>
          <Input label="Telefon" value={form.kontakt.telefon} onChange={e=>upd('kontakt.telefon', e.target.value)}/>
        </div>

        <div style={{fontSize:11, fontWeight:600, color:C.gray500, textTransform:'uppercase', letterSpacing:'.05em', marginTop:6}}>Salgsinformasjon</div>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
          <Select label="Pakke" value={form.pakkeId} onChange={e=>{
            upd('pakkeId', e.target.value);
            const p = pakker.find(x => x.id === e.target.value);
            if (p) upd('verdi', p.pris);
          }} options={pakker.map(p=>({value:p.id, label:p.navn}))}/>
          <Input label="Verdi (kr)" type="number" value={form.verdi} onChange={e=>upd('verdi', Number(e.target.value))}/>
          <Select label="Framdriftsstatus" value={form.status} onChange={e=>upd('status', e.target.value)} options={STATUS_LISTE}/>
          <Select label="Ansvarlig selger" value={form.ansvarligId} onChange={e=>upd('ansvarligId', e.target.value)}
            options={team.map(t=>({value:t.id, label:t.navn}))}/>
        </div>

        <Textarea label="Notater" value={form.notater} onChange={e=>upd('notater', e.target.value)}/>

        <div style={{display:'flex', justifyContent:'flex-end', gap:10, marginTop:10}}>
          <Button variant="secondary" onClick={onClose} type="button">Avbryt</Button>
          <Button variant="primary" type="submit">Opprett kunde</Button>
        </div>
      </form>
    </Modal>
  );
}

window.Kunder = Kunder;
window.NyKundeModal = NyKundeModal;
