import { useState, useEffect, useRef } from "react";
import { Home, BarChart2, Utensils, Trophy, MessageCircle, User, ChevronRight, ChevronLeft, Check, Plus, Trash2, Sparkles, Clock, Heart, Star, LogOut, Send, Droplets, Weight, Moon, Zap, Lock, MessageSquare, X, Activity, Shield, FileText, AlertCircle } from "lucide-react";

// ── TOKENS ─────────────────────────────────────────────────────────────────
const C = {
  bg:"var(--bg,#0b0b0d)", surf:"var(--surf,rgba(255,255,255,0.055))", border:"var(--border,rgba(255,255,255,0.09))",
  pink:"#f0059a", pinkD:"#c0027c", pinkG:"rgba(240,5,154,0.25)", pinkL:"rgba(240,5,154,0.12)",
  text:"var(--text,#f0f0f4)", muted:"var(--muted,#8a8aa0)", success:"#1fcc74", warn:"#f59e0b",
  danger:"#f43f5e", gold:"#eab308", silver:"#94a3b8", bronze:"#b45309", purple:"#a78bfa", blue:"#38bdf8"
};
const gl=(x={})=>({background:"var(--surf,rgba(255,255,255,0.055))",border:"1px solid var(--border,rgba(255,255,255,0.09))",backdropFilter:"blur(20px)",borderRadius:20,...x});
const pb=(x={})=>({background:`linear-gradient(135deg,${C.pink},${C.pinkD})`,color:"#fff",border:"none",borderRadius:16,padding:"18px 28px",fontWeight:700,fontSize:17,cursor:"pointer",minHeight:58,display:"flex",alignItems:"center",justifyContent:"center",gap:10,boxShadow:`0 6px 28px ${C.pinkG}`,fontFamily:"inherit",...x});
const gb=(x={})=>({background:"var(--btn-ghost,rgba(255,255,255,0.06))",color:C.muted,border:`1px solid ${C.border}`,borderRadius:16,padding:"18px 24px",fontWeight:600,fontSize:16,cursor:"pointer",minHeight:58,display:"flex",alignItems:"center",justifyContent:"center",gap:8,fontFamily:"inherit",...x});
const inp={background:"var(--input-bg,rgba(255,255,255,0.05))",border:"1.5px solid var(--border,rgba(255,255,255,0.09))",borderRadius:13,padding:"16px 18px",color:"var(--text,#f0f0f4)",fontSize:16,width:"100%",outline:"none",fontFamily:"inherit",transition:"all 0.2s"};

// ── CSS ─────────────────────────────────────────────────────────────────────
function GCss({isDark}){
  const bg=isDark?"#0b0b0d":"#f2f2f5";
  const surf=isDark?"rgba(255,255,255,0.055)":"rgba(0,0,0,0.055)";
  const border=isDark?"rgba(255,255,255,0.09)":"rgba(0,0,0,0.09)";
  const text=isDark?"#f0f0f4":"#0a0a0d";
  const muted=isDark?"#8a8aa0":"#6b6b80";
  const card=isDark?"rgba(255,255,255,0.055)":"rgba(255,255,255,0.9)";
  const shadow=isDark?"rgba(0,0,0,0.4)":"rgba(0,0,0,0.08)";
  return(<style>{`
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  html,body{font-family:'DM Sans','Outfit',-apple-system,sans-serif;-webkit-font-smoothing:antialiased;transition:background 0.35s ease,color 0.35s ease}
  :root{--bg:${bg};--surf:${surf};--border:${border};--text:${text};--muted:${muted};--card:${card};--shadow:${shadow}}
  body{background:var(--bg)!important;color:var(--text)!important}
  ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:#f0059a55;border-radius:4px}
  @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  @keyframes slideR{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}
  @keyframes slideL{from{opacity:0;transform:translateX(-20px)}to{opacity:1;transform:translateX(0)}}
  @keyframes glow{0%,100%{box-shadow:0 0 20px ${C.pinkG}}50%{box-shadow:0 0 44px rgba(240,5,154,0.55)}}
  @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
  @keyframes p1{0%,100%{transform:scale(1) translate(0,0)}50%{transform:scale(1.08) translate(18px,22px)}}
  @keyframes p2{0%,100%{transform:scale(1) translate(0,0)}50%{transform:scale(0.92) translate(-14px,16px)}}
  @keyframes xpG{from{width:0%}}
  @keyframes scaleIn{from{opacity:0;transform:scale(0.92)}to{opacity:1;transform:scale(1)}}
  @keyframes sideSlideIn{from{opacity:0;transform:translateX(-100%)}to{opacity:1;transform:translateX(0)}}
  @keyframes sideSlideOut{from{opacity:1;transform:translateX(0)}to{opacity:0;transform:translateX(-100%)}}
  @keyframes blurIn{from{backdrop-filter:blur(0px);background:transparent}to{backdrop-filter:blur(8px);background:rgba(0,0,0,0.45)}}
  @keyframes shimmerPink{0%{background-position:200% center}100%{background-position:-200% center}}
  @keyframes accordOpen{from{max-height:0;opacity:0;transform:translateY(-6px)}to{max-height:600px;opacity:1;transform:translateY(0)}}
  @keyframes checkPop{0%{transform:scale(0)}60%{transform:scale(1.15)}100%{transform:scale(1)}}
  button{transition:all 0.2s cubic-bezier(0.4,0,0.2,1)!important;font-family:inherit}
  button:hover{transform:translateY(-1px);opacity:0.92}
  button:active{transform:scale(0.97) translateY(0)!important}
  input:focus,textarea:focus{border-color:${C.pink}!important;box-shadow:0 0 0 3px ${C.pinkG}!important;outline:none!important}
  input[type=range]{-webkit-appearance:none;height:5px;border-radius:3px;background:var(--border);cursor:pointer}
  input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:22px;height:22px;border-radius:50%;background:${C.pink};box-shadow:0 0 10px ${C.pinkG}}
  textarea{font-family:inherit;resize:none}
  /* Light mode surface override */
  body.light .gl-card{background:rgba(0,0,0,0.05)!important;border-color:rgba(0,0,0,0.1)!important;}
  .accord{animation:accordOpen 0.3s cubic-bezier(0.4,0,0.2,1) forwards;overflow:hidden}
`}</style>);}

function BG(){return(<div style={{position:"fixed",inset:0,zIndex:0,overflow:"hidden",background:C.bg}}>
  <div style={{position:"absolute",top:"5%",left:"-5%",width:560,height:560,borderRadius:"50%",background:"radial-gradient(circle,rgba(240,5,154,0.08) 0%,transparent 70%)",filter:"blur(70px)",animation:"p1 11s ease-in-out infinite"}}/>
  <div style={{position:"absolute",bottom:"8%",right:"-3%",width:440,height:440,borderRadius:"50%",background:"radial-gradient(circle,rgba(167,139,250,0.06) 0%,transparent 70%)",filter:"blur(80px)",animation:"p2 14s ease-in-out infinite"}}/>
  <div style={{position:"absolute",inset:0,opacity:0.015,backgroundImage:"radial-gradient(circle at 1px 1px,rgba(255,255,255,0.5) 1px,transparent 0)",backgroundSize:"36px 36px"}}/>
</div>);}

