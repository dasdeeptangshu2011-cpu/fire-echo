import { useEffect, useMemo, useState } from 'react'
import { Activity, AlertTriangle, Battery, Bot, ChevronRight, CircleDot, Cpu, Flame, Gauge, Globe2, Layers3, Map, Menu, Radio, RefreshCw, Router, Satellite, ShieldCheck, Signal, Thermometer, Wifi, WifiOff, X } from 'lucide-react'
import './App.css'

type Source = 'SIMULATION' | 'REAL' | 'OFFLINE/REPLAY'
type EventState = 'NORMAL' | 'ENVIRONMENTAL ANOMALY' | 'SUSPICIOUS EVENT' | 'CORROBORATED EVENT' | 'PROBABLE FIRE EVENT' | 'LOCALIZED EVENT'
type Page = 'Home' | 'Live Map' | '3D Digital Twin' | 'Events' | 'Incident Command' | 'Robot Control' | 'Sentinel Network' | 'Hardware Center' | 'Simulation Lab' | 'Analytics' | 'System Health'

type Sentinel = { id:string; x:number; y:number; temp:number; humidity:number; smoke:number; flame:number; battery:number; signal:number; health:'ONLINE'|'DEGRADED'|'OFFLINE'; baseline:number; source:Source }
type Robot = { x:number; y:number; battery:number; connected:boolean; mission:string; ack:string }

const initialSentinels: Sentinel[] = [
  {id:'S-01',x:18,y:25,temp:29.4,humidity:68,smoke:7,flame:0,battery:96,signal:91,health:'ONLINE',baseline:29,source:'SIMULATION'},
  {id:'S-02',x:43,y:22,temp:30.1,humidity:64,smoke:9,flame:0,battery:91,signal:88,health:'ONLINE',baseline:30,source:'SIMULATION'},
  {id:'S-03',x:69,y:28,temp:31.0,humidity:61,smoke:12,flame:0,battery:87,signal:82,health:'ONLINE',baseline:30.5,source:'SIMULATION'},
  {id:'S-04',x:28,y:62,temp:28.7,humidity:71,smoke:6,flame:0,battery:94,signal:94,health:'ONLINE',baseline:29,source:'SIMULATION'},
  {id:'S-05',x:56,y:58,temp:30.4,humidity:63,smoke:10,flame:0,battery:89,signal:86,health:'ONLINE',baseline:30,source:'SIMULATION'},
  {id:'S-06',x:82,y:66,temp:29.8,humidity:66,smoke:8,flame:0,battery:92,signal:90,health:'ONLINE',baseline:30,source:'SIMULATION'},
]

const nav: {name:Page; icon:typeof Map}[] = [
  {name:'Home',icon:Gauge},{name:'Live Map',icon:Map},{name:'3D Digital Twin',icon:Globe2},{name:'Events',icon:AlertTriangle},{name:'Incident Command',icon:ShieldCheck},{name:'Robot Control',icon:Bot},{name:'Sentinel Network',icon:Satellite},{name:'Hardware Center',icon:Cpu},{name:'Simulation Lab',icon:Activity},{name:'Analytics',icon:Layers3},{name:'System Health',icon:Radio},
]

function clamp(n:number,a:number,b:number){return Math.max(a,Math.min(b,n))}
function score(s:Sentinel){return clamp((s.temp-s.baseline)*10 + Math.max(0,s.smoke-12)*2 + s.flame*55 + Math.max(0,65-s.humidity)*0.7,0,100)}
function formatSource(source:Source){return source==='SIMULATION'?'SIM':'OFFLINE'}

