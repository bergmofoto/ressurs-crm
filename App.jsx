// ============================================================
// APP — Top-level layout with sidebar nav + routing
// ============================================================

const NAV = [
  { id:'oversikt',     icon:'layout-dashboard',  label:'Oversikt' },
  { id:'kunder',       icon:'building-2',        label:'Kunder' },
  { id:'rapporter',    icon:'bar-chart-3',       label:'Rapporter' },
  { id:'intern',       icon:'notebook-pen',      label:'Intern' },
  { id:'innstillinger',icon:'settings',          label:'Innstillinger' },
];

function App() {
  const { state, setState, session, loading, login, logout, authError, persistErr, refreshErr, refresh, silentRefresh, live, lastSync, clearPersistErr } = useStore();

  // Routing: { page, params }
  const [route, setRoute] = useState(() => {
    try {
      const raw = sessionStorage.getItem('ressurs_route');
      if (raw) return JSON.parse(raw);
    } catch(e) {}
    return { page: 'oversikt', params: {} };
  });

  useEffect(() => {
    try { sessionStorage.setItem('ressurs_route', JSON.stringify(route)); } catch(e) {}
  }, [route]);

  // Ikke innlogget → vis login
  if (!session) {
    return <LoginScreen onLogin={login} error={authError}/>;
  }

  // Innlogget men data ikke lastet enda
  if (loading || !state) {
    return <LoadingScreen error={authError} onLogout={logout}/>;
  }

  const navigate = (page, params={}) => setRoute({ page, params });

  // Top nav active key (kundeprofil + tilbudview counts as kunder)
  const activeNav = (route.page === 'kundeprofil' || route.page === 'tilbudview') ? 'kunder' : route.page;

  let content;
  switch (route.page) {
    case 'oversikt':
      content = <Oversikt state={state} navigate={navigate}/>;
      break;
    case 'kunder':
      content = <Kunder state={state} setState={setState} navigate={navigate} initialNew={route.params?.newCustomer} initialStatus={route.params?.status}/>;
      break;
    case 'kundeprofil':
      content = <Kundeprofil state={state} setState={setState} navigate={navigate} kundeId={route.params?.id}/>;
      break;
    case 'rapporter':
      content = <Rapporter state={state} navigate={navigate}/>;
      break;
    case 'innstillinger':
      content = <Innstillinger state={state} setState={setState}/>;
      break;
    case 'intern':
      content = <Intern state={state} setState={setState}/>;
      break;
    case 'tilbudview':
      content = <TilbudVisning state={state} setState={setState} navigate={navigate} tilbudId={route.params?.tilbudId}/>;
      break;
    default:
      content = <Oversikt state={state} navigate={navigate}/>;
  }

  return (
    <div className="app-shell" style={{display:'flex', height:'100vh', width:'100vw', overflow:'hidden', background: C.bg}}>
      <Sidebar active={activeNav} onNav={(id)=>navigate(id)} state={state} session={session} logout={logout} live={live} lastSync={lastSync} onRefresh={silentRefresh}/>
      <main style={{flex:1, overflow:'auto', background: '#fbfcfd'}}>
        {content}
      </main>
      {persistErr && (
        <div style={{
          position:'fixed', bottom:20, right:20, zIndex:9999,
          background:'#fbe6e6', color:C.red, padding:'12px 16px', borderRadius:8,
          fontSize:13, maxWidth:380, boxShadow:'0 4px 12px rgba(0,0,0,0.15)',
          display:'flex', alignItems:'center', gap:10,
        }}>
          <Icon name="alert-circle" size={16}/>
          <div style={{flex:1}}><strong>Lagring feilet:</strong> {persistErr}</div>
          <button onClick={clearPersistErr} style={{background:'none', border:'none', cursor:'pointer', color:C.red, padding:4}}><Icon name="x" size={14}/></button>
        </div>
      )}
      {refreshErr && (
        <div style={{
          position:'fixed', bottom: persistErr ? 80 : 20, right:20, zIndex:9998,
          background:'#fef4e3', color:'#8a5410', padding:'12px 16px', borderRadius:8,
          fontSize:13, maxWidth:380, boxShadow:'0 4px 12px rgba(0,0,0,0.15)',
          display:'flex', alignItems:'center', gap:10,
        }}>
          <Icon name="cloud-off" size={16}/>
          <div style={{flex:1}}>
            <strong>Frakoblet:</strong> Viser sist lagrede data. Endringer lagres når tilkoblingen er tilbake.
          </div>
          <button onClick={refresh} title="Prøv på nytt" style={{
            background:C.amber, color:'#fff', border:'none', cursor:'pointer',
            padding:'5px 10px', borderRadius:5, fontSize:12, fontWeight:600,
            fontFamily:'inherit',
          }}>Prøv igjen</button>
        </div>
      )}
    </div>
  );
}