function Logo({size=46,showText=true,glow=false}){return(
  <div style={{display:"flex",alignItems:"center",gap:13}}>
    <div style={{width:size,height:size,borderRadius:"50%",background:"radial-gradient(circle at 35% 35%,#1a1a2a,#060610)",border:`2px solid ${C.pink}`,boxShadow:`0 0 ${size*0.45}px ${C.pinkG}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,animation:glow?"glow 4s ease-in-out infinite":"none"}}>
      <span style={{color:C.pink,fontWeight:900,fontSize:size*0.3,letterSpacing:"-0.5px"}}>GMP</span>
    </div>
    {showText&&<div><div style={{color:C.text,fontWeight:800,fontSize:18,lineHeight:1.1}}>Guia Metabólico</div><div style={{color:C.pink,fontWeight:600,fontSize:13}}>Personalizado</div></div>}
  </div>
);}

function Av({emoji,color,size=46,glow=false}){return(
  <div style={{width:size,height:size,borderRadius:"50%",background:`${color||C.pink}22`,border:`2px solid ${color||C.pink}55`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*0.48,flexShrink:0,boxShadow:glow?`0 0 24px ${color||C.pink}66`:"none",transition:"all 0.3s"}}>{emoji}</div>
);}

const LVS=[{n:1,nm:"Iniciante",min:0,col:C.muted},{n:2,nm:"Comprometida",min:100,col:C.success},{n:3,nm:"Disciplinada",min:300,col:C.blue},{n:4,nm:"Guerreira",min:600,col:C.purple},{n:5,nm:"Campeã 4D",min:1000,col:C.gold}];
const gLv=xp=>LVS.slice().reverse().find(l=>xp>=l.min)||LVS[0];
function XPBar({xp}){
  const lv=gLv(xp),nx=LVS.find(l=>l.n===lv.n+1);
  const pct=nx?Math.min(100,((xp-lv.min)/(nx.min-lv.min))*100):100;
  return(<div style={{display:"flex",alignItems:"center",gap:10,flex:1,maxWidth:300}}>
    <div style={{width:30,height:30,borderRadius:8,background:`${lv.col}22`,border:`1px solid ${lv.col}44`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Star size={13} color={lv.col}/></div>
    <div style={{flex:1}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{color:lv.col,fontSize:12,fontWeight:700}}>{lv.nm}</span><span style={{color:C.muted,fontSize:11}}>{xp} XP</span></div>
      <div style={{height:5,borderRadius:3,background:"var(--btn-ghost)",overflow:"hidden"}}><div style={{height:"100%",width:`${pct}%`,borderRadius:3,background:`linear-gradient(90deg,${lv.col},${C.pink})`,animation:"xpG 1s ease",boxShadow:`0 0 8px ${lv.col}66`}}/></div>
    </div>
  </div>);}

function MC({data,color,yKey,xKey,h=90}){
  if(!data||data.length<2)return null;
  const vals=data.map(d=>d[yKey]),mn=Math.min(...vals)-4,mx=Math.max(...vals)+4,W=300;
  const px=i=>(i/(data.length-1))*(W-24)+12,py=v=>h-((v-mn)/(mx-mn))*(h-16)-4;
  const path=data.map((d,i)=>`${i===0?"M":"L"} ${px(i)} ${py(d[yKey])}`).join(" ");
  const gid=`gc${color.replace("#","")}${h}`;
  return(<svg viewBox={`0 0 ${W} ${h}`} style={{width:"100%",height:h}}>
    <defs><linearGradient id={gid} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.3"/><stop offset="100%" stopColor={color} stopOpacity="0.02"/></linearGradient></defs>
    <path d={`${path} L ${px(data.length-1)} ${h} L ${px(0)} ${h} Z`} fill={`url(#${gid})`}/>
    <path d={path} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    {data.map((d,i)=>(<g key={i}><circle cx={px(i)} cy={py(d[yKey])} r={i===data.length-1?5:3} fill={color} opacity={i===data.length-1?1:0.5}/><text x={px(i)} y={h+1} textAnchor="middle" fill="var(--muted,#8a8aa0)" fontSize="9">{d[xKey]}</text></g>))}
  </svg>);}
// ── DATA ───────────────────────────────────────────────────────────────────
const BADGES=[
  {id:"b1",e:"🌟",nm:"Primeiro Passo",ds:"Completou o cadastro inicial",xp:50,ct:"Sistema",ok:true},
  {id:"b2",e:"📅",nm:"7 Dias no Ritmo",ds:"Seguiu o cardápio por 7 dias",xp:150,ct:"Alimentação",ok:true},
  {id:"b3",e:"📉",nm:"Glicemia em Queda",ds:"Reduziu a glicemia em 20%",xp:200,ct:"Saúde",ok:true},
  {id:"b4",e:"💬",nm:"Curiosa",ds:"Fez 10 perguntas ao Chat IA",xp:80,ct:"Sistema",ok:true},
  {id:"b5",e:"🔥",nm:"30 Dias Ativa",ds:"Usou o sistema por 30 dias",xp:300,ct:"Sistema",ok:false},
  {id:"b6",e:"🏆",nm:"Top 10",ds:"Entrou no top 10 do ranking",xp:250,ct:"Ranking",ok:false},
  {id:"b7",e:"💪",nm:"Semana Vencida",ds:"Completou a primeira semana",xp:100,ct:"Alimentação",ok:true},
  {id:"b8",e:"📊",nm:"Monitor Assídua",ds:"Registrou glicemia por 30 dias",xp:280,ct:"Saúde",ok:false},
  {id:"b9",e:"🌙",nm:"Sono de Qualidade",ds:"Registrou sono 5+ por 7 noites",xp:130,ct:"Saúde",ok:true},
  {id:"b10",e:"🤝",nm:"Comunidade",ds:"Reagiu a 10 conquistas",xp:90,ct:"Social",ok:true},
  {id:"b11",e:"⚡",nm:"Velocista",ds:"Iniciou rapidamente no sistema",xp:60,ct:"Sistema",ok:true},
  {id:"b12",e:"🎯",nm:"Meta Batida",ds:"Atingiu primeira meta de peso",xp:220,ct:"Saúde",ok:false},
];
const RKG=[
  {p:1,nm:"Ana Beatriz",nk:"@anabea",e:"👑",col:C.gold,xp:1420,st:45},
  {p:2,nm:"Carla Mendes",nk:"@carlinha",e:"🔥",col:C.pink,xp:1180,st:38},
  {p:3,nm:"Priscila S.",nk:"@prisilva",e:"💎",col:C.purple,xp:980,st:31},
  {p:4,nm:"Fernanda L.",nk:"@ferlima",e:"🌺",col:C.success,xp:820,st:28},
  {p:5,nm:"Juliana C.",nk:"@juju",e:"⭐",col:C.blue,xp:710,st:22},
  {p:6,nm:"Mariana A.",nk:"@mari",e:"🌸",col:"#fb7185",xp:640,st:19},
  {p:7,nm:"Tatiane R.",nk:"@tati",e:"🦋",col:"#34d399",xp:580,st:17},
  {p:8,nm:"Você",nk:"@voce",e:"🌙",col:C.pink,xp:520,st:14,me:true},
  {p:9,nm:"Roberta D.",nk:"@robi",e:"🍀",col:"#fbbf24",xp:480,st:12},
  {p:10,nm:"Simone N.",nk:"@sisi",e:"🌿",col:"#6ee7b7",xp:410,st:10}
];
const FEED0=[
  {id:"f1",u:"Ana Beatriz",e:"👑",col:C.gold,b:"🔥",bn:"30 Dias Ativa",t:"há 2h",lk:14,cm:[{u:"Carla",t:"Incrível!! 🎉"},{u:"Priscila",t:"Arrasou! 💪"}],liked:false},
  {id:"f2",u:"Carla Mendes",e:"🔥",col:C.pink,b:"📉",bn:"Glicemia em Queda",t:"há 5h",lk:22,cm:[{u:"Ana",t:"Que conquista!! 🏆"}],liked:true},
  {id:"f3",u:"Priscila S.",e:"💎",col:C.purple,b:"📅",bn:"7 Dias no Ritmo",t:"há 1d",lk:9,cm:[],liked:false}
];
const EX0={
  glicemia:[{m:"Nov",v:165},{m:"Dez",v:148},{m:"Jan",v:132},{m:"Fev",v:121},{m:"Mar",v:109},{m:"Abr",v:98}],
  hba1c:[{m:"Nov",v:8.1},{m:"Jan",v:7.4},{m:"Mar",v:6.8},{m:"Abr",v:6.1}],
  peso:[{m:"Nov",v:84.0},{m:"Dez",v:83.2},{m:"Jan",v:82.1},{m:"Fev",v:81.4},{m:"Mar",v:80.1},{m:"Abr",v:79.6}]
};
const ORDERS=[
  {id:"eo1",dt:"28/04/2026",st:"Pendente",ex:["Glicemia em jejum","HbA1c","Insulina em jejum","Peptídeo C"],ins:"Jejum mínimo 12h. Coletar pela manhã."},
  {id:"eo2",dt:"15/03/2026",st:"Realizado",ex:["Perfil lipídico","TSH","T4 livre","Ferritina","Vitamina D"],ins:"Jejum de 12 horas."},
  {id:"eo3",dt:"10/01/2026",st:"Realizado",ex:["Glicemia","HbA1c","Urina tipo 1","Creatinina"],ins:"Coleta em laboratório credenciado."}
];
const REC=[
  {id:"r1",e:"🥚",nm:"Omelete de Legumes",tm:"15 min",kc:280,ct:"Café da manhã",df:"Fácil",ig:["3 ovos","Abobrinha","Tomate","Sal e ervas"],st:["Bata os ovos com sal.","Refogue legumes no azeite.","Despeje e tampe 3 min.","Sirva com folhas verdes."]},
  {id:"r2",e:"🐟",nm:"Salmão com Aspargos",tm:"20 min",kc:380,ct:"Almoço",df:"Médio",ig:["200g salmão","Aspargos","Azeite","Limão"],st:["Tempere o salmão.","Grelhe 4 min/lado.","Refogue aspargos.","Sirva com limão."]},
  {id:"r3",e:"🥗",nm:"Bowl Low-Carb Frango",tm:"25 min",kc:320,ct:"Almoço",df:"Fácil",ig:["150g frango","Rúcula","Abacate","Azeite"],st:["Grelhe o frango.","Monte bowl com rúcula.","Adicione abacate.","Regue com azeite."]},
  {id:"r4",e:"🍳",nm:"Fritata de Espinafre",tm:"20 min",kc:260,ct:"Jantar",df:"Fácil",ig:["4 ovos","Espinafre","Queijo minas","Alho"],st:["Refogue espinafre.","Bata ovos com queijo.","Combine na frigideira.","Forno 10 min 180°C."]},
  {id:"r5",e:"🥑",nm:"Mousse de Abacate",tm:"10 min",kc:200,ct:"Lanche",df:"Fácil",ig:["1 abacate","Cacau em pó","Stevia"],st:["Amasse o abacate.","Adicione cacau e stevia.","Misture bem.","Sirva gelado."]},
  {id:"r6",e:"🍲",nm:"Caldo de Frango",tm:"40 min",kc:180,ct:"Ceia",df:"Médio",ig:["Frango","Chuchu","Cenoura","Ervas"],st:["Cozinhe frango 30 min.","Adicione legumes.","Tempere.","Coe e sirva."]}
];
const CHAT_RESP=["Com frango, abobrinha e ovos você pode fazer uma fritata proteica! Refogue a abobrinha, cubra com os ovos batidos e tampe. Pronto em 15 min e mantém a glicemia estável 🍳","Sua glicemia está em queda consistente — parabéns! Continue focada no cardápio 📊✨","Esse alimento está liberado para você! Quer sugestão de preparo? 🥗","Para o seu lanche: 10 amêndoas + queijo minas + água com limão 💪","Sua HbA1c caiu de 8,1% para 6,1% — resultado extraordinário! Continue assim 💕","Ótima pergunta! Para controle glicêmico, sempre combine proteína com fibras. Isso retarda a absorção do açúcar e reduz os picos 🌿"];
let chatIdx=0;
const getReceitaHora=()=>{
  const h=new Date().getHours();
  if(h<10) return REC[0];
  if(h<12) return REC[4];
  if(h<15) return REC[2];
  if(h<18) return REC[4];
  if(h<21) return REC[3];
  return REC[5];
};
const REFEICOES_DIA=[
  {id:"r1",icon:"☀️",nome:"Café da manhã",hora:"07:00",desc:"Omelete de espinafre + café sem açúcar"},
  {id:"r2",icon:"🍎",nome:"Lanche da manhã",hora:"10:00",desc:"10 amêndoas + 1 fatia queijo minas"},
  {id:"r3",icon:"🍽️",nome:"Almoço",hora:"12:30",desc:"Frango grelhado + brócolis + salada verde"},
  {id:"r4",icon:"🌤️",nome:"Lanche da tarde",hora:"15:30",desc:"Iogurte grego natural + morangos"},
  {id:"r5",icon:"🌙",nome:"Jantar",hora:"19:00",desc:"Filé de peixe + abobrinha + tomate"},
  {id:"r6",icon:"🌛",nome:"Ceia",hora:"21:30",desc:"Chá de camomila + castanhas"},
];
const DICAS=[
  {e:"🧠",ti:"Mastigue devagar",tx:"Mastigar lentamente reduz picos glicêmicos em até 18% — dê pelo menos 20 mastigadas por bocado."},
  {e:"💧",ti:"Beba água antes de comer",tx:"Um copo de água 15 min antes das refeições ajuda a controlar o apetite e melhora a digestão."},
  {e:"🌿",ti:"Comece pelos vegetais",tx:"Inicie sempre pelos legumes e folhas. Isso retarda a absorção do açúcar e reduz os picos glicêmicos."},
  {e:"⏰",ti:"Respeite os horários",tx:"Comer nos mesmos horários todos os dias estabiliza o metabolismo e facilita o controle da glicemia."},
];
const DIAGS_LIST=["Diabetes tipo 2","Pré-diabetes","Resistência à insulina","Hipertensão arterial","Colesterol elevado","Hipotireoidismo","SOP","Doença renal crônica","Doença cardíaca","Esteatose hepática"];
// ── FORM PRIMITIVES ─────────────────────────────────────────────────────────
function FInput({label,placeholder,type="text",value,onChange,unit,hint}){
  const[f,setF]=useState(false);
  return(<div style={{marginBottom:18}}>
    {label&&<label style={{color:C.muted,fontSize:15,fontWeight:600,display:"block",marginBottom:8}}>{label}</label>}
    <div style={{position:"relative",display:"flex",alignItems:"center"}}>
      <input type={type} value={value} onChange={onChange} placeholder={placeholder||""} onFocus={()=>setF(true)} onBlur={()=>setF(false)}
        style={{...inp,borderColor:f?C.pink:C.border,boxShadow:f?`0 0 0 3px ${C.pinkG}`:"none",paddingRight:unit?"54px":undefined}}/>
      {unit&&<span style={{position:"absolute",right:16,color:C.muted,fontSize:14,fontWeight:600,pointerEvents:"none"}}>{unit}</span>}
    </div>
    {hint&&<div style={{color:C.muted,fontSize:13,marginTop:5}}>{hint}</div>}
  </div>);}
function FTextarea({label,placeholder,value,onChange,minHeight=90}){
  const[f,setF]=useState(false);
  return(<div style={{marginBottom:18}}>
    {label&&<label style={{color:C.muted,fontSize:15,fontWeight:600,display:"block",marginBottom:8}}>{label}</label>}
    <textarea value={value} onChange={onChange} placeholder={placeholder||""} onFocus={()=>setF(true)} onBlur={()=>setF(false)}
      style={{...inp,minHeight,lineHeight:1.6,borderColor:f?C.pink:C.border,boxShadow:f?`0 0 0 3px ${C.pinkG}`:"none"}}/>
  </div>);}
function ChkCard({label,selected,onClick}){return(
  <button onClick={onClick} style={{display:"flex",alignItems:"center",gap:12,padding:"15px 18px",borderRadius:14,border:`1.5px solid ${selected?C.pink:C.border}`,background:selected?C.pinkL:"var(--surf)",color:selected?C.text:C.muted,width:"100%",textAlign:"left",fontWeight:600,fontSize:15,boxShadow:selected?`0 0 0 1px ${C.pink}44`:"none",marginBottom:8}}>
    <div style={{width:22,height:22,borderRadius:"50%",background:selected?`linear-gradient(135deg,${C.pink},${C.pinkD})`:"var(--btn-ghost)",border:selected?"none":`1.5px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all 0.2s"}}>
      {selected&&<Check size={12} color="#fff" style={{animation:"checkPop 0.25s ease"}}/>}
    </div>
    {label}
  </button>);}
function Likert({value,onChange,L,R}){return(
  <div style={{marginBottom:4}}>
    <div style={{display:"flex",gap:10,marginBottom:8}}>
      {[1,2,3,4,5].map(n=>(
        <button key={n} onClick={()=>onChange(n)} style={{flex:1,height:54,borderRadius:14,border:`1.5px solid ${value===n?C.pink:C.border}`,background:value===n?`linear-gradient(135deg,${C.pink},${C.pinkD})`:"var(--btn-ghost)",color:value===n?"#fff":C.muted,fontWeight:800,fontSize:20,boxShadow:value===n?`0 4px 20px ${C.pinkG}`:"none",transform:value===n?"scale(1.06)":"scale(1)"}}>
          {n}
        </button>
      ))}
    </div>
    <div style={{display:"flex",justifyContent:"space-between"}}><span style={{color:C.muted,fontSize:13}}>{L}</span><span style={{color:C.muted,fontSize:13}}>{R}</span></div>
  </div>);}
function Accord({show,children}){if(!show)return null;return(<div className="accord" style={{marginTop:12}}>{children}</div>);}

// ── FORM STEPS ────────────────────────────────────────────────────────────
const FORM_STEPS=[
  {n:1,icon:"👤",title:"Identificação",sub:"Seus dados pessoais básicos"},
  {n:2,icon:"📏",title:"Medidas",sub:"Dados biométricos"},
  {n:3,icon:"🩺",title:"Diagnósticos",sub:"Condições de saúde"},
  {n:4,icon:"💊",title:"Medicamentos",sub:"Uso contínuo"},
  {n:5,icon:"📋",title:"Histórico",sub:"Saúde e família"},
  {n:6,icon:"🩸",title:"Glicemia",sub:"Controle atual"},
  {n:7,icon:"🌙",title:"Estilo de Vida",sub:"Rotina diária"},
  {n:8,icon:"🏠",title:"Contexto",sub:"Vida e suporte médico"},
];

function FormStep1({d,s}){return(<div style={{animation:"slideR 0.3s ease"}}>
  <FInput label="1. Nome completo" placeholder="Seu nome completo" value={d.nome} onChange={e=>s("nome",e.target.value)}/>
  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
    <FInput label="2. Data de nascimento" placeholder="DD/MM/AAAA" value={d.nasc} onChange={e=>s("nasc",e.target.value)}/>
    <FInput label="Idade" placeholder="Ex: 52" type="number" value={d.idade} onChange={e=>s("idade",e.target.value)} unit="anos"/>
  </div>
  <div style={{marginBottom:18}}>
    <label style={{color:C.muted,fontSize:15,fontWeight:600,display:"block",marginBottom:10}}>3. Sexo</label>
    <div style={{display:"flex",gap:12}}>
      {["Feminino","Masculino"].map(v=>(
        <button key={v} onClick={()=>s("sexo",v)} style={{flex:1,padding:"20px",borderRadius:16,border:`1.5px solid ${d.sexo===v?C.pink:C.border}`,background:d.sexo===v?C.pinkL:"var(--surf)",color:d.sexo===v?C.text:C.muted,fontWeight:700,fontSize:17,boxShadow:d.sexo===v?`0 0 0 1px ${C.pink}44`:"none"}}>{v}</button>
      ))}
    </div>
  </div>
</div>);}

function FormStep2({d,s}){return(<div style={{animation:"slideR 0.3s ease"}}>
  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
    <FInput label="4. Peso atual" placeholder="Ex: 78" type="number" value={d.peso} onChange={e=>s("peso",e.target.value)} unit="kg"/>
    <FInput label="Altura" placeholder="Ex: 165" type="number" value={d.alt} onChange={e=>s("alt",e.target.value)} unit="cm"/>
  </div>
  <FInput label="Medida da cintura" placeholder="Ex: 88" type="number" value={d.cin} onChange={e=>s("cin",e.target.value)} unit="cm" hint="Se não souber, deixe em branco — vamos aferir na Sessão Individual de Diagnóstico."/>
  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
    <FInput label="Maior peso adulto" placeholder="Ex: 95" type="number" value={d.pesoMax} onChange={e=>s("pesoMax",e.target.value)} unit="kg"/>
    <FInput label="Menor peso adulto" placeholder="Ex: 64" type="number" value={d.pesoMin} onChange={e=>s("pesoMin",e.target.value)} unit="kg"/>
  </div>
</div>);}

function FormStep3({d,s}){
  const tog=v=>s("diags",(d.diags||[]).includes(v)?(d.diags||[]).filter(x=>x!==v):[...(d.diags||[]),v]);
  return(<div style={{animation:"slideR 0.3s ease"}}>
    <p style={{color:C.muted,fontSize:15,marginBottom:16}}>5. Marque todos os diagnósticos confirmados por médico:</p>
    {DIAGS_LIST.map(dg=><ChkCard key={dg} label={dg} selected={(d.diags||[]).includes(dg)} onClick={()=>tog(dg)}/>)}
    <ChkCard label="Nenhum diagnóstico confirmado" selected={(d.diags||[]).includes("Nenhum")} onClick={()=>s("diags",["Nenhum"])}/>
    {(d.diags||[]).length>0&&!(d.diags||[]).includes("Nenhum")&&
      <Accord show><FTextarea label="6. Há quanto tempo e como está sendo tratado?" placeholder="Ex: Diabetes tipo 2 — diagnosticado há 3 anos, uso Metformina." value={d.diagsDesc} onChange={e=>s("diagsDesc",e.target.value)} minHeight={80}/></Accord>}
    <FInput label="Outro diagnóstico não listado (opcional)" placeholder="Descreva" value={d.diagsOutro} onChange={e=>s("diagsOutro",e.target.value)}/>
  </div>);}

function FormStep4({d,s}){
  const meds=d.meds||[{med:"",dose:"",horario:"",qtd:""}];
  const upd=(i,k,v)=>{const a=[...meds];a[i]={...a[i],[k]:v};s("meds",a);};
  return(<div style={{animation:"slideR 0.3s ease"}}>
    <p style={{color:C.muted,fontSize:15,marginBottom:16}}>7. Liste os medicamentos e suplementos que usa continuamente:</p>
    {meds.map((m,i)=>(
      <div key={i} style={{...gl({borderRadius:14}),padding:16,marginBottom:10,animation:"fadeUp 0.3s ease"}}>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:8}}>
            <div><label style={{color:C.muted,fontSize:12,fontWeight:700,display:"block",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.5px"}}>Medicamento</label><input value={m.med} onChange={e=>upd(i,"med",e.target.value)} placeholder="Ex: Metformina" style={{...inp,padding:"11px 14px",fontSize:15}}/></div>
            <div><label style={{color:C.muted,fontSize:12,fontWeight:700,display:"block",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.5px"}}>Dose</label><input value={m.dose} onChange={e=>upd(i,"dose",e.target.value)} placeholder="850mg" style={{...inp,padding:"11px 14px",fontSize:15}}/></div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,alignItems:"end"}}>
            <div><label style={{color:C.muted,fontSize:12,fontWeight:700,display:"block",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.5px"}}>Horário</label><input value={m.horario} onChange={e=>upd(i,"horario",e.target.value)} placeholder="Ex: Manhã" style={{...inp,padding:"11px 14px",fontSize:15}}/></div>
            <div style={{display:"flex",gap:8,alignItems:"flex-end"}}>
              <div style={{flex:1}}><label style={{color:C.muted,fontSize:12,fontWeight:700,display:"block",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.5px"}}>Vezes/dia</label><input value={m.qtd} onChange={e=>upd(i,"qtd",e.target.value)} placeholder="Ex: 2×" style={{...inp,padding:"11px 14px",fontSize:15}}/></div>
              {i>0&&<button onClick={()=>s("meds",meds.filter((_,j)=>j!==i))} style={{background:"rgba(244,63,94,0.1)",border:"1px solid rgba(244,63,94,0.2)",borderRadius:10,padding:"11px 13px",color:C.danger,height:48,flexShrink:0,marginBottom:1}}><Trash2 size={16}/></button>}
            </div>
          </div>
        </div>
      </div>
    ))}
    <button onClick={()=>s("meds",[...meds,{med:"",dose:"",horario:"",qtd:""}])} style={{width:"100%",padding:"13px",borderRadius:12,border:`1.5px dashed ${C.border}`,background:"transparent",color:C.muted,fontSize:15,fontWeight:600,display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:20}}>
      <Plus size={16}/>Adicionar medicamento
    </button>
    <label style={{color:C.muted,fontSize:15,fontWeight:600,display:"block",marginBottom:10}}>Já fez acompanhamento nutricional antes?</label>
    <div style={{display:"flex",gap:10,marginBottom:8}}>
      {["Sim","Não"].map(v=><button key={v} onClick={()=>s("dietaAntes",v)} style={{flex:1,padding:"14px",borderRadius:12,border:`1.5px solid ${d.dietaAntes===v?C.pink:C.border}`,background:d.dietaAntes===v?C.pinkL:"var(--surf)",color:d.dietaAntes===v?C.text:C.muted,fontWeight:700,fontSize:16}}>{v}</button>)}
    </div>
    <Accord show={d.dietaAntes==="Sim"}><FTextarea placeholder="O que foi e por que parou?" value={d.dietaAntesDesc} onChange={e=>s("dietaAntesDesc",e.target.value)} minHeight={70}/></Accord>
  </div>);}

function FormStep5({d,s}){return(<div style={{animation:"slideR 0.3s ease"}}>
  <FTextarea label="10. Eventos de saúde marcantes" placeholder="Ex: Cirurgia bariátrica 2018, menopausa 2020, internação por infarto…" value={d.eventos} onChange={e=>s("eventos",e.target.value)} minHeight={90}/>
  <p style={{color:C.muted,fontSize:15,fontWeight:600,marginBottom:10}}>11. Histórico familiar (diabetes, obesidade, doença cardíaca):</p>
  {["Sim","Não","Não sei"].map(v=><ChkCard key={v} label={v} selected={d.histFam===v} onClick={()=>s("histFam",v)}/>)}
  <Accord show={d.histFam==="Sim"}><FTextarea placeholder="Ex: Mãe — diabetes tipo 2. Pai — infarto." value={d.histFamDesc} onChange={e=>s("histFamDesc",e.target.value)} minHeight={70}/></Accord>
  <p style={{color:C.muted,fontSize:15,fontWeight:600,marginBottom:10,marginTop:14}}>Você mede a glicemia em casa?</p>
  {["Sim, com glicosímetro","Sim, com monitor contínuo (CGM)","Não meço em casa"].map(v=><ChkCard key={v} label={v} selected={d.medicaGlic===v} onClick={()=>s("medicaGlic",v)}/>)}
</div>);}

function FormStep6({d,s}){
  const rows=[{k:"glicJejum",l:"Glicemia em jejum"},{k:"glicCafe",l:"Após café da manhã"},{k:"glicAlmoco",l:"Após almoço"},{k:"glicJantar",l:"Após jantar"},{k:"glicDormir",l:"Antes de dormir"},{k:"glicMax",l:"Valor mais alto já registrado"}];
  return(<div style={{animation:"slideR 0.3s ease"}}>
    <p style={{color:C.muted,fontSize:15,marginBottom:14}}>11. Valores habituais de glicemia (preencha o que souber):</p>
    <div style={{...gl({borderRadius:16}),overflow:"hidden",marginBottom:20}}>
      {rows.map((r,i)=>(<div key={r.k} style={{display:"flex",alignItems:"center",gap:12,padding:"14px 20px",borderBottom:i<rows.length-1?`1px solid ${C.border}`:"none"}}>
        <span style={{flex:1,color:C.muted,fontSize:15}}>{r.l}</span>
        <input type="number" value={d[r.k]||""} onChange={e=>s(r.k,e.target.value)} placeholder="—" style={{width:80,background:"var(--btn-ghost)",border:`1px solid ${C.border}`,borderRadius:10,padding:"9px 10px",color:C.pink,fontSize:16,fontWeight:700,textAlign:"center"}}/>
        <span style={{color:C.muted,fontSize:13,minWidth:42}}>mg/dL</span>
      </div>))}
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
      <FInput label="12. Hemoglobina glicada (HbA1c)" placeholder="Ex: 7.2" type="number" value={d.hba1c} onChange={e=>s("hba1c",e.target.value)} unit="%"/>
      <FInput label="Data do exame" placeholder="MM/AAAA" value={d.hba1cData} onChange={e=>s("hba1cData",e.target.value)}/>
    </div>
    <div style={{...gl({borderRadius:12,borderColor:"rgba(31,204,116,0.25)",background:"rgba(31,204,116,0.06)"}),padding:"13px 16px"}}>
      <p style={{color:C.muted,fontSize:14}}><span style={{color:C.success,fontWeight:700}}>Referência: </span>HbA1c normal &lt;5,7% · Pré-diabetes: 5,7–6,4% · Diabetes ≥6,5%</p>
    </div>
  </div>);}

function FormStep7({d,s}){return(<div style={{animation:"slideR 0.3s ease"}}>
  <p style={{color:C.muted,fontSize:15,fontWeight:600,marginBottom:10}}>13. Qualidade do sono:</p>
  <Likert value={d.sono} onChange={v=>s("sono",v)} L="Muito ruim" R="Excelente"/>
  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginTop:14,marginBottom:18}}>
    <FInput placeholder="Horas por noite" type="number" value={d.sonoH} onChange={e=>s("sonoH",e.target.value)} unit="h"/>
    <FInput placeholder="Queixa específica (opcional)" value={d.sonoQ} onChange={e=>s("sonoQ",e.target.value)}/>
  </div>
  <p style={{color:C.muted,fontSize:15,fontWeight:600,marginBottom:10}}>14. Atividade física:</p>
  {["Não pratico","Caminhada leve eventual","Regular 1–2× por semana","Regular 3–4× por semana","Treino intenso 5+×/semana"].map(v=><ChkCard key={v} label={v} selected={d.ativ===v} onClick={()=>s("ativ",v)}/>)}
  <Accord show={d.ativ&&d.ativ!=="Não pratico"}><FTextarea placeholder="Qual atividade e há quanto tempo?" value={d.ativDesc} onChange={e=>s("ativDesc",e.target.value)} minHeight={70}/></Accord>
  <p style={{color:C.muted,fontSize:15,fontWeight:600,marginBottom:10,marginTop:14}}>15. Nível de estresse diário:</p>
  <Likert value={d.stress} onChange={v=>s("stress",v)} L="Muito baixo" R="Extremamente alto"/>
  <p style={{color:C.muted,fontSize:15,fontWeight:600,marginBottom:10,marginTop:18}}>16. O estresse influencia sua alimentação?</p>
  {["Não, consigo separar bem","Um pouco, às vezes","Sim, com frequência","Sim, é meu principal desafio"].map(v=><ChkCard key={v} label={v} selected={d.stressAlim===v} onClick={()=>s("stressAlim",v)}/>)}
  <p style={{color:C.muted,fontSize:15,fontWeight:600,marginBottom:10,marginTop:14}}>17. Funcionamento intestinal:</p>
  {["Regular (diário ou alternado)","Irregular (prisão de ventre frequente)","Solto (mais de 1× ao dia)","Outros desconfortos (gases, inchaço…)"].map(v=><ChkCard key={v} label={v} selected={d.intestino===v} onClick={()=>s("intestino",v)}/>)}
</div>);}

function FormStep8({d,s}){return(<div style={{animation:"slideR 0.3s ease"}}>
  <p style={{color:C.muted,fontSize:15,fontWeight:600,marginBottom:10}}>18. Com quem você mora?</p>
  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16}}>
    {["Sozinho(a)","Com cônjuge/parceiro","Com cônjuge e filhos","Com filhos","Com família extensa","Com colegas"].map(v=><ChkCard key={v} label={v} selected={d.mora===v} onClick={()=>s("mora",v)}/>)}
  </div>
  <p style={{color:C.muted,fontSize:15,fontWeight:600,marginBottom:10}}>19. A alimentação em casa é um desafio?</p>
  {["A família apoia e come parecido","Cada um come o que quer","Cozinho para todos — difícil adaptar","Moro sozinha — só depende de mim","É um desafio — há conflito com o plano"].map(v=><ChkCard key={v} label={v} selected={d.casaAlim===v} onClick={()=>s("casaAlim",v)}/>)}
  <FTextarea label="20. Algo importante acontecendo na sua vida agora?" placeholder="Ex: mudança de emprego, luto, viagem, procedimento médico previsto…" value={d.vidaAgora} onChange={e=>s("vidaAgora",e.target.value)} minHeight={70}/>
  <p style={{color:C.muted,fontSize:15,fontWeight:600,marginBottom:10}}>21. Tem médico que acompanha seu diabetes/pré-diabetes?</p>
  <div style={{display:"flex",gap:10,marginBottom:8}}>
    {["Sim","Não"].map(v=><button key={v} onClick={()=>s("temMed",v)} style={{flex:1,padding:"14px",borderRadius:12,border:`1.5px solid ${d.temMed===v?C.pink:C.border}`,background:d.temMed===v?C.pinkL:"var(--surf)",color:d.temMed===v?C.text:C.muted,fontWeight:700,fontSize:16}}>{v}</button>)}
  </div>
  <Accord show={d.temMed==="Sim"}><FInput placeholder="Especialidade e frequência das consultas" value={d.medDesc} onChange={e=>s("medDesc",e.target.value)}/></Accord>
  <p style={{color:C.muted,fontSize:15,fontWeight:600,marginBottom:10,marginTop:8}}>22. Já conversou com seu médico sobre a Mentoria 4D?</p>
  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16}}>
    {["Sim, ele aprovou","Sim, ficou neutro","Sim, questionou","Não conversei ainda"].map(v=><ChkCard key={v} label={v} selected={d.medGMP===v} onClick={()=>s("medGMP",v)}/>)}
  </div>
  <p style={{color:C.muted,fontSize:15,fontWeight:600,marginBottom:10}}>23. Tem exame agendado nos próximos 3 meses?</p>
  <div style={{display:"flex",gap:10,marginBottom:8}}>
    {["Sim","Não"].map(v=><button key={v} onClick={()=>s("exameAgend",v)} style={{flex:1,padding:"14px",borderRadius:12,border:`1.5px solid ${d.exameAgend===v?C.pink:C.border}`,background:d.exameAgend===v?C.pinkL:"var(--surf)",color:d.exameAgend===v?C.text:C.muted,fontWeight:700,fontSize:16}}>{v}</button>)}
  </div>
  <Accord show={d.exameAgend==="Sim"}><FInput placeholder="Qual e quando?" value={d.exameDesc} onChange={e=>s("exameDesc",e.target.value)}/></Accord>
  <FTextarea label="✨ Espaço livre — compartilhe o que quiser" placeholder="Qualquer informação relevante que não coube acima…" value={d.extra} onChange={e=>s("extra",e.target.value)} minHeight={90}/>
</div>);}
// ── LOGIN ────────────────────────────────────────────────────────────────────
function LoginScreen({onLogin}){
  const[email,setEmail]=useState(""),[pass,setPass]=useState(""),[load,setLoad]=useState(false),[forgotMsg,setForgotMsg]=useState(false);
  const go=()=>{setLoad(true);setTimeout(()=>{setLoad(false);onLogin();},1400);};
  return(<div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:24,position:"relative",zIndex:1}}>
    <div style={{...gl(),padding:"52px 44px",width:"100%",maxWidth:420,animation:"fadeUp 0.5s ease"}}>
      <div style={{textAlign:"center",marginBottom:44}}>
        <div style={{display:"flex",justifyContent:"center",marginBottom:22}}><div style={{width:96,height:96,borderRadius:"50%",background:"radial-gradient(circle at 35% 35%,#151525,#060610)",border:`2.5px solid ${C.pink}`,boxShadow:`0 0 48px ${C.pinkG}`,display:"flex",alignItems:"center",justifyContent:"center",animation:"glow 4s ease-in-out infinite"}}><span style={{color:C.pink,fontWeight:900,fontSize:30,letterSpacing:"-0.5px"}}>GMP</span></div></div>
        <h1 style={{color:C.text,fontSize:26,fontWeight:800,marginBottom:4,letterSpacing:"-0.5px"}}>Guia Metabólico Personalizado</h1>
        <div style={{color:C.muted,fontSize:15,lineHeight:1.5,marginTop:6}}>Mentoria 4D · Acesso exclusivo</div>
      </div>
      {forgotMsg&&<div style={{background:"rgba(31,204,116,0.1)",border:"1px solid rgba(31,204,116,0.3)",borderRadius:12,padding:"12px 16px",marginBottom:20,color:C.success,fontSize:14,textAlign:"center"}}>✅ Enviamos as instruções para o seu e-mail!</div>}
      <div style={{display:"flex",flexDirection:"column",gap:18,marginBottom:28}}>
        {[{l:"E-mail",t:"email",ph:"seu@email.com",v:email,s:setEmail},{l:"Senha",t:"password",ph:"••••••••",v:pass,s:setPass}].map(f=>(
          <div key={f.l}><label style={{color:C.muted,fontSize:15,fontWeight:600,display:"block",marginBottom:8}}>{f.l}</label><input type={f.t} placeholder={f.ph} value={f.v} onChange={e=>f.s(e.target.value)} style={inp} onKeyDown={e=>e.key==="Enter"&&go()}/></div>
        ))}
      </div>
      <button onClick={go} style={{...pb(),width:"100%",marginBottom:16,fontSize:18}}>
        {load?<><span style={{width:20,height:20,border:"2.5px solid rgba(255,255,255,0.3)",borderTopColor:"#fff",borderRadius:"50%",animation:"spin 0.7s linear infinite",display:"inline-block"}}/>Entrando…</>:"Entrar na plataforma"}
      </button>
      <div style={{textAlign:"center"}}><button onClick={()=>setForgotMsg(true)} style={{background:"none",border:"none",color:C.pink,cursor:"pointer",fontSize:15,fontWeight:600}}>Esqueci minha senha</button></div>
      <div style={{marginTop:40,paddingTop:20,borderTop:`1px solid ${C.border}`,display:"flex",justifyContent:"center",flexDirection:"column",alignItems:"center",gap:6}}>
        <div style={{color:C.muted,fontSize:13,fontWeight:700,letterSpacing:"1px",textTransform:"uppercase"}}>Guia Metabólico Personalizado</div>
        <div style={{color:C.muted,fontSize:12}}>Bela Nutrição</div>
      </div>
    </div>
  </div>);}

// ── FORMULÁRIO SCREEN ────────────────────────────────────────────────────────
function FormularioScreen({onDone}){
  const[step,setStep]=useState(1),[dir,setDir]=useState(1),[key,setKey]=useState(0);
  const[d,setD]=useState({nome:"",nasc:"",idade:"",sexo:"",peso:"",alt:"",cin:"",pesoMax:"",pesoMin:"",diags:[],diagsDesc:"",diagsOutro:"",meds:[{med:"",dose:"",horario:"",qtd:""}],dietaAntes:"",dietaAntesDesc:"",eventos:"",histFam:"",histFamDesc:"",medicaGlic:"",glicJejum:"",glicCafe:"",glicAlmoco:"",glicJantar:"",glicDormir:"",glicMax:"",hba1c:"",hba1cData:"",sono:null,sonoH:"",sonoQ:"",ativ:"",ativDesc:"",stress:null,stressAlim:"",intestino:"",mora:"",casaAlim:"",vidaAgora:"",temMed:"",medDesc:"",medGMP:"",exameAgend:"",exameDesc:"",extra:""});
  const set=(k,v)=>setD(p=>({...p,[k]:v}));
  const getDone=()=>onDone(d.nome);
  const nav=(next)=>{setDir(next>step?1:-1);setKey(k=>k+1);setTimeout(()=>setStep(next),0);window.scrollTo({top:0,behavior:"smooth"});};
  const COMPS=[FormStep1,FormStep2,FormStep3,FormStep4,FormStep5,FormStep6,FormStep7,FormStep8];
  const Comp=COMPS[step-1];
  const pct=Math.round(((step-1)/(FORM_STEPS.length-1))*100);
  return(<div style={{minHeight:"100vh",position:"relative",zIndex:1}}>
    {/* Sticky header */}
    <div style={{position:"sticky",top:0,zIndex:100,background:"var(--bg,#0b0b0d)dd",backdropFilter:"blur(20px)",borderBottom:`1px solid ${C.border}`,padding:"14px 20px"}}>
      <div style={{maxWidth:620,margin:"0 auto",display:"flex",alignItems:"center",gap:14}}>
        <Logo size={32} showText={false}/>
        <div style={{flex:1}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}><span style={{color:C.muted,fontSize:13}}>Etapa {step} de {FORM_STEPS.length}</span><span style={{color:C.pink,fontSize:13,fontWeight:700}}>{pct}% concluído</span></div>
          <div style={{height:4,borderRadius:2,background:"var(--btn-ghost)",overflow:"hidden"}}><div style={{height:"100%",width:`${pct}%`,borderRadius:2,background:`linear-gradient(90deg,${C.pink},${C.pinkD})`,transition:"width 0.5s cubic-bezier(0.4,0,0.2,1)",boxShadow:`0 0 12px ${C.pinkG}`}}/></div>
        </div>
      </div>
    </div>
    <div style={{maxWidth:620,margin:"0 auto",padding:"28px 20px 120px"}}>
      {/* Step icon & title */}
      <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:28,animation:"fadeUp 0.35s ease"}}>
        <div style={{width:56,height:56,borderRadius:18,background:C.pinkL,border:`1px solid ${C.pink}33`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,flexShrink:0,boxShadow:`0 4px 20px ${C.pinkG}`}}>{FORM_STEPS[step-1].icon}</div>
        <div><h2 style={{color:C.text,fontSize:23,fontWeight:800,letterSpacing:"-0.4px"}}>{FORM_STEPS[step-1].title}</h2><p style={{color:C.muted,fontSize:15}}>{FORM_STEPS[step-1].sub}</p></div>
      </div>
      <div key={key} style={{animation:`${dir>0?"slideR":"slideL"} 0.3s cubic-bezier(0.4,0,0.2,1)`}}><Comp d={d} s={set}/></div>
    </div>
    {/* Fixed nav */}
    <div style={{position:"fixed",bottom:0,left:0,right:0,zIndex:100,background:"var(--bg,#0b0b0d)f0",backdropFilter:"blur(24px)",borderTop:`1px solid ${C.border}`,padding:"16px 20px"}}>
      <div style={{maxWidth:620,margin:"0 auto",display:"flex",gap:12}}>
        {step>1&&<button onClick={()=>nav(step-1)} style={{...gb(),flex:"0 0 auto",padding:"18px 22px"}}><ChevronLeft size={18}/>Voltar</button>}
        <button onClick={()=>step<FORM_STEPS.length?nav(step+1):getDone()} style={{...pb(),flex:1}}>
          {step<FORM_STEPS.length?<>Próximo<ChevronRight size={18}/></>:<><Sparkles size={18}/>Concluir preenchimento</>}
        </button>
      </div>
    </div>
  </div>);}

// ── FORMULÁRIO GATE (tela de conclusão com botão de acesso) ──────────────────

// ── AGENDAMENTO ───────────────────────────────────────────────────────────
function AgendamentoScreen({onConfirm}){
  const today=new Date();
  const[viewMonth,setViewMonth]=useState(today.getMonth());
  const[viewYear,setViewYear]=useState(today.getFullYear());
  const[selDay,setSelDay]=useState(null);
  const[selTime,setSelTime]=useState(null);
  const[confirming,setConfirming]=useState(false);
  const MONTHS=["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
  const DAYS=["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
  const availTimes=["09:00","10:30","14:00","15:30","16:00","17:30"];
  // Weekdays only, next 3 weeks available
  const isAvailable=(y,m,d)=>{
    const dt=new Date(y,m,d);
    const diff=Math.floor((dt-today)/(1000*60*60*24));
    const dow=dt.getDay();
    return diff>=0 && diff<=20 && dow!==0 && dow!==6;
  };
  const firstDay=new Date(viewYear,viewMonth,1).getDay();
  const daysInMonth=new Date(viewYear,viewMonth+1,0).getDate();
  const confirm=()=>{setConfirming(true);setTimeout(()=>{setConfirming(false);onConfirm();},1600);};
  const prevMonth=()=>{if(viewMonth===0){setViewMonth(11);setViewYear(y=>y-1);}else setViewMonth(m=>m-1);setSelDay(null);setSelTime(null);};
  const nextMonth=()=>{if(viewMonth===11){setViewMonth(0);setViewYear(y=>y+1);}else setViewMonth(m=>m+1);setSelDay(null);setSelTime(null);};
  return(<div style={{minHeight:"100vh",display:"flex",alignItems:"flex-start",justifyContent:"center",padding:"28px 20px 80px",position:"relative",zIndex:1}}>
    <div style={{maxWidth:480,width:"100%"}}>
      {/* Header */}
      <div style={{textAlign:"center",marginBottom:32,animation:"fadeUp 0.4s ease"}}>
        <div style={{width:72,height:72,borderRadius:"50%",background:`linear-gradient(135deg,${C.pink},${C.pinkD})`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px",boxShadow:`0 6px 32px ${C.pinkG}`}}>
          <span style={{fontSize:32}}>📅</span>
        </div>
        <h1 style={{color:C.text,fontSize:24,fontWeight:800,marginBottom:6,letterSpacing:'-0.4px'}}>Sessão Individual de Diagnóstico</h1>
        <p style={{color:C.muted,fontSize:15,lineHeight:1.6}}>Escolha uma data e horário para sua Sessão Individual de Diagnóstico personalizada.</p>
      </div>
      {/* Calendar */}
      <div style={{...gl({borderRadius:22}),padding:22,marginBottom:20,animation:"fadeUp 0.45s ease"}}>
        {/* Month nav */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}>
          <button onClick={prevMonth} style={{width:36,height:36,borderRadius:10,background:"var(--btn-ghost)",border:`1px solid ${C.border}`,color:"var(--muted)",cursor:"pointer",fontSize:18}}>‹</button>
          <div style={{color:C.text,fontWeight:800,fontSize:17}}>{MONTHS[viewMonth]} {viewYear}</div>
          <button onClick={nextMonth} style={{width:36,height:36,borderRadius:10,background:"var(--btn-ghost)",border:`1px solid ${C.border}`,color:"var(--muted)",cursor:"pointer",fontSize:18}}>›</button>
        </div>
        {/* Day headers */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4,marginBottom:8}}>
          {DAYS.map(d=><div key={d} style={{textAlign:"center",color:"var(--muted)",fontSize:12,fontWeight:600,padding:"4px 0"}}>{d}</div>)}
        </div>
        {/* Days grid */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4}}>
          {Array(firstDay).fill(null).map((_,i)=><div key={"e"+i}/>)}
          {Array(daysInMonth).fill(null).map((_,i)=>{
            const d=i+1;
            const avail=isAvailable(viewYear,viewMonth,d);
            const isSel=selDay===d;
            const isPast=new Date(viewYear,viewMonth,d)<new Date(today.getFullYear(),today.getMonth(),today.getDate());
            return(<button key={d} onClick={()=>{if(avail){setSelDay(d);setSelTime(null);}}} disabled={!avail}
              style={{aspectRatio:"1",borderRadius:10,fontSize:15,fontWeight:isSel?800:avail?600:400,
                background:isSel?`linear-gradient(135deg,${C.pink},${C.pinkD})`:avail?"rgba(240,5,154,0.1)":"transparent",
                border:`1.5px solid ${isSel?C.pink:avail?"rgba(240,5,154,0.35)":"transparent"}`,
                color:isSel?"#fff":avail?C.pinkLight:C.muted,
                boxShadow:isSel?`0 4px 16px ${C.pinkG}`:"none",
                cursor:avail?"pointer":"default",opacity:isPast?0.3:1,
                transition:"all 0.18s"}}>
              {d}
            </button>);
          })}
        </div>
        {selDay&&<div style={{marginTop:14,padding:"10px 14px",background:"rgba(31,204,116,0.08)",border:"1px solid rgba(31,204,116,0.25)",borderRadius:10,color:C.success,fontSize:14,fontWeight:600,textAlign:"center"}}>
          ✓ {selDay} de {MONTHS[viewMonth]} de {viewYear} selecionado
        </div>}
      </div>
      {/* Time slots */}
      {selDay&&<div style={{...gl({borderRadius:22}),padding:22,marginBottom:20,animation:"fadeUp 0.35s ease"}}>
        <div style={{color:C.text,fontWeight:700,fontSize:16,marginBottom:14}}>🕐 Escolha o horário</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
          {availTimes.map(t=>(
            <button key={t} onClick={()=>setSelTime(t)} style={{padding:"14px 8px",borderRadius:13,border:`1.5px solid ${selTime===t?C.pink:C.border}`,background:selTime===t?`linear-gradient(135deg,${C.pink},${C.pinkD})`:"var(--surf)",color:selTime===t?"#fff":C.muted,fontWeight:700,fontSize:16,boxShadow:selTime===t?`0 4px 16px ${C.pinkG}`:"none",transition:"all 0.18s"}}>
              {t}
            </button>
          ))}
        </div>
      </div>}
      {/* Summary + confirm */}
      {selDay&&selTime&&<div style={{animation:"fadeUp 0.3s ease"}}>
        <div style={{...gl({borderRadius:18,background:C.pinkL,borderColor:`${C.pink}33`}),padding:"16px 20px",marginBottom:16}}>
          <div style={{color:C.text,fontWeight:700,fontSize:15,marginBottom:4}}>📋 Resumo do agendamento</div>
          <div style={{color:C.muted,fontSize:14}}>📅 {selDay} de {MONTHS[viewMonth]} de {viewYear} às {selTime}</div>
          <div style={{color:C.muted,fontSize:14,marginTop:4}}>📍 Reunião online com a Guardiã Bela Nutrição</div>
        </div>
        <button onClick={confirm} disabled={confirming} style={{...pb(),width:"100%",fontSize:17}}>
          {confirming?<><span style={{width:20,height:20,border:"2.5px solid rgba(255,255,255,0.3)",borderTopColor:"#fff",borderRadius:"50%",animation:"spin 0.7s linear infinite",display:"inline-block"}}/>Confirmando…</>:<>✓ Confirmar Agendamento</>}
        </button>
      </div>}
      {(!selDay||!selTime)&&<div style={{textAlign:"center",padding:"12px",color:C.muted,fontSize:14}}>
        {!selDay?"👆 Selecione uma data disponível (destacada em rosa)":"👆 Agora escolha um horário acima"}
      </div>}
    </div>
  </div>);}


function FormGate({onAccess}){return(
  <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:24,position:"relative",zIndex:1}}>
    <div style={{maxWidth:460,width:"100%",textAlign:"center",animation:"scaleIn 0.5s cubic-bezier(0.4,0,0.2,1)"}}>
      <div style={{width:100,height:100,borderRadius:"50%",background:`linear-gradient(135deg,${C.pink},${C.pinkD})`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 28px",boxShadow:`0 8px 48px ${C.pinkG}`,animation:"glow 3s ease-in-out infinite"}}>
        <Sparkles size={44} color="#fff"/>
      </div>
      <h1 style={{color:C.text,fontSize:30,fontWeight:800,marginBottom:12,letterSpacing:"-0.5px"}}>Formulário concluído!</h1>
      <p style={{color:C.muted,fontSize:17,lineHeight:1.7,marginBottom:36}}>Excelente! Seus dados foram salvos com segurança. Para que sua guardiã possa personalizar sua jornada de transformação metabólica, precisamos de uma Sessão Individual de Diagnóstico.</p>
      <div style={{...gl({borderRadius:18,background:C.pinkL,borderColor:`${C.pink}33`}),padding:"20px 24px",marginBottom:32}}>
        <p style={{color:C.muted,fontSize:15,lineHeight:1.6}}>🎉 <strong style={{color:C.text}}>Parabéns por dar esse passo!</strong> Você acaba de iniciar uma jornada de transformação metabólica com suporte especializado.</p>
      </div>
      <button onClick={onAccess} style={{...pb(),width:"100%",fontSize:19,padding:"22px 28px"}}>
        <Sparkles size={22}/>Agendar Sessão Individual de Diagnóstico
      </button>
      <p style={{color:C.muted,fontSize:13,marginTop:16}}>Mentoria 4D · Bela Nutrição · Confidencial</p>
    </div>
  </div>);}
// ══════════════════════════════════════════════════════════════════════════
// DASHBOARD SECTIONS
// ══════════════════════════════════════════════════════════════════════════

// ── HELPERS ──────────────────────────────────────────────────────────────────
const getGreeting=()=>{const h=new Date().getHours();if(h<12)return"Bom dia";if(h<18)return"Boa tarde";return"Boa noite";};

// Locked block — uniform, proportional, fixed 120px height overlay on top of blurred preview
function LockedBlock({children}){
  const[demo,setDemo]=useState(false);
  if(demo) return(<>{children}</>);
  return(
    <div style={{borderRadius:16,overflow:"hidden",position:"relative",background:"var(--surf,rgba(255,255,255,0.05))",border:`1px solid ${C.border}`}}>
      {/* Blurred preview — capped height so lock is always proportional */}
      <div style={{maxHeight:110,overflow:"hidden",filter:"blur(6px)",opacity:0.28,pointerEvents:"none",userSelect:"none"}}>
        {children}
      </div>
      {/* Lock overlay — always same height, always centered */}
      <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"row",alignItems:"center",justifyContent:"space-between",background:"var(--overlay,rgba(0,0,0,0.55))",backdropFilter:"blur(3px)",padding:"16px 20px"}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:42,height:42,borderRadius:"50%",background:"rgba(240,5,154,0.14)",border:`1.5px solid ${C.pink}55`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <Lock size={19} color={C.pink}/>
          </div>
          <div>
            <div style={{color:C.text,fontWeight:700,fontSize:14,lineHeight:1.3}}>Disponível após a</div>
            <div style={{color:C.pink,fontWeight:800,fontSize:13,marginTop:2}}>Sessão Individual de Diagnóstico</div>
          </div>
        </div>
        <button onClick={()=>setDemo(true)} style={{background:"var(--btn-ghost)",border:`1px solid ${C.border}`,borderRadius:10,padding:"8px 14px",color:C.muted,fontSize:13,fontWeight:600,cursor:"pointer",flexShrink:0,whiteSpace:"nowrap"}}>
          Demo →
        </button>
      </div>
    </div>
  );}

// ── INÍCIO: Chat rápido + Receita da hora + Checklist + Dicas ──────────────
function SecInicio({userName=""}){
  const[chatInput,setChatInput]=useState("");
  const[chatMsgs,setChatMsgs]=useState([{r:"ai",t:"Olá! 👋 Posso sugerir uma receita, tirar dúvida sobre alimentação ou te ajudar com o cardápio de hoje. O que você precisa?"}]);
  const[chatLoad,setChatLoad]=useState(false);
  const[checked,setChecked]=useState([]);
  const endRef=useRef(null);
  const receitaHora=getReceitaHora();
  const send=()=>{if(!chatInput.trim())return;const t=chatInput;setChatMsgs(m=>[...m,{r:"user",t}]);setChatInput("");setChatLoad(true);setTimeout(()=>{setChatMsgs(m=>[...m,{r:"ai",t:CHAT_RESP[chatIdx++%CHAT_RESP.length]}]);setChatLoad(false);},1200);};
  useEffect(()=>{endRef.current?.scrollIntoView({behavior:"smooth"})},[chatMsgs]);
  const togChk=id=>setChecked(a=>a.includes(id)?a.filter(x=>x!==id):[...a,id]);
  const now=new Date(),hAtual=now.getHours()*60+now.getMinutes();
  return(<div style={{padding:"22px 24px",overflowY:"auto",height:"100%",display:"flex",flexDirection:"column",gap:24}}>

    {/* Chat Rápido */}
    <div>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
        <div style={{width:38,height:38,borderRadius:12,background:C.pinkL,border:`1px solid ${C.pink}33`,display:"flex",alignItems:"center",justifyContent:"center"}}><MessageCircle size={18} color={C.pink}/></div>
        <div><div style={{color:C.text,fontWeight:700,fontSize:17}}>Chat com a IA</div><div style={{color:C.muted,fontSize:13}}>Peça uma receita ou tire dúvidas</div></div>
      </div>
      <LockedBlock>
      <div style={{...gl({borderRadius:18}),overflow:"hidden"}}>
        <div style={{maxHeight:220,overflowY:"auto",padding:"16px 18px",display:"flex",flexDirection:"column",gap:10}}>
          {chatMsgs.map((m,i)=>(
            <div key={i} style={{display:"flex",justifyContent:m.r==="user"?"flex-end":"flex-start",animation:"fadeUp 0.3s ease"}}>
              {m.r==="ai"&&<div style={{width:32,height:32,borderRadius:"50%",background:`linear-gradient(135deg,${C.pink},${C.pinkD})`,display:"flex",alignItems:"center",justifyContent:"center",marginRight:8,flexShrink:0,marginTop:2}}><Sparkles size={14} color="#fff"/></div>}
              <div style={{maxWidth:"78%",padding:"11px 15px",borderRadius:m.r==="user"?"18px 18px 4px 18px":"18px 18px 18px 4px",background:m.r==="user"?`linear-gradient(135deg,${C.pink},${C.pinkD})`:"var(--btn-ghost)",border:m.r==="ai"?`1px solid ${C.border}`:"none",color:C.text,fontSize:15,lineHeight:1.5}}>{m.t}</div>
            </div>
          ))}
          {chatLoad&&<div style={{display:"flex",gap:6,padding:"11px 15px",width:70,background:"var(--btn-ghost)",border:`1px solid ${C.border}`,borderRadius:"18px 18px 18px 4px"}}>{[0,1,2].map(i=><div key={i} style={{width:7,height:7,borderRadius:"50%",background:C.pink,animation:`bounce 1s ease infinite ${i*0.17}s`}}/>)}</div>}
          <div ref={endRef}/>
        </div>
        <div style={{borderTop:`1px solid ${C.border}`,padding:"12px 16px",display:"flex",gap:10}}>
          <input value={chatInput} onChange={e=>setChatInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="Ex: Me sugira uma receita com frango e brócolis…" style={{...inp,flex:1,padding:"12px 16px",fontSize:15}}/>
          <button onClick={send} style={{...pb({borderRadius:12,padding:"12px 16px",minHeight:46,boxShadow:"none",fontSize:14}),flexShrink:0}}><Send size={17}/></button>
        </div>
      </div>
      </LockedBlock>
    </div>

    {/* Receita da hora */}
    <div>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
        <div style={{width:38,height:38,borderRadius:12,background:"rgba(31,204,116,0.12)",border:"1px solid rgba(31,204,116,0.25)",display:"flex",alignItems:"center",justifyContent:"center"}}><Clock size={18} color={C.success}/></div>
        <div><div style={{color:C.text,fontWeight:700,fontSize:17}}>Receita indicada agora</div><div style={{color:C.muted,fontSize:13}}>Baseada no horário atual</div></div>
      </div>
      <LockedBlock>
      <div style={{...gl({borderRadius:18,borderColor:"rgba(31,204,116,0.2)",background:"rgba(31,204,116,0.04)"}),padding:"20px 22px",display:"flex",gap:16,alignItems:"flex-start"}}>
        <div style={{fontSize:44,flexShrink:0,lineHeight:1}}>{receitaHora.e}</div>
        <div style={{flex:1}}>
          <div style={{color:C.text,fontWeight:800,fontSize:18,marginBottom:4}}>{receitaHora.nm}</div>
          <div style={{color:C.muted,fontSize:14,marginBottom:10}}>{receitaHora.ct}</div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <span style={{background:`${C.pink}18`,border:`1px solid ${C.pink}33`,borderRadius:8,padding:"4px 10px",color:C.pink,fontSize:13,fontWeight:600}}>⏱ {receitaHora.tm}</span>
            <span style={{background:"rgba(31,204,116,0.12)",border:"1px solid rgba(31,204,116,0.25)",borderRadius:8,padding:"4px 10px",color:C.success,fontSize:13,fontWeight:600}}>🔥 {receitaHora.kc} kcal</span>
            <span style={{background:"var(--btn-ghost)",border:`1px solid ${C.border}`,borderRadius:8,padding:"4px 10px",color:C.muted,fontSize:13}}>{receitaHora.df}</span>
          </div>
        </div>
      </div>
      </LockedBlock>
    </div>

    {/* Checklist refeições */}
    <div>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
        <div style={{width:38,height:38,borderRadius:12,background:"rgba(234,179,8,0.12)",border:"1px solid rgba(234,179,8,0.25)",display:"flex",alignItems:"center",justifyContent:"center"}}><Check size={18} color={C.gold}/></div>
        <div>
          <div style={{color:C.text,fontWeight:700,fontSize:17}}>Cardápio de hoje</div>
          <div style={{color:C.muted,fontSize:13}}>{checked.length}/{REFEICOES_DIA.length} refeições realizadas</div>
        </div>
        <div style={{marginLeft:"auto",background:`${C.gold}20`,border:`1px solid ${C.gold}44`,borderRadius:8,padding:"4px 10px",color:C.gold,fontSize:13,fontWeight:700}}>{Math.round((checked.length/REFEICOES_DIA.length)*100)}%</div>
      </div>
      <LockedBlock>
      <div style={{...gl({borderRadius:18}),overflow:"hidden"}}>
        {REFEICOES_DIA.map((ref,i)=>{
          const done=checked.includes(ref.id);
          const [hRef,mRef]=ref.hora.split(":").map(Number);
          const minRef=hRef*60+mRef;
          const isCurrent=Math.abs(hAtual-minRef)<90;
          return(<div key={ref.id} onClick={()=>togChk(ref.id)} style={{display:"flex",alignItems:"center",gap:14,padding:"16px 20px",borderBottom:i<REFEICOES_DIA.length-1?`1px solid ${C.border}`:"none",cursor:"pointer",background:isCurrent&&!done?`${C.pink}06`:"transparent",transition:"all 0.2s"}}>
            <div style={{width:40,height:40,borderRadius:12,background:done?"rgba(31,204,116,0.15)":isCurrent?C.pinkL:"var(--surf)",border:`1.5px solid ${done?"rgba(31,204,116,0.5)":isCurrent?`${C.pink}66`:C.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0,transition:"all 0.25s"}}>{done?<Check size={18} color={C.success} style={{animation:"checkPop 0.25s ease"}}/>:ref.icon}</div>
            <div style={{flex:1}}>
              <div style={{color:done?C.muted:isCurrent?C.pinkLight:C.text,fontWeight:done?500:700,fontSize:16,textDecoration:done?"line-through":"none",transition:"all 0.2s"}}>{ref.nome}</div>
              <div style={{color:C.muted,fontSize:13}}>{ref.hora} · {ref.desc}</div>
            </div>
            {isCurrent&&!done&&<span style={{background:C.pinkL,border:`1px solid ${C.pink}44`,borderRadius:6,padding:"3px 8px",color:C.pink,fontSize:12,fontWeight:700}}>Agora</span>}
          </div>);
        })}
      </div>
      </LockedBlock>
    </div>

    {/* Dicas */}
    <div>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
        <div style={{width:38,height:38,borderRadius:12,background:"rgba(167,139,250,0.12)",border:"1px solid rgba(167,139,250,0.25)",display:"flex",alignItems:"center",justifyContent:"center"}}><Sparkles size={18} color={C.purple}/></div>
        <div style={{color:C.text,fontWeight:700,fontSize:17}}>Dicas da Bela</div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {DICAS.map((d,i)=>(<div key={i} style={{...gl({borderRadius:14}),padding:"16px 18px",display:"flex",gap:14,animation:`fadeUp ${0.3+i*0.08}s ease`}}>
          <span style={{fontSize:26,flexShrink:0}}>{d.e}</span>
          <div><div style={{color:C.text,fontWeight:700,fontSize:15,marginBottom:3}}>{d.ti}</div><div style={{color:C.muted,fontSize:14,lineHeight:1.5}}>{d.tx}</div></div>
        </div>))}
      </div>
    </div>
  </div>);}