function App(){
  const [page,setPage]=useState<Page>('Home')
  const [sentinels,setSentinels]=useState(initialSentinels)
  const [robot,setRobot]=useState<Robot>({x:49,y:84,battery:78,connected:false,mission:'STANDBY',ack:'No command sent'})
  const [event,setEvent]=useState<EventState>('NORMAL')
  const [simulation,setSimulation]=useState(true)
  const [sidebar,setSidebar]=useState(false)
  const [toast,setToast]=useState('')
  const [hardware,setHardware]=useState<'DISCONNECTED'|'SCANNING'|'CONNECTED'|'CONNECTION LOST'>('DISCONNECTED')
  const [lastUpdate,setLastUpdate]=useState(Date.now())

  useEffect(()=>{
    if(!simulation)return
    const timer=window.setInterval(()=>{
      setSentinels(prev=>prev.map((s,i)=>{
        const hotspot=i===4 || i===2
        const wave=Math.sin(Date.now()/1700+i)*0.7
        return {...s,temp:hotspot?clamp(s.temp+0.10+wave*0.08,30,38):clamp(s.temp+wave*0.05,27,33),humidity:hotspot?clamp(s.humidity-0.18,48,70):clamp(s.humidity+wave*0.03,55,75),smoke:hotspot?clamp(s.smoke+0.7,5,42):clamp(s.smoke+wave*0.2,4,16),flame:hotspot&&s.temp>33?Math.min(1,s.flame+0.03):Math.max(0,s.flame-0.02)}))
      setLastUpdate(Date.now())
    },1000)
    return()=>window.clearInterval(timer)
  },[simulation])

  const scores=sentinels.map(score)
  const maxScore=Math.max(...scores)
  const eventPosition=useMemo(()=>{
    const weights=sentinels.map(score).map(v=>Math.max(v,1))
    const total=weights.reduce((a,b)=>a+b,0)
    return {x:sentinels.reduce((a,s,i)=>a+s.x*weights[i],0)/total,y:sentinels.reduce((a,s,i)=>a+s.y*weights[i],0)/total,uncertainty:Math.max(4,22-maxScore*0.17)}
  },[sentinels,maxScore])

  useEffect(()=>{
    if(maxScore<18)setEvent('NORMAL')
    else if(maxScore<35)setEvent('ENVIRONMENTAL ANOMALY')
    else if(maxScore<50)setEvent('SUSPICIOUS EVENT')
    else if(maxScore<68)setEvent('CORROBORATED EVENT')
    else if(maxScore<82)setEvent('PROBABLE FIRE EVENT')
    else setEvent('LOCALIZED EVENT')
  },[maxScore])

  const online=sentinels.filter(s=>s.health==='ONLINE').length
  const source:Source=hardware==='CONNECTED'?'REAL':simulation?'SIMULATION':'OFFLINE/REPLAY'
  const notify=(m:string)=>{setToast(m);window.setTimeout(()=>setToast(''),2600)}
  const sendMission=()=>{setRobot(r=>({...r,mission:`VERIFY ${Math.round(eventPosition.x)},${Math.round(eventPosition.y)}`,ack:'MISSION_ACK simulated'}));notify('Robot mission queued. In hardware mode this becomes a real BLE command.')}
  const connect=async()=>{
    const bt=(navigator as Navigator & {bluetooth?:any}).bluetooth
    if(!bt){notify('Web Bluetooth is unavailable in this browser. Use a supported Android/desktop browser.');return}
    try{setHardware('SCANNING');const device=await bt.requestDevice({acceptAllDevices:true,optionalServices:['7b6f0001-6d1e-4e5a-9a31-464952452d01']});await device.gatt?.connect();setHardware('CONNECTED');notify(`Connected: ${device.name||'FIRE-ECHO gateway'}`)}catch{setHardware('DISCONNECTED');notify('Hardware connection cancelled or failed.')}
  }

  const statusColor=event==='NORMAL'?'ok':event.includes('ANOMALY')?'warn':'danger'

  return <div className="app">
    <aside className={`sidebar ${sidebar?'open':''}`}>
      <div className="brand"><div className="brandMark"><Flame size={21}/></div><div><b>FIRE-ECHO</b><span>2.0 • ECO INTELLIGENCE</span></div></div>
      <div className="navLabel">COMMAND SYSTEM</div>
      <nav>{nav.map(n=>{const Icon=n.icon;return <button key={n.name} className={page===n.name?'active':''} onClick={()=>{setPage(n.name);setSidebar(false)}}><Icon size={17}/><span>{n.name}</span>{page===n.name&&<ChevronRight size={14} className="navArrow"/>}</button>})}</nav>
      <div className="sidebarFoot"><div className="sourceDot"/><div><b>{source}</b><span>DATA ORIGIN</span></div></div>
    </aside>
    {sidebar&&<div className="backdrop" onClick={()=>setSidebar(false)}/>} 
    <main>
      <header><button className="iconBtn mobileMenu" onClick={()=>setSidebar(true)}><Menu size={20}/></button><div><div className="eyebrow">ENVIRONMENTAL INTELLIGENCE NETWORK</div><h1>{page}</h1></div><div className="headerRight"><span className="live"><i/> {source}</span><span className="updated">Updated {Math.max(0,Math.floor((Date.now()-lastUpdate)/1000))}s ago</span><button className="iconBtn" onClick={()=>notify('Telemetry refresh requested')}><RefreshCw size={17}/></button></div></header>
      <section className="content">
        {page==='Home'&&<Home sentinels={sentinels} online={online} event={event} maxScore={maxScore} eventPosition={eventPosition} robot={robot} source={source} statusColor={statusColor} onMission={sendMission} onMap={()=>setPage('Live Map')} />}
        {page==='Live Map'&&<MapPage sentinels={sentinels} eventPosition={eventPosition} event={event} robot={robot}/>} 
        {page==='3D Digital Twin'&&<Twin sentinels={sentinels} eventPosition={eventPosition} robot={robot}/>} 
        {page==='Events'&&<Events event={event} maxScore={maxScore} position={eventPosition}/>} 
        {page==='Incident Command'&&<Command event={event} position={eventPosition} onMission={sendMission}/>} 
        {page==='Robot Control'&&<RobotPage robot={robot} onMission={sendMission}/>} 
        {page==='Sentinel Network'&&<SentinelPage sentinels={sentinels}/>} 
        {page==='Hardware Center'&&<Hardware hardware={hardware} connect={connect}/>} 
        {page==='Simulation Lab'&&<Simulation simulation={simulation} setSimulation={setSimulation} setSentinels={setSentinels}/>} 
        {page==='Analytics'&&<Analytics sentinels={sentinels}/>} 
        {page==='System Health'&&<Health online={online} sentinels={sentinels} hardware={hardware}/>} 
      </section>
    </main>
    {toast&&<div className="toast">{toast}</div>}
  </div>
}

function Home(p:{sentinels:Sentinel[];online:number;event:EventState;maxScore:number;eventPosition:{x:number;y:number;uncertainty:number};robot:Robot;source:Source;statusColor:string;onMission:()=>void;onMap:()=>void}){
  return <><div className="heroGrid"><div className="heroCard"><div className="heroTitle"><div><span className="kicker">NETWORK STATUS</span><h2>Forest perimeter intelligence</h2><p>Distributed sensing • adaptive observation • mobile verification</p></div><span className={`pill ${p.statusColor}`}>{p.event}</span></div><div className="heroStats"><Metric icon={<Satellite/>} label="Sentinels" value={`${p.online}/${p.sentinels.length}`} sub="online"/><Metric icon={<Thermometer/>} label="Peak temperature" value={`${Math.max(...p.sentinels.map(s=>s.temp)).toFixed(1)}°C`} sub="network"/><Metric icon={<Activity/>} label="Event confidence" value={`${Math.round(p.maxScore)}%`} sub="rule-based score"/><Metric icon={<Bot/>} label="Verifier" value={p.robot.connected?'CONNECTED':'STANDBY'} sub="mobile unit"/></div></div><div className="mapCard"><MapView sentinels={p.sentinels} eventPosition={p.eventPosition} robot={p.robot}/><button className="mapOpen" onClick={p.onMap}>Open live map <ChevronRight size={15}/></button></div></div><div className="threeCols"><div className="panel"><SectionTitle title="EVENT PIPELINE"/><Pipeline event={p.event}/></div><div className="panel"><SectionTitle title="LOCALIZATION"/><div className="locBig">{p.eventPosition.x.toFixed(1)}<span> , </span>{p.eventPosition.y.toFixed(1)}</div><div className="muted">Normalized forest coordinates • ±{p.eventPosition.uncertainty.toFixed(1)}m model uncertainty</div><button className="primary" onClick={p.onMission}><Bot size={16}/> Dispatch verifier</button></div><div className="panel"><SectionTitle title="DATA INTEGRITY"/><div className="integrity"><Check text="Multi-node corroboration"/><Check text="Sector baseline active"/><Check text="Single-sensor fault isolation"/><Check text="Offline replay supported"/></div></div></div></>
}
function Metric({icon,label,value,sub}:{icon:React.ReactNode;label:string;value:string;sub:string}){return <div className="metric"><div className="metricIcon">{icon}</div><span>{label}</span><b>{value}</b><small>{sub}</small></div>}
function SectionTitle({title}:{title:string}){return <div className="sectionTitle"><span>{title}</span><CircleDot size={12}/></div>}
function Check({text}:{text:string}){return <div className="check"><span>✓</span>{text}</div>}
function Pipeline({event}:{event:EventState}){const states=['NORMAL','ENVIRONMENTAL ANOMALY','SUSPICIOUS EVENT','CORROBORATED EVENT','PROBABLE FIRE EVENT','LOCALIZED EVENT'];const active=states.indexOf(event);return <div className="pipeline">{states.map((s,i)=><div className={i<=active?'pipe active':'pipe'} key={s}><i/>{s}</div>)}</div>}

function MapView({sentinels,eventPosition,robot}:{sentinels:Sentinel[];eventPosition:{x:number;y:number;uncertainty:number};robot:Robot}){return <div className="map"><div className="mapGrid"/><div className="north">N</div>{sentinels.map(s=><div key={s.id} className={`node ${s.health.toLowerCase()}`} style={{left:`${s.x}%`,top:`${s.y}%`}}><span>{s.id}</span></div>)}<div className="uncertainty" style={{left:`${eventPosition.x}%`,top:`${eventPosition.y}%`,width:`${eventPosition.uncertainty*2.4}%`,height:`${eventPosition.uncertainty*2.4}%`}}/><div className="eventPin" style={{left:`${eventPosition.x}%`,top:`${eventPosition.y}%`}}><Flame size={15}/></div><div className="robotDot" style={{left:`${robot.x}%`,top:`${robot.y}%`}}><Bot size={14}/></div><div className="mapLegend"><span><i className="green"/>SENTINEL</span><span><i className="orange"/>EVENT ESTIMATE</span><span><i className="blue"/>ROBOT</span></div></div>}
function MapPage(p:{sentinels:Sentinel[];eventPosition:{x:number;y:number;uncertainty:number};event:EventState;robot:Robot}){return <div className="pageGrid"><div className="panel mapLarge"><div className="panelTop"><div><SectionTitle title="LIVE FOREST MAP"/><h2>Distributed observation field</h2></div><span className="pill warn">{p.event}</span></div><MapView {...p}/></div><div className="panel sidePanel"><SectionTitle title="LOCALIZATION MODEL"/><div className="locBig">{p.eventPosition.x.toFixed(1)} / {p.eventPosition.y.toFixed(1)}</div><p className="muted">Weighted centroid from {p.sentinels.length} configured sentinels.</p><hr/><SectionTitle title="COVERAGE"/><div className="coverage"><b>84%</b><span>configured observation coverage</span></div><div className="bar"><i style={{width:'84%'}}/></div><hr/><SectionTitle title="UNCERTAINTY"/><div className="coverage"><b>±{p.eventPosition.uncertainty.toFixed(1)}m</b><span>current estimate radius</span></div></div></div>}
function Twin({sentinels,eventPosition,robot}:{sentinels:Sentinel[];eventPosition:{x:number;y:number;uncertainty:number};robot:Robot}){return <div className="panel twin"><div className="twinScene"><div className="sky"/><div className="terrain">{Array.from({length:42},(_,i)=><span key={i} style={{left:`${(i*17)%100}%`,top:`${(i*29)%82}%`,transform:`scale(${0.5+(i%4)*0.22})`}}>▲</span>)}</div>{sentinels.map(s=><div key={s.id} className="tower" style={{left:`${s.x}%`,top:`${s.y}%`}}><div className="towerStem"/><div className="towerTop"/><label>{s.id}</label></div>)}<div className="twinEvent" style={{left:`${eventPosition.x}%`,top:`${eventPosition.y}%`}}/><div className="twinRobot" style={{left:`${robot.x}%`,top:`${robot.y}%`}}><Bot size={20}/></div></div><div className="twinFooter"><div><b>DIGITAL TWIN</b><span>Data-driven scene • coordinate system shared with map and robot</span></div><span className="pill ok">LIVE MODEL</span></div></div>}
function Events({event,maxScore,position}:{event:EventState;maxScore:number;position:{x:number;y:number;uncertainty:number}}){return <div className="pageGrid two"><div className="panel"><SectionTitle title="CURRENT EVENT"/><div className="eventHeadline"><Flame/><div><b>{event}</b><span>Adaptive state machine</span></div></div><div className="eventScore"><span>Event confidence score</span><b>{Math.round(maxScore)}<small>/100</small></b><div className="bar"><i style={{width:`${maxScore}%`}}/></div></div><Pipeline event={event}/></div><div className="panel"><SectionTitle title="EVENT LOG"/><div className="timeline"><Log t="T+00:00" text="Network baseline synchronized"/><Log t="T+00:12" text="Sensor observations fused"/><Log t="T+00:18" text="Adaptive observation priority increased"/><Log t="NOW" text={`Localization estimate ${position.x.toFixed(1)}, ${position.y.toFixed(1)}`}/></div></div></div>}
function Log({t,text}:{t:string;text:string}){return <div className="log"><b>{t}</b><span>{text}</span></div>}
function Command({event,position,onMission}:{event:EventState;position:{x:number;y:number};onMission:()=>void}){return <div className="command"><div className="commandBanner"><ShieldCheck size={32}/><div><b>INCIDENT COMMAND</b><span>{event}</span></div></div><div className="commandGrid"><div className="panel"><SectionTitle title="RECOMMENDED ACTION"/><h2>Verify before escalation</h2><p className="muted">FIRE-ECHO uses distributed evidence first. A mobile verifier is dispatched only after the network identifies a suspicious sector.</p><button className="primary" onClick={onMission}><Bot size={17}/> Dispatch verification robot</button></div><div className="panel"><SectionTitle title="TARGET"/><div className="target"><span>X</span><b>{position.x.toFixed(2)}</b><span>Y</span><b>{position.y.toFixed(2)}</b></div><p className="muted">Target is an estimated location, not a single-sensor exact coordinate.</p></div></div></div>}
function RobotPage({robot,onMission}:{robot:Robot;onMission:()=>void}){return <div className="pageGrid two"><div className="panel"><SectionTitle title="MOBILE VERIFIER"/><div className="robotVisual"><Bot size={76}/><span>{robot.connected?'CONNECTED':'STANDBY'}</span></div><div className="robotStats"><Metric icon={<Battery/>} label="Battery" value={`${robot.battery}%`} sub="estimated"/><Metric icon={<Wifi/>} label="Link" value={robot.connected?'BLE':'LOCAL'} sub="gateway"/></div></div><div className="panel"><SectionTitle title="MISSION CONTROL"/><div className="commandLine"><span>MISSION</span><b>{robot.mission}</b></div><div className="commandLine"><span>ACK</span><b>{robot.ack}</b></div><button className="primary" onClick={onMission}><Bot size={17}/> Send verification mission</button><p className="muted">In simulation this is a safe virtual mission. In hardware mode commands are sent to the ESP32 robot controller.</p></div></div>}
function SentinelPage({sentinels}:{sentinels:Sentinel[]}){return <div className="panel"><SectionTitle title="SENTINEL NETWORK"/><div className="table"><div className="tr head"><span>ID</span><span>TEMP</span><span>HUM</span><span>SMOKE</span><span>BAT</span><span>SIGNAL</span><span>HEALTH</span></div>{sentinels.map(s=><div className="tr" key={s.id}><span><b>{s.id}</b><small>{formatSource(s.source)}</small></span><span>{s.temp.toFixed(1)}°</span><span>{s.humidity.toFixed(0)}%</span><span>{s.smoke.toFixed(0)}</span><span>{s.battery}%</span><span>{s.signal}%</span><span className="healthDot">● {s.health}</span></div>)}</div></div>}
function Hardware({hardware,connect}:{hardware:string;connect:()=>void}){return <div className="pageGrid two"><div className="panel"><SectionTitle title="HARDWARE CENTER"/><div className={`connection ${hardware==='CONNECTED'?'connected':''}`}><div className="connectionIcon"><Cpu/></div><div><b>{hardware}</b><span>ESP32 gateway / BLE transport</span></div></div><button className="primary" onClick={connect}><BluetoothIcon/> {hardware==='CONNECTED'?'Connected':'Scan & connect gateway'}</button><p className="muted">No simulated hardware is reported as real. The dashboard changes to REAL only after a browser BLE connection succeeds.</p></div><div className="panel"><SectionTitle title="PROTOCOL"/><div className="protocol"><code>service: 7b6f0001…</code><code>telemetry: …0002</code><code>command: …0003</code><code>status: …0004</code><code>config: …0005</code></div></div></div>}
function BluetoothIcon(){return <Wifi size={17}/>} 
function Simulation({simulation,setSimulation,setSentinels}:{simulation:boolean;setSimulation:(v:boolean)=>void;setSentinels:(s:Sentinel[])=>void}){const trigger=()=>setSentinels(initialSentinels.map(s=>s.id==='S-05'?{...s,temp:37.8,humidity:47,smoke:38,flame:0.9}:s));return <div className="pageGrid two"><div className="panel"><SectionTitle title="SIMULATION LAB"/><h2>Safe environmental event generator</h2><p className="muted">Synthetic telemetry uses the same fusion and visualization path as hardware telemetry. No flame or hazardous test is required.</p><div className="switchRow"><span>Live synthetic telemetry</span><button className={`switch ${simulation?'on':''}`} onClick={()=>setSimulation(!simulation)}><i/></button></div><button className="primary" onClick={trigger}><Flame size={17}/> Inject safe hotspot pattern</button><button className="ghost" onClick={()=>setSentinels(initialSentinels)}>Reset baseline</button></div><div className="panel"><SectionTitle title="DATA ORIGIN CONTRACT"/><div className="sourceCards"><div><b>SIMULATION</b><span>Generated by the local engine</span></div><div><b>REAL</b><span>Only after confirmed BLE telemetry</span></div><div><b>OFFLINE / REPLAY</b><span>Stored event history without pretending it is live</span></div></div></div></div>}
function Analytics({sentinels}:{sentinels:Sentinel[]}){return <div className="pageGrid three"><div className="panel chart"><SectionTitle title="TEMPERATURE PROFILE"/><div className="bars">{sentinels.map(s=><div key={s.id}><i style={{height:`${clamp((s.temp-24)*12,12,100)}%`}}/><span>{s.id}</span></div>)}</div></div><div className="panel"><SectionTitle title="NETWORK AVERAGES"/><Metric icon={<Thermometer/>} label="Temperature" value={`${(sentinels.reduce((a,s)=>a+s.temp,0)/sentinels.length).toFixed(1)}°C`} sub="average"/><Metric icon={<Activity/>} label="Smoke index" value={`${(sentinels.reduce((a,s)=>a+s.smoke,0)/sentinels.length).toFixed(1)}`} sub="normalized"/></div><div className="panel"><SectionTitle title="DESIGN PRINCIPLES"/><div className="integrity"><Check text="Sector-specific baselines"/><Check text="Weighted spatial estimate"/><Check text="Fault-tolerant corroboration"/><Check text="Adaptive observation priority"/></div></div></div>}
function Health({online,sentinels,hardware}:{online:number;sentinels:Sentinel[];hardware:string}){return <div className="pageGrid three"><HealthCard title="SENTINEL MESH" value={`${online}/${sentinels.length}`} detail="nodes online" ok={online===sentinels.length}/><HealthCard title="BLE HARDWARE" value={hardware} detail="gateway state" ok={hardware==='CONNECTED'}/><HealthCard title="FUSION ENGINE" value="RUNNING" detail="rule-based scorer" ok/></div>}
function HealthCard({title,value,detail,ok}:{title:string;value:string;detail:string;ok:boolean}){return <div className="panel healthCard"><SectionTitle title={title}/><div className={ok?'healthOk':'healthWarn'}>{ok?<ShieldCheck/>:<WifiOff/>}<b>{value}</b></div><span className="muted">{detail}</span></div>}

export default App