function LiveIndicator({ live, lastSync, onRefresh }) {
  // Oppdater "for X sek siden"-teksten hvert 15. sek
  const [, tick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => tick(n => n + 1), 15000);
    return () => clearInterval(t);
  }, []);

  const agoText = (() => {
    if (!lastSync) return '';
    const sec = Math.round((Date.now() - lastSync) / 1000);
    if (sec < 15) return 'nå nettopp';
    if (sec < 60) return `for ${sec} sek siden`;
    const min = Math.round(sec / 60);
    if (min < 60) return `for ${min} min siden`;
    const hr = Math.round(min / 60);
    return `for ${hr} t siden`;
  })();

  return (
    <button onClick={onRefresh} title="Oppdater nå" style={{
      display:'flex', alignItems:'center', gap:9, width:'100%',
      background:'transparent', border:'none', cursor:'pointer',
      padding:'4px 4px', borderRadius:6, textAlign:'left',
      fontFamily:'DM Sans, sans-serif',
    }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
    >
      <span style={{position:'relative', display:'inline-flex', width:8, height:8, flexShrink:0}}>
        <span style={{
          position:'absolute', inset:0, borderRadius:'50%',
          background: live ? '#44ac39' : 'rgba(255,255,255,0.3)',
        }}/>
        {live && (
          <span style={{
            position:'absolute', inset:0, borderRadius:'50%',
            background:'#44ac39', animation:'ressursPulse 2s ease-out infinite',
          }}/>
        )}
      </span>
      <div style={{flex:1, minWidth:0}}>
        <div style={{fontSize:11.5, fontWeight:600, color: live ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.5)', lineHeight:1.2}}>
          {live ? 'Sanntid på' : 'Kobler til…'}
        </div>
        {agoText && (
          <div style={{fontSize:10, color:'rgba(255,255,255,0.35)', lineHeight:1.3, marginTop:1}}>
            Oppdatert {agoText}
          </div>
        )}
      </div>
      <i className="icon-refresh-cw" style={{fontSize:12, color:'rgba(255,255,255,0.35)'}}/>
    </button>
  );
}

function Sidebar({ active, onNav, state, session, logout, live, lastSync, onRefresh }) {
  // Show overdue count
  const overdue = state.kunder.filter(k => k.nesteAktivitet?.dato && daysBetween(TODAY, k.nesteAktivitet.dato) < 0).length;
  return (
    <aside style={{
      width:220, background:C.navy, display:'flex', flexDirection:'column',
      height:'100vh', flexShrink:0,
    }}>
      <div style={{padding:'22px 20px 18px', borderBottom:'1px solid rgba(255,255,255,0.08)'}}>
        <div style={{display:'flex', alignItems:'center', gap:10}}>
          <img src="assets/Ressurs_R_hvit.png" alt="R" style={{height:30, width:'auto'}}/>
          <div>
            <div style={{color:'#fff', fontSize:16, fontWeight:700, letterSpacing:'-0.01em', lineHeight:1.1}}>Ressurs</div>
            <div style={{fontSize:10, color:'rgba(255,255,255,0.4)', marginTop:2, letterSpacing:'.05em', textTransform:'uppercase'}}>CRM</div>
          </div>
        </div>
      </div>

      <div style={{padding:'8px 14px', borderBottom:'1px solid rgba(255,255,255,0.08)'}}>
        <div style={{fontSize:10, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:6, marginTop:4}}>Arbeidslivstjenester</div>
        <div style={{fontSize:11, color:'rgba(255,255,255,0.5)', lineHeight:1.4, paddingBottom:6}}>
          Omstilling, karriereutvikling og kompetanseheving for arbeidstakere og bedrifter.
        </div>
      </div>

      <nav style={{flex:1, padding:'12px 10px', display:'flex', flexDirection:'column', gap:2}}>
        {NAV.map(n => (
          <NavItem key={n.id} {...n} active={active===n.id} onClick={()=>onNav(n.id)}
            badge={n.id==='oversikt' && overdue>0 ? overdue : null}/>
        ))}
      </nav>

      <div style={{padding:'10px 14px', borderTop:'1px solid rgba(255,255,255,0.08)'}}>
        <LiveIndicator live={live} lastSync={lastSync} onRefresh={onRefresh}/>
      </div>

      <div style={{padding:'14px 14px 18px', borderTop:'1px solid rgba(255,255,255,0.08)'}}>
        {(() => {
          // Finn teammedlem som matcher session.user.email
          const meEmail = session?.user?.email || '';
          const me = state.team.find(t => (t.epost||'').toLowerCase() === meEmail.toLowerCase())
                  || { navn: meEmail || '—', rolle: '', initialer: meEmail ? meEmail[0].toUpperCase() : '?', id:'me' };
          return (
            <div style={{display:'flex', alignItems:'center', gap:10}}>
              <Avatar initialer={me.initialer} size={32} color={teamColor(me.id)}/>
              <div style={{flex:1, minWidth:0}}>
                <div style={{fontSize:13, fontWeight:600, color:'#fff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{me.navn}</div>
                <div style={{fontSize:11, color:'rgba(255,255,255,0.4)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{me.rolle || meEmail}</div>
              </div>
              <button onClick={logout} title="Logg ut" style={{
                background:'transparent', border:'none', cursor:'pointer',
                padding:6, borderRadius:6, color:'rgba(255,255,255,0.4)',
                display:'flex', alignItems:'center', justifyContent:'center',
              }}
                onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,0.08)'; e.currentTarget.style.color='#fff';}}
                onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='rgba(255,255,255,0.4)';}}>
                <i className="icon-log-out" style={{fontSize:14}}/>
              </button>
            </div>
          );
        })()}
      </div>
    </aside>
  );
}

function NavItem({ icon, label, active, onClick, badge }) {
  return (
    <button onClick={onClick} style={{
      display:'flex', alignItems:'center', gap:11,
      padding:'10px 12px', borderRadius:7, border:'none', cursor:'pointer',
      background: active ? 'rgba(255,255,255,0.12)' : 'transparent',
      color: active ? '#fff' : 'rgba(255,255,255,0.55)',
      fontSize:14, fontWeight: active ? 600 : 500,
      fontFamily:'DM Sans, sans-serif',
      transition:'all 120ms', width:'100%', textAlign:'left',
    }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
    >
      <i className={`icon-${icon}`} style={{fontSize:16, width:18, textAlign:'center'}}/>
      <span style={{flex:1}}>{label}</span>
      {badge && (
        <span style={{
          background: C.red, color:'#fff', fontSize:10, fontWeight:700,
          padding:'1px 7px', borderRadius:9999,
        }}>{badge}</span>
      )}
    </button>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