// ── EVOLUÇÃO: Gráficos e histórico ──────────────────────────────────────────
function SecEvolucao(){
  const[exTab,setExTab]=useState("glicemia"),[exames,setExames]=useState(EX0),[nVal,setNVal]=useState(""),[nMes,setNMes]=useState("");
  const DS={glicemia:{col:C.pink,u:"mg/dL",lb:"Glicemia em Jejum",ref:"Ref: 70–99 mg/dL"},hba1c:{col:C.purple,u:"%",lb:"Hemoglobina Glicada (HbA1c)",ref:"Ref: < 5,7%"},peso:{col:C.blue,u:"kg",lb:"Peso Corporal",ref:""}};
  const cur=DS[exTab],data=exames[exTab],delta=data[data.length-1].v-data[0].v;
  const addR=()=>{if(!nVal||!nMes)return;setExames(p=>({...p,[exTab]:[...p[exTab],{m:nMes,v:parseFloat(nVal)}]}));setNVal("");setNMes("");};
  return(<div style={{height:"100%",overflowY:"auto",padding:"22px 24px"}}>
    <h2 style={{color:C.text,fontSize:21,fontWeight:800,marginBottom:4}}>📊 Minha Evolução</h2>
    <p style={{color:C.muted,fontSize:15,marginBottom:20}}>Acompanhe o progresso dos seus resultados ao longo do programa</p>
    <div style={{display:"flex",gap:8,marginBottom:20,flexWrap:"wrap"}}>
      {[{id:"glicemia",lb:"🩸 Glicemia"},{id:"hba1c",lb:"📈 HbA1c"},{id:"peso",lb:"⚖️ Peso"}].map(t=>(
        <button key={t.id} onClick={()=>setExTab(t.id)} style={{padding:"11px 20px",borderRadius:12,border:`1.5px solid ${exTab===t.id?DS[t.id].col:C.border}`,background:exTab===t.id?`${DS[t.id].col}20`:"var(--surf)",color:exTab===t.id?DS[t.id].col:C.muted,fontWeight:700,fontSize:15}}>{t.lb}</button>
      ))}
    </div>
    <div style={{...gl({borderRadius:20}),padding:24,marginBottom:16}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:18}}>
        <div><div style={{color:C.text,fontWeight:800,fontSize:18}}>{cur.lb}</div>{cur.ref&&<div style={{color:C.muted,fontSize:13,marginTop:2}}>{cur.ref}</div>}</div>
        <div style={{textAlign:"right"}}><div style={{color:delta<=0?C.success:C.warn,fontWeight:800,fontSize:28}}>{data[data.length-1].v}<span style={{fontSize:14,marginLeft:3}}>{cur.u}</span></div><div style={{color:delta<0?C.success:C.warn,fontSize:13,fontWeight:700}}>{delta<0?"▼":"▲"} {Math.abs(delta).toFixed(1)} {cur.u} desde o início</div></div>
      </div>
      <MC data={data} color={cur.col} yKey="v" xKey="m" h={110}/>
    </div>
    <div style={{...gl({borderRadius:18}),padding:22,marginBottom:14}}>
      <div style={{color:C.text,fontWeight:700,fontSize:16,marginBottom:14}}>Histórico de registros</div>
      {[...data].reverse().map((d,i)=>{const prev=[...data].reverse()[i+1],dd=prev?d.v-prev.v:null;return(
        <div key={i} style={{display:"flex",alignItems:"center",gap:14,padding:"12px 14px",borderRadius:12,background:i===0?`${C.pink}09`:"var(--surf)",border:`1px solid ${i===0?`${C.pink}22`:C.border}`,marginBottom:6}}>
          <span style={{color:C.muted,fontSize:15,minWidth:38,fontWeight:600}}>{d.m}</span>
          <span style={{color:i===0?C.pinkLight:C.text,fontWeight:800,fontSize:18,flex:1}}>{d.v}<span style={{fontSize:12,color:C.muted,marginLeft:3,fontWeight:400}}>{cur.u}</span></span>
          {dd!==null&&<span style={{color:dd<0?C.success:C.warn,fontWeight:700,fontSize:14}}>{dd<0?"▼":"▲"} {Math.abs(dd).toFixed(1)}</span>}
          {i===0&&<span style={{background:`${C.pink}20`,borderRadius:7,padding:"3px 10px",color:C.pink,fontSize:12,fontWeight:700}}>Atual</span>}
        </div>);
      })}
    </div>
    <div style={{...gl({borderRadius:18,borderColor:`${C.pink}22`}),padding:22}}>
      <div style={{color:C.text,fontWeight:700,fontSize:16,marginBottom:14}}>➕ Adicionar novo resultado</div>
      <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
        <div style={{flex:1,minWidth:100}}><label style={{color:C.muted,fontSize:13,display:"block",marginBottom:6}}>Mês</label><input value={nMes} onChange={e=>setNMes(e.target.value)} placeholder="Ex: Mai" style={inp}/></div>
        <div style={{flex:1,minWidth:100}}><label style={{color:C.muted,fontSize:13,display:"block",marginBottom:6}}>Valor ({cur.u})</label><input type="number" value={nVal} onChange={e=>setNVal(e.target.value)} placeholder="Ex: 95" style={inp}/></div>
        <div style={{display:"flex",alignItems:"flex-end"}}><button onClick={addR} style={{...pb({borderRadius:12,padding:"13px 18px",minHeight:50,boxShadow:"none",fontSize:15}),whiteSpace:"nowrap"}}><Plus size={16}/>Adicionar</button></div>
      </div>
    </div>
  </div>);}

// ── ALIMENTAÇÃO: Receitas completas ──────────────────────────────────────────
function SecAlimentacao(){
  const[sel,setSel]=useState(null),[filt,setFilt]=useState("Todas");
  const cats=["Todas",...new Set(REC.map(r=>r.ct))];
  const filtered=filt==="Todas"?REC:REC.filter(r=>r.ct===filt);
  if(sel)return(<div style={{height:"100%",overflowY:"auto",padding:"22px 24px"}}>
    <button onClick={()=>setSel(null)} style={{...gb({borderRadius:12,padding:"10px 18px",minHeight:44,marginBottom:20})}}>← Voltar às receitas</button>
    <div style={{...gl({borderRadius:20}),padding:"26px 24px"}}>
      <div style={{fontSize:52,marginBottom:12}}>{sel.e}</div>
      <h2 style={{color:C.text,fontSize:23,fontWeight:800,marginBottom:10}}>{sel.nm}</h2>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:22}}>
        {[{l:`⏱ ${sel.tm}`,c:C.pink},{l:`🔥 ${sel.kc} kcal`,c:C.success},{l:sel.ct,c:C.muted},{l:sel.df,c:C.muted}].map((t,i)=>(<span key={i} style={{background:`${t.c}18`,border:`1px solid ${t.c}33`,borderRadius:8,padding:"5px 12px",color:t.c,fontSize:13,fontWeight:600}}>{t.l}</span>))}
      </div>
      <div style={{marginBottom:22}}><div style={{color:C.text,fontWeight:800,fontSize:18,marginBottom:12}}>🥘 Ingredientes</div>{sel.ig.map((ig,i)=>(<div key={i} style={{display:"flex",gap:10,marginBottom:9}}><div style={{width:7,height:7,borderRadius:"50%",background:C.pink,flexShrink:0,marginTop:8}}/><span style={{color:C.muted,fontSize:16}}>{ig}</span></div>))}</div>
      <div><div style={{color:C.text,fontWeight:800,fontSize:18,marginBottom:12}}>👩‍🍳 Modo de preparo</div>{sel.st.map((s,i)=>(<div key={i} style={{display:"flex",gap:14,marginBottom:16}}><div style={{width:30,height:30,borderRadius:"50%",background:`linear-gradient(135deg,${C.pink},${C.pinkD})`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,color:"#fff",fontSize:13,fontWeight:800}}>{i+1}</div><span style={{color:C.muted,fontSize:15,lineHeight:1.7,paddingTop:4}}>{s}</span></div>))}</div>
    </div>
  </div>);
  return(<div style={{height:"100%",overflowY:"auto",padding:"22px 24px"}}>
    <h2 style={{color:C.text,fontSize:21,fontWeight:800,marginBottom:4}}>🥗 Receitas do seu Cardápio</h2>
    <p style={{color:C.muted,fontSize:15,marginBottom:18}}>Todas selecionadas especialmente para o controle glicêmico</p>
    <div style={{display:"flex",gap:8,marginBottom:18,flexWrap:"wrap"}}>
      {cats.map(c=><button key={c} onClick={()=>setFilt(c)} style={{padding:"10px 18px",borderRadius:22,border:`1.5px solid ${filt===c?C.pink:C.border}`,background:filt===c?`linear-gradient(135deg,${C.pink},${C.pinkD})`:"var(--btn-ghost)",color:filt===c?"#fff":C.muted,fontWeight:600,fontSize:14}}>{c}</button>)}
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
      {filtered.map(r=>(<div key={r.id} onClick={()=>setSel(r)} style={{...gl({borderRadius:18}),padding:"20px 18px",cursor:"pointer",transition:"all 0.22s"}} onMouseEnter={e=>{e.currentTarget.style.borderColor=C.pink;e.currentTarget.style.transform="translateY(-2px)"}} onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.transform="translateY(0)"}}>
        <div style={{fontSize:38,marginBottom:10}}>{r.e}</div>
        <div style={{color:C.text,fontWeight:700,fontSize:15,marginBottom:4}}>{r.nm}</div>
        <div style={{color:C.muted,fontSize:13,marginBottom:10}}>{r.ct}</div>
        <div style={{display:"flex",gap:6}}><span style={{background:`${C.pink}18`,borderRadius:7,padding:"4px 10px",color:C.pink,fontSize:12,fontWeight:600}}>⏱ {r.tm}</span><span style={{background:"rgba(31,204,116,0.12)",borderRadius:7,padding:"4px 10px",color:C.success,fontSize:12,fontWeight:600}}>🔥 {r.kc}</span></div>
      </div>))}
    </div>
  </div>);}
// ── EXAMES ───────────────────────────────────────────────────────────────────
function SecExames(){
  const[tab,setTab]=useState("pedidos");
  return(<div style={{height:"100%",overflowY:"auto",padding:"22px 24px"}}>
    <h2 style={{color:C.text,fontSize:21,fontWeight:800,marginBottom:4}}>🔬 Exames e Resultados</h2>
    <p style={{color:C.muted,fontSize:15,marginBottom:20}}>Pedidos da Dra. Jessica Benevides e seus resultados</p>
    <div style={{display:"flex",gap:8,marginBottom:22}}>
      {[{id:"pedidos",lb:"📋 Pedidos da Dra."},{id:"resultados",lb:"📊 Meus Resultados"}].map(t=>(
        <button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,padding:"13px 18px",borderRadius:12,border:`1.5px solid ${tab===t.id?C.pink:C.border}`,background:tab===t.id?`linear-gradient(135deg,${C.pink},${C.pinkD})`:"var(--btn-ghost)",color:tab===t.id?"#fff":C.muted,fontWeight:700,fontSize:15,boxShadow:tab===t.id?`0 4px 18px ${C.pinkG}`:"none"}}>{t.lb}</button>
      ))}
    </div>
    {tab==="pedidos"&&(<div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={{...gl({borderRadius:14,borderColor:`${C.pink}22`,background:C.pinkL}),padding:"14px 18px"}}>
        <p style={{color:C.muted,fontSize:14}}><span style={{color:C.pinkLight,fontWeight:700}}>Dra. Jessica Benevides</span> · CRM-SP 145.832 · Endocrinologista parceira da Mentoria 4D</p>
      </div>
      {ORDERS.map(o=>(<div key={o.id} style={{...gl({borderRadius:18}),padding:22}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
          <div><div style={{color:C.text,fontWeight:800,fontSize:16}}>Pedido de {o.dt}</div><div style={{color:C.muted,fontSize:14,marginTop:2}}>Dra. Jessica Benevides</div></div>
          <span style={{background:o.st==="Pendente"?"rgba(240,5,154,0.15)":"rgba(31,204,116,0.12)",border:`1px solid ${o.st==="Pendente"?`${C.pink}44`:"rgba(31,204,116,0.4)"}`,borderRadius:8,padding:"5px 12px",color:o.st==="Pendente"?C.pink:C.success,fontSize:13,fontWeight:700}}>{o.st}</span>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:7,marginBottom:14}}>
          {o.ex.map((ex,i)=>(<div key={i} style={{display:"flex",gap:10,alignItems:"center"}}><div style={{width:6,height:6,borderRadius:"50%",background:C.pink,flexShrink:0}}/><span style={{color:C.text,fontSize:15}}>{ex}</span></div>))}
        </div>
        <div style={{...gl({borderRadius:10,background:"var(--surf)"}),padding:"10px 14px"}}>
          <span style={{color:C.muted,fontSize:14}}>📋 <strong style={{color:C.text}}>Instruções:</strong> {o.ins}</span>
        </div>
      </div>))}
    </div>)}
    {tab==="resultados"&&<SecEvolucao/>}
  </div>);}

// ── CONQUISTAS & RANKING ────────────────────────────────────────────────────
function SecConquistas(){
  const[tab,setTab]=useState("badges"),[feed,setFeed]=useState(FEED0),[opCmt,setOpCmt]=useState(null),[cmtTxt,setCmtTxt]=useState("");
  const me=RKG.find(u=>u.me);
  const tgLk=id=>setFeed(f=>f.map(i=>i.id===id?{...i,lk:i.liked?i.lk-1:i.lk+1,liked:!i.liked}:i));
  const addCmt=id=>{if(!cmtTxt.trim())return;setFeed(f=>f.map(i=>i.id===id?{...i,cm:[...i.cm,{u:"Você",t:cmtTxt}]}:i));setCmtTxt("");setOpCmt(null);};
  return(<div style={{height:"100%",overflowY:"auto",padding:"22px 24px"}}>
    <h2 style={{color:C.text,fontSize:21,fontWeight:800,marginBottom:4}}>🏆 Conquistas & Ranking</h2>
    <div style={{...gl({borderRadius:16,background:`${C.pink}07`,borderColor:`${C.pink}25`}),padding:"16px 20px",marginBottom:20,display:"flex",alignItems:"center",gap:14}}>
      <Av emoji={me.e} color={me.col} size={48} glow/>
      <div style={{flex:1}}><div style={{color:C.muted,fontSize:13,marginBottom:2}}>Sua posição no ranking</div><div style={{display:"flex",alignItems:"baseline",gap:8}}><span style={{color:C.pink,fontSize:32,fontWeight:900}}>#{me.p}</span><span style={{color:C.text,fontSize:16,fontWeight:700}}>{me.nm}</span></div></div>
      <div style={{textAlign:"right"}}><div style={{color:C.gold,fontWeight:800,fontSize:18}}>{me.xp} XP</div><div style={{color:C.muted,fontSize:12}}>🔥 {me.st} dias</div></div>
    </div>
    <div style={{display:"flex",gap:8,marginBottom:20,flexWrap:"wrap"}}>
      {[{id:"badges",lb:"🏅 Minhas Medalhas"},{id:"ranking",lb:"🏆 Ranking"},{id:"comunidade",lb:"🤝 Comunidade"}].map(t=>(
        <button key={t.id} onClick={()=>setTab(t.id)} style={{padding:"10px 16px",borderRadius:12,border:`1.5px solid ${tab===t.id?C.pink:C.border}`,background:tab===t.id?`linear-gradient(135deg,${C.pink},${C.pinkD})`:"var(--btn-ghost)",color:tab===t.id?"#fff":C.muted,fontWeight:700,fontSize:14,boxShadow:tab===t.id?`0 4px 18px ${C.pinkG}`:"none"}}>{t.lb}</button>
      ))}
    </div>
    {tab==="badges"&&(<div>{["Sistema","Alimentação","Saúde","Social","Ranking"].map(cat=>(<div key={cat} style={{marginBottom:18}}>
      <div style={{color:C.muted,fontSize:13,fontWeight:600,textTransform:"uppercase",letterSpacing:"1px",marginBottom:10}}>{cat}</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        {BADGES.filter(b=>b.ct===cat).map(b=>(<div key={b.id} style={{...gl({borderRadius:14,background:b.ok?"var(--surf)":"rgba(0,0,0,0.2)",borderColor:b.ok?C.border:"var(--surf)"}),padding:14,display:"flex",gap:10,opacity:b.ok?1:0.5}}>
          <span style={{fontSize:26,filter:b.ok?"none":"grayscale(1)"}}>{b.e}</span>
          <div><div style={{color:b.ok?C.text:C.muted,fontWeight:700,fontSize:14}}>{b.nm}</div><div style={{color:C.muted,fontSize:12,marginTop:2,lineHeight:1.4}}>{b.ds}</div><div style={{marginTop:6}}>{b.ok?<span style={{background:"rgba(31,204,116,0.15)",border:"1px solid rgba(31,204,116,0.3)",borderRadius:6,padding:"2px 8px",color:C.success,fontSize:11,fontWeight:700}}>✓ +{b.xp} XP</span>:<span style={{color:C.muted,fontSize:12}}><Lock size={10} style={{display:"inline",marginRight:3}}/>+{b.xp} XP</span>}</div></div>
        </div>))}
      </div>
    </div>))}</div>)}
    {tab==="ranking"&&(<div style={{display:"flex",flexDirection:"column",gap:8}}>
      <div style={{...gl({borderRadius:16}),padding:"20px 16px",marginBottom:4}}>
        <div style={{textAlign:"center",color:C.muted,fontSize:12,fontWeight:600,textTransform:"uppercase",letterSpacing:"1px",marginBottom:18}}>🏆 Pódio do Mês</div>
        <div style={{display:"flex",justifyContent:"center",alignItems:"flex-end",gap:14}}>
          {[RKG[1],RKG[0],RKG[2]].map((u,idx)=>{const cs=[C.silver,C.gold,C.bronze],ht=[90,124,76],md=["🥈","👑","🥉"];return(<div key={u.p} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:7}}><Av emoji={u.e} color={u.col} size={48} glow={idx===1}/><div style={{fontWeight:800,fontSize:13,color:C.text,textAlign:"center",maxWidth:70}}>{u.nm.split(" ")[0]}</div><div style={{color:cs[idx],fontSize:11,fontWeight:600}}>{u.xp} XP</div><div style={{width:68,height:ht[idx],borderRadius:"8px 8px 0 0",background:`linear-gradient(180deg,${cs[idx]}30,${cs[idx]}10)`,border:`1px solid ${cs[idx]}40`,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:26,animation:idx===1?"float 3s ease-in-out infinite":"none"}}>{md[idx]}</span></div></div>);})}</div>
      </div>
      {RKG.map(u=>(<div key={u.p} style={{...gl({borderRadius:13,background:u.me?`${C.pink}07`:"var(--surf)",borderColor:u.me?`${C.pink}30`:C.border}),padding:"14px 18px",display:"flex",alignItems:"center",gap:12}}>
        <div style={{width:26,textAlign:"center"}}>{u.p<=3?<span style={{fontSize:18}}>{["🥇","🥈","🥉"][u.p-1]}</span>:<span style={{color:u.me?C.pink:C.muted,fontWeight:800,fontSize:14}}>#{u.p}</span>}</div>
        <Av emoji={u.e} color={u.col} size={38}/>
        <div style={{flex:1}}><div style={{color:u.me?C.pinkLight:C.text,fontWeight:700,fontSize:15}}>{u.nm}{u.me&&" (você)"}</div><div style={{color:C.muted,fontSize:12}}>{u.nk} · 🔥{u.st}d</div></div>
        <div style={{textAlign:"right"}}><div style={{color:u.p===1?C.gold:u.p===2?C.silver:u.p===3?C.bronze:C.text,fontWeight:800,fontSize:15}}>{u.xp}</div><div style={{color:C.muted,fontSize:11}}>XP</div></div>
      </div>))}
    </div>)}
    {tab==="comunidade"&&(<div style={{display:"flex",flexDirection:"column",gap:12}}>
      <p style={{color:C.muted,fontSize:14,marginBottom:4}}>Celebre as conquistas da comunidade! 💕</p>
      {feed.map(item=>(<div key={item.id} style={{...gl({borderRadius:18}),padding:"18px 20px"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}><Av emoji={item.e} color={item.col} size={40}/><div><div style={{color:C.text,fontWeight:700,fontSize:15}}>{item.u}</div><div style={{color:C.muted,fontSize:12}}>{item.t}</div></div></div>
        <div style={{...gl({borderRadius:12,background:`${C.pink}06`,borderColor:`${C.pink}20`}),padding:"12px 16px",marginBottom:12,display:"flex",gap:12,alignItems:"center"}}><span style={{fontSize:26}}>{item.b}</span><div><div style={{color:C.muted,fontSize:11,fontWeight:600,textTransform:"uppercase"}}>Nova conquista</div><div style={{color:C.pinkLight,fontWeight:700,fontSize:15}}>{item.bn}</div></div></div>
        {item.cm.length>0&&<div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:10}}>{item.cm.map((c,i)=>(<div key={i} style={{display:"flex",gap:8}}><div style={{width:24,height:24,borderRadius:"50%",background:"var(--btn-ghost)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:C.muted,fontWeight:700,flexShrink:0}}>{c.u[0]}</div><div style={{background:"var(--surf)",borderRadius:"0 10px 10px 10px",padding:"6px 12px"}}><span style={{color:C.pink,fontWeight:700,fontSize:13}}>{c.u}: </span><span style={{color:C.muted,fontSize:13}}>{c.t}</span></div></div>))}</div>}
        {opCmt===item.id&&<div style={{display:"flex",gap:8,marginBottom:10}}><input value={cmtTxt} onChange={e=>setCmtTxt(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addCmt(item.id)} placeholder="Escreva um comentário…" style={{...inp,flex:1,padding:"9px 14px",fontSize:14}}/><button onClick={()=>addCmt(item.id)} style={{...pb({borderRadius:10,padding:"9px 14px",minHeight:44,fontSize:14,boxShadow:"none"})}}><Send size={14}/></button><button onClick={()=>setOpCmt(null)} style={{background:"var(--surf)",border:`1px solid ${C.border}`,borderRadius:10,padding:"9px 12px",color:C.muted,cursor:"pointer"}}><X size={14}/></button></div>}
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>tgLk(item.id)} style={{display:"flex",alignItems:"center",gap:6,padding:"8px 16px",borderRadius:11,background:item.liked?`${C.pink}18`:"var(--surf)",border:`1.5px solid ${item.liked?C.pink:C.border}`,color:item.liked?C.pink:C.muted,fontSize:14,fontWeight:700}}><Heart size={15} fill={item.liked?C.pink:"none"}/>{item.lk}</button>
          <button onClick={()=>setOpCmt(opCmt===item.id?null:item.id)} style={{display:"flex",alignItems:"center",gap:6,padding:"8px 16px",borderRadius:11,background:"var(--surf)",border:`1.5px solid ${C.border}`,color:C.muted,fontSize:14,fontWeight:600}}><MessageSquare size={15}/>{item.cm.length}</button>
        </div>
      </div>))}
    </div>)}
  </div>);}

// ── CHAT IA ──────────────────────────────────────────────────────────────────
function SecChat(){
  const[msgs,setMsgs]=useState([{r:"ai",t:"Olá! 👋 Sou a IA da Mentoria 4D. Posso te ajudar com dúvidas sobre alimentação, receitas, glicemia e muito mais. Como posso ajudar você hoje?"}]);
  const[input,setInput]=useState(""),[load,setLoad]=useState(false);
  const endR=useRef(null);
  const send=()=>{if(!input.trim())return;const t=input;setMsgs(m=>[...m,{r:"user",t}]);setInput("");setLoad(true);setTimeout(()=>{setMsgs(m=>[...m,{r:"ai",t:CHAT_RESP[chatIdx++%CHAT_RESP.length]}]);setLoad(false);},1200);};
  useEffect(()=>{endR.current?.scrollIntoView({behavior:"smooth"})},[msgs]);
  const sugs=["O que posso comer agora?","Como está minha glicemia?","Sugestão para o jantar","Tenho fome fora do horário","Me ensine uma receita fácil"];
  return(<div style={{display:"flex",flexDirection:"column",height:"100%"}}>
    <div style={{flex:1,overflowY:"auto",padding:"20px 24px",display:"flex",flexDirection:"column",gap:12}}>
      <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:4}}>
        {sugs.map(s=><button key={s} onClick={()=>setInput(s)} style={{padding:"8px 14px",borderRadius:22,background:C.pinkL,border:`1px solid ${C.pink}44`,color:C.pink,fontSize:14,fontWeight:600}}>{s}</button>)}
      </div>
      {msgs.map((m,i)=>(<div key={i} style={{display:"flex",justifyContent:m.r==="user"?"flex-end":"flex-start",animation:"fadeUp 0.3s ease"}}>
        {m.r==="ai"&&<div style={{width:36,height:36,borderRadius:"50%",background:`linear-gradient(135deg,${C.pink},${C.pinkD})`,display:"flex",alignItems:"center",justifyContent:"center",marginRight:10,flexShrink:0,marginTop:4}}><Sparkles size={16} color="#fff"/></div>}
        <div style={{maxWidth:"75%",padding:"13px 17px",borderRadius:m.r==="user"?"20px 20px 4px 20px":"20px 20px 20px 4px",background:m.r==="user"?`linear-gradient(135deg,${C.pink},${C.pinkD})`:"var(--btn-ghost)",border:m.r==="ai"?`1px solid ${C.border}`:"none",color:C.text,fontSize:15,lineHeight:1.6}}>{m.t}</div>
      </div>))}
      {load&&<div style={{display:"flex",gap:10}}><div style={{width:36,height:36,borderRadius:"50%",background:`linear-gradient(135deg,${C.pink},${C.pinkD})`,display:"flex",alignItems:"center",justifyContent:"center"}}><Sparkles size={16} color="#fff"/></div><div style={{...gl({borderRadius:"20px 20px 20px 4px"}),padding:"13px 17px",display:"flex",gap:5}}>{[0,1,2].map(i=><div key={i} style={{width:7,height:7,borderRadius:"50%",background:C.pink,animation:`bounce 1s ease infinite ${i*0.17}s`}}/>)}</div></div>}
      <div ref={endR}/>
    </div>
    <div style={{padding:"14px 24px",borderTop:`1px solid ${C.border}`}}>
      <div style={{display:"flex",gap:10}}>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="Escreva sua dúvida à IA da Mentoria 4D…" style={{...inp,flex:1}}/>
        <button onClick={send} style={{...pb({borderRadius:13,padding:"14px 18px",minHeight:50,boxShadow:"none"})}}><Send size={18}/></button>
      </div>
    </div>
  </div>);}

// ── PERFIL ───────────────────────────────────────────────────────────────────
const AV_E=["🌸","⚡","🦋","🌺","💎","🔥","🌙","⭐","🌿","🦁","🌊","🍀"];
const AV_C=[C.pink,"#a78bfa",C.success,C.warn,C.blue,"#fb7185","#34d399","#fbbf24"];
function SecPerfil({avatar,setAvatar,xp,isDark,setIsDark,onLogout}){
  const[se,setSe]=useState(avatar.emoji),[sc,setSc]=useState(avatar.color),[nk,setNk]=useState(avatar.nick||"@voce");
  const lv=gLv(xp);
  return(<div style={{height:"100%",overflowY:"auto",padding:"22px 24px"}}>
    <div style={{...gl({borderRadius:20,background:`${C.pink}06`,borderColor:`${C.pink}20`}),padding:"26px 22px",marginBottom:20,display:"flex",flexDirection:"column",alignItems:"center",gap:14}}>
      <Av emoji={se} color={sc} size={80} glow/>
      <div style={{textAlign:"center"}}><div style={{color:C.text,fontWeight:800,fontSize:22}}>Você</div><div style={{color:C.muted,fontSize:15}}>{nk}</div><div style={{color:lv.col,fontWeight:700,fontSize:14,marginTop:4}}>Nível {lv.n} · {lv.nm}</div></div>
      <div style={{display:"flex",gap:24,textAlign:"center"}}>{[{l:"XP Total",v:xp},{l:"Conquistas",v:BADGES.filter(b=>b.ok).length},{l:"Streak",v:"14🔥"}].map(s=>(<div key={s.l}><div style={{color:C.text,fontWeight:800,fontSize:20}}>{s.v}</div><div style={{color:C.muted,fontSize:13}}>{s.l}</div></div>))}</div>
    </div>
    <div style={{...gl({borderRadius:16}),padding:22,marginBottom:14}}>
      <div style={{color:C.text,fontWeight:700,fontSize:16,marginBottom:14}}>🎨 Escolha seu avatar</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:10,marginBottom:16}}>
        {AV_E.map((e,i)=><button key={i} onClick={()=>setSe(e)} style={{aspectRatio:"1",borderRadius:14,fontSize:24,display:"flex",alignItems:"center",justifyContent:"center",background:se===e?"rgba(240,5,154,0.18)":"var(--surf)",border:`2px solid ${se===e?C.pink:C.border}`,boxShadow:se===e?`0 0 14px ${C.pinkG}`:"none"}}>{e}</button>)}
      </div>
      <div style={{color:C.text,fontWeight:600,fontSize:14,marginBottom:10}}>Cor do avatar</div>
      <div style={{display:"flex",flexWrap:"wrap",gap:10,marginBottom:16}}>
        {AV_C.map(col=>(<div key={col} onClick={()=>setSc(col)} style={{width:40,height:40,borderRadius:"50%",background:`${col}33`,border:`3px solid ${sc===col?col:"transparent"}`,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:sc===col?`0 0 12px ${col}88`:"none",transition:"all 0.2s"}}>{sc===col&&<Check size={14} color={col}/>}</div>))}
      </div>
      <div style={{color:C.text,fontWeight:600,fontSize:14,marginBottom:8}}>Apelido público (visível no ranking)</div>
      <input value={nk} onChange={e=>setNk(e.target.value)} style={inp} placeholder="@seunome"/>
    </div>
    <button onClick={()=>setAvatar({...avatar,emoji:se,color:sc,nick:nk})} style={{...pb(),width:"100%",fontSize:16,marginBottom:14}}><Check size={18}/>Salvar meu perfil</button>
    {/* Theme toggle */}
    <button onClick={()=>setIsDark(d=>!d)} style={{width:"100%",padding:"14px 18px",borderRadius:14,border:`1px solid ${C.border}`,background:isDark?"var(--surf)":"rgba(0,0,0,0.05)",cursor:"pointer",display:"flex",alignItems:"center",gap:12,marginBottom:10,transition:"all 0.25s"}}>
      <span style={{fontSize:22}}>{isDark?"☀️":"🌙"}</span>
      <div style={{textAlign:"left",flex:1}}>
        <div style={{fontWeight:700,fontSize:15,color:isDark?C.text:"#1a1a1a"}}>{isDark?"Ativar Modo Claro":"Ativar Modo Escuro"}</div>
        <div style={{fontSize:12,color:isDark?C.muted:"#777",marginTop:1}}>Alterar aparência da plataforma</div>
      </div>
      <div style={{width:42,height:24,borderRadius:12,background:isDark?"var(--btn-ghost)":`linear-gradient(135deg,${C.pink},${C.pinkD})`,position:"relative",flexShrink:0,transition:"all 0.3s"}}>
        <div style={{position:"absolute",width:18,height:18,borderRadius:"50%",background:"#fff",top:3,left:isDark?3:21,transition:"left 0.3s ease",boxShadow:"0 1px 4px rgba(0,0,0,0.3)"}}/>
      </div>
    </button>
    {/* Sair da conta */}
    <button onClick={onLogout} style={{width:"100%",padding:"14px 18px",borderRadius:14,border:"1px solid rgba(244,63,94,0.25)",background:"rgba(244,63,94,0.07)",cursor:"pointer",display:"flex",alignItems:"center",gap:12,transition:"all 0.2s"}}>
      <LogOut size={18} color="#f43f5e"/>
      <div style={{textAlign:"left"}}>
        <div style={{fontWeight:700,fontSize:15,color:"#f43f5e"}}>Sair da conta</div>
        <div style={{fontSize:12,color:"rgba(244,63,94,0.6)",marginTop:1}}>Encerrar sessão atual</div>
      </div>
    </button>
  </div>);}
// ══════════════════════════════════════════════════════════════════════════
// DASHBOARD WRAPPER
// ══════════════════════════════════════════════════════════════════════════

// ── RECEITAS BLOQUEADAS (aguardando Sessão Individual de Diagnóstico) ────────────────────────────
function SecAlimentacaoLocked(){
  const[unlocked,setUnlocked]=useState(false);
  if(unlocked) return(<SecAlimentacao/>);
  return(<div style={{height:"100%",position:"relative",overflow:"hidden"}}>
    {/* Blurred background preview */}
    <div style={{position:"absolute",inset:0,filter:"blur(8px)",opacity:0.4,pointerEvents:"none",padding:"22px 24px",overflowY:"hidden"}}>
      <h2 style={{color:C.text,fontSize:21,fontWeight:800,marginBottom:4}}>🥗 Receitas do seu Cardápio</h2>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginTop:20}}>
        {REC.map(r=>(<div key={r.id} style={{...gl({borderRadius:18}),padding:"20px 18px"}}>
          <div style={{fontSize:38,marginBottom:10}}>{r.e}</div>
          <div style={{color:C.text,fontWeight:700,fontSize:15,marginBottom:4}}>{r.nm}</div>
          <div style={{color:C.muted,fontSize:13}}>{r.ct}</div>
        </div>))}
      </div>
    </div>
    {/* Lock overlay */}
    <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
      <div style={{...gl({borderRadius:24,background:"rgba(10,10,15,0.88)",borderColor:`${C.pink}33`}),padding:"32px 28px",maxWidth:340,width:"100%",textAlign:"center",boxShadow:`0 8px 60px rgba(0,0,0,0.7)`}}>
        <div style={{width:72,height:72,borderRadius:"50%",background:"rgba(240,5,154,0.12)",border:`2px solid ${C.pink}44`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px"}}>
          <Lock size={32} color={C.pink}/>
        </div>
        <div style={{color:C.text,fontWeight:800,fontSize:20,marginBottom:12}}>Recurso Bloqueado</div>
        <p style={{color:C.muted,fontSize:15,lineHeight:1.7,marginBottom:28}}>Suas receitas e cardápio personalizado serão liberados automaticamente após sua Sessão Individual de Diagnóstico com a Guardiã.</p>
        <div style={{background:"rgba(240,5,154,0.08)",border:`1px solid ${C.pink}33`,borderRadius:14,padding:"12px 16px",marginBottom:20}}>
          <div style={{color:C.pink,fontSize:14,fontWeight:600}}>📅 Aguardando Sessão Individual de Diagnóstico com a Guardiã</div>
        </div>
        <button onClick={()=>setUnlocked(true)} style={{...gb({width:"100%",fontSize:14,padding:"12px",minHeight:46})}}>
          🔓 Demonstração (desbloquear para teste)
        </button>
      </div>
    </div>
  </div>);}

const NAV_ITEMS=[
  {id:"inicio",   icon:"🏠", label:"Início",      sub:"Chat · Receita · Cardápio"},
  {id:"evolucao", icon:"📊", label:"Evolução",     sub:"Gráficos · Progresso"},
  {id:"aliment",  icon:"🥗", label:"Receitas",     sub:"Cardápio personalizado"},
  {id:"exames",   icon:"🔬", label:"Exames",       sub:"Pedidos · Resultados"},
  {id:"conquistas",icon:"🏆",label:"Conquistas",   sub:"Ranking · Comunidade"},
  {id:"chat",     icon:"💬", label:"Chat IA",      sub:"Dúvidas alimentares"},
  {id:"perfil",   icon:"👤", label:"Meu Perfil",   sub:"Avatar · Configurações"},
];

function DashboardScreen({onLogout,isDark,setIsDark,userName=""}){
  const[nav,setNav]=useState("inicio");
  const[xp]=useState(520);
  const[avatar,setAvatar]=useState({emoji:"🌙",color:C.pink,nick:"@voce"});
  const[sideOpen,setSideOpen]=useState(false);
  const[sideClosing,setSideClosing]=useState(false);
  const openSide=()=>setSideOpen(true);
  const closeSide=()=>{setSideClosing(true);setTimeout(()=>{setSideOpen(false);setSideClosing(false);},280);};

  const renderContent=()=>{
    switch(nav){
      case"inicio":    return (<SecInicio userName={userName||avatar.nick.replace('@','')}/>);
      case"evolucao":  return (<SecEvolucao/>);
      case"aliment":   return (<SecAlimentacaoLocked/>);
      case"exames":    return (<SecExames/>);
      case"conquistas":return (<SecConquistas/>);
      case"chat":      return (<SecChat/>);
      case"perfil":    return (<SecPerfil avatar={avatar} setAvatar={setAvatar} xp={xp} isDark={isDark} setIsDark={setIsDark} onLogout={onLogout}/>);
      default:         return (<SecInicio/>);
    }
  };

  const cur=NAV_ITEMS.find(n=>n.id===nav);

  return(<div style={{height:"100vh",display:"flex",flexDirection:"column",position:"relative",zIndex:1,background:"var(--bg,#0b0b0d)"}}>

    {/* ── ELEGANT HEADER ─────────────────────────────────────── */}
    <div style={{flexShrink:0,padding:"0 16px",borderBottom:`1px solid ${C.border}`,background:"var(--bg,#0b0b0d)",backdropFilter:"blur(28px)",WebkitBackdropFilter:"blur(28px)",boxShadow:"0 1px 0 var(--border,rgba(255,255,255,0.09))",display:"flex",alignItems:"center",gap:12,minHeight:62,position:"relative"}}>
      {/* Hamburger */}
      <button onClick={openSide} style={{width:46,height:46,borderRadius:14,background:"var(--btn-ghost)",border:`1px solid ${C.border}`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:5,cursor:"pointer",flexShrink:0,transition:"all 0.2s"}} onMouseEnter={e=>{e.currentTarget.style.background="rgba(240,5,154,0.12)";e.currentTarget.style.borderColor=`${C.pink}55`;}} onMouseLeave={e=>{e.currentTarget.style.background="var(--btn-ghost)";e.currentTarget.style.borderColor=C.border;}}>
        {[0,1,2].map(i=><div key={i} style={{width:20,height:2.5,borderRadius:2,background:"var(--muted,#8a8aa0)",transition:"all 0.2s"}}/>)}
      </button>
      {/* Title — theme-aware seamless shimmer */}
      <div style={{flex:1,textAlign:"center",lineHeight:1.18,padding:"2px 0"}}>
        <div style={{background:"linear-gradient(90deg,var(--shimmer-base) 0%,var(--shimmer-base) 20%,#f0059a 50%,var(--shimmer-base) 80%,var(--shimmer-base) 100%)",backgroundSize:"200% auto",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text",fontWeight:900,fontSize:17,letterSpacing:"-0.3px",animation:"shimmerTitle 8s linear infinite"}}>
          Guia Metabólico
        </div>
        <div style={{background:"linear-gradient(90deg,#c0027c 0%,#f0059a 30%,#ff79c6 50%,#f0059a 70%,#c0027c 100%)",backgroundSize:"200% auto",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text",fontWeight:900,fontSize:16,letterSpacing:"-0.1px",animation:"shimmerTitle 10s linear infinite reverse"}}>
          Personalizado
        </div>
      </div>
      {/* Streak only — no avatar */}
      <div style={{flexShrink:0}}>
        <div style={{background:"rgba(234,179,8,0.14)",border:"1px solid rgba(234,179,8,0.35)",borderRadius:10,padding:"6px 12px",display:"flex",alignItems:"center",gap:4}}>
          <span style={{fontSize:15}}>🔥</span><span style={{color:C.warn,fontWeight:800,fontSize:15}}>14</span>
        </div>
      </div>
    </div>

    {/* ── BODY ─────────────────────────────────────────────────── */}
    <div style={{flex:1,position:"relative",overflow:"hidden"}}>

      {/* Main content */}
      <div key={nav} style={{position:"absolute",inset:0,animation:"slideR 0.3s cubic-bezier(0.4,0,0.2,1)",display:"flex",flexDirection:"column",overflow:"hidden",filter:sideOpen?"blur(3px)":"none",transition:"filter 0.3s ease",pointerEvents:sideOpen?"none":"all"}}>
        {/* Subheader — greeting on Início, breadcrumb elsewhere */}
        {nav==="inicio" ? (
          <div style={{flexShrink:0,padding:"9px 18px",borderBottom:`1px solid ${C.border}`,background:"rgba(0,0,0,0.12)",display:"flex",alignItems:"center",gap:10,animation:"fadeUp 0.3s ease"}}>
            <span style={{fontSize:16}}>🏠</span>
            <span style={{color:C.text,fontWeight:700,fontSize:14,flex:1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
              {getGreeting()}{userName?`, ${userName}`:""}! 👋&nbsp;&nbsp;
              <span style={{color:C.muted,fontWeight:400,fontSize:13}}>Sua jornada começa aqui</span>
            </span>
          </div>
        ) : (
          <div style={{flexShrink:0,padding:"10px 20px",borderBottom:`1px solid ${C.border}`,background:"rgba(0,0,0,0.12)",display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:17}}>{cur?.icon}</span>
            <span style={{color:C.text,fontWeight:700,fontSize:15}}>{cur?.label}</span>
            <span style={{color:C.muted,fontSize:13}}>· {cur?.sub}</span>
            {nav==="conquistas"&&<span style={{marginLeft:"auto",background:`${C.gold}20`,border:`1px solid ${C.gold}44`,borderRadius:8,padding:"3px 10px",color:C.gold,fontSize:12,fontWeight:700}}>Você está em #8</span>}
            {nav==="chat"&&<span style={{marginLeft:"auto",background:"rgba(31,204,116,0.15)",border:"1px solid rgba(31,204,116,0.4)",borderRadius:8,padding:"3px 10px",color:C.success,fontSize:12,fontWeight:700}}>IA Online ✓</span>}
          </div>
        )}
        <div style={{flex:1,overflow:"hidden"}}>{renderContent()}</div>
      </div>

      {/* Blur overlay when sidebar open */}
      {sideOpen&&<div onClick={closeSide} style={{position:"absolute",inset:0,zIndex:10,animation:"blurIn 0.28s ease forwards",backdropFilter:"blur(6px)",background:"rgba(0,0,0,0.45)",cursor:"pointer"}}/>}

      {/* SIDEBAR DRAWER */}
      {sideOpen&&<div style={{position:"absolute",left:0,top:0,bottom:0,width:270,zIndex:20,display:"flex",flexDirection:"column",background:"var(--bg,#0b0b0d)",borderRight:"1px solid var(--border,rgba(255,255,255,0.09))",backdropFilter:"blur(30px)",boxShadow:`6px 0 40px rgba(0,0,0,0.6)`,animation:sideClosing?"sideSlideOut 0.28s cubic-bezier(0.4,0,0.2,1) forwards":"sideSlideIn 0.3s cubic-bezier(0.4,0,0.2,1) forwards"}}>
        {/* Sidebar header */}
        <div style={{padding:"20px 18px 14px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div>
            <div style={{color:C.text,fontWeight:800,fontSize:17,lineHeight:1}}>Menu</div>
            <div style={{color:C.muted,fontSize:12,marginTop:2}}>Mentoria 4D · Bela Nutrição</div>
          </div>
          <button onClick={closeSide} style={{width:36,height:36,borderRadius:10,background:"var(--btn-ghost)",border:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:C.muted,fontSize:18}}>✕</button>
        </div>
        {/* XP mini */}
        <div style={{padding:"12px 18px",borderBottom:`1px solid ${C.border}`}}>
          <XPBar xp={xp}/>
        </div>
        {/* Nav items */}
        <div style={{flex:1,padding:"10px 10px",overflowY:"auto"}}>
          {NAV_ITEMS.map(n=>(<button key={n.id} onClick={()=>{setNav(n.id);closeSide();}} style={{width:"100%",padding:"14px 16px",borderRadius:14,border:"none",cursor:"pointer",textAlign:"left",marginBottom:4,background:nav===n.id?C.pinkL:"var(--surf)",borderLeft:nav===n.id?`3px solid ${C.pink}`:"3px solid transparent",transition:"all 0.18s"}}>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <span style={{fontSize:24,lineHeight:1}}>{n.icon}</span>
              <div>
                <div style={{color:nav===n.id?C.pink:C.text,fontWeight:700,fontSize:17,lineHeight:1.2}}>{n.label}</div>
                <div style={{color:C.muted,fontSize:13,marginTop:2}}>{n.sub}</div>
              </div>
            </div>
          </button>))}
        </div>
        {/* Theme toggle only — logout moved to Profile */}
        <div style={{padding:"10px 10px 18px",borderTop:`1px solid ${C.border}`}}>
          <button onClick={()=>setIsDark(d=>!d)} style={{width:"100%",padding:"13px 16px",borderRadius:14,border:`1px solid ${C.border}`,background:isDark?"var(--surf)":"rgba(0,0,0,0.06)",cursor:"pointer",display:"flex",alignItems:"center",gap:12,color:isDark?C.muted:"#444",transition:"all 0.25s"}}>
            <span style={{fontSize:22}}>{isDark?"☀️":"🌙"}</span>
            <div style={{textAlign:"left"}}>
              <div style={{fontWeight:700,fontSize:15,color:isDark?C.text:"#1a1a1a"}}>{isDark?"Modo Claro":"Modo Escuro"}</div>
              <div style={{fontSize:12,color:isDark?C.muted:"#777",marginTop:1}}>{isDark?"Ativar tema claro":"Ativar tema escuro"}</div>
            </div>
          </button>
        </div>
      </div>}
    </div>
  </div>);}

// ══════════════════════════════════════════════════════════════════════════
// ROOT APP
// ══════════════════════════════════════════════════════════════════════════
export default function App(){
  const[screen,setScreen]=useState("login");
  const[hasCompletedForm,setHasCompletedForm]=useState(false);
  const[isDark,setIsDark]=useState(true);
  const[userName,setUserName]=useState("");

  // CSS vars applied via GCss component — no direct body style needed

  const handleLogin=()=>{
    if(hasCompletedForm) setScreen("dashboard");
    else setScreen("form");
  };
  const handleFormDone=(nome)=>{
    setHasCompletedForm(true);
    if(nome) setUserName(nome.split(" ")[0]);
    setScreen("gate");
  };
  const handleGateAccess=()=>setScreen("agenda");
  const handleAgendaConfirm=()=>setScreen("dashboard");

  return(<div style={{minHeight:"100vh",color:"var(--text,#f0f0f4)",background:"var(--bg,#0b0b0d)",transition:"background 0.35s ease,color 0.35s ease"}}>
    <GCss isDark={isDark}/>
    <BG/>
    <div key={screen} style={{animation:"fadeIn 0.35s ease",position:"relative",zIndex:1}}>
      {screen==="login"    &&<LoginScreen     onLogin={handleLogin}/>}
      {screen==="form"     &&<FormularioScreen onDone={handleFormDone}/>}
      {screen==="gate"     &&<FormGate        onAccess={handleGateAccess}/>}
      {screen==="agenda"   &&<AgendamentoScreen onConfirm={handleAgendaConfirm}/>}
      {screen==="dashboard"&&<DashboardScreen onLogout={()=>setScreen("login")} isDark={isDark} setIsDark={setIsDark} userName={userName}/>}
    </div>
  </div>);}
