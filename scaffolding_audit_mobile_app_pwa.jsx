import React, { useEffect, useMemo, useState } from "react";

// ————————————————————————————————————————————
// Scaffolding Audit – Mobile PWA (Branded + PIN Lock)
// ————————————————————————————————————————————
// What changed in this version:
// • Add simple brand theme (colors + logo text) – change BRAND below
// • PIN lock screen before accessing the app (can be changed in Settings)
// • Consistent use of brand colors across UI
// • Same features: photos, offline, Excel/JSON export, printable report
//
// NOTE: To change brand details quickly, edit the BRAND constant.
// You can also change the PIN at runtime via the Settings panel in the app.

const BRAND = {
  name: "Celtic Scaffold Ltd.",
  primary: "#005C99",   // Deep blue
  secondary: "#FDB913", // Amber
  accent: "#0DB14B",    // Safety green
  danger: "#D64545",    // Red
  surface: "#F5F7FA",   // Light grey bg
  text: "#111827",
  logoUrl: "",           // Optional: paste a logo URL or data URL
  defaultPin: "2468",    // Change this to your chosen PIN
};

// ---- Data model ----
const CHECKLIST = [
  ["Administration & Certification", "Scaffold design/plan available where required for complex or non-standard scaffolds.", "HSA Code of Practice; SI No. 291/2013"],
  ["Administration & Certification", "Hand-over certificate / initial GA3 completed before first use.", "HSA GA3 Form; HSA Code of Practice"],
  ["Administration & Certification", "Scaffold tag system at access points indicates current inspection status.", "CIF / HSA guidance"],
  ["Administration & Certification", "Weekly inspection records (≤7 days) and after alteration, adverse weather, or events.", "HSA Code of Practice; SI No. 291/2013"],
  ["Administration & Certification", "Competence of scaffolders/inspectors verified; training records available.", "HSA Code of Practice; CIF training"],
  ["Administration & Certification", "Scaffold ID/location clearly marked; max duty/loading class displayed.", "HSA Code of Practice"],

  ["Ground & Foundations", "Ground bearing capacity assessed and adequate; no undermining/erosion.", "HSA Code of Practice"],
  ["Ground & Foundations", "Sole boards provided where required and correctly sized/positioned.", "HSA Code of Practice"],
  ["Ground & Foundations", "Base plates/jacks present on all standards; jacks not over-extended; locked.", "HSA Code of Practice"],
  ["Ground & Foundations", "Drainage and protection from soft ground/standing water provided.", "HSA Code of Practice"],

  ["Main Scaffold Structure", "Standards plumb and continuous; joints properly positioned and secured.", "HSA Code of Practice"],
  ["Main Scaffold Structure", "Ledgers/transoms correctly installed to manufacturer/spec; joints staggered.", "HSA Code of Practice"],
  ["Main Scaffold Structure", "All couplers/fixtures correctly tightened; components free from damage/corrosion.", "HSA Code of Practice"],
  ["Main Scaffold Structure", "Base ties and return/stop-end arrangements as per design/spec.", "HSA Code of Practice"],

  ["Bracing & Ties", "Façade and plan bracing installed per design/system requirements.", "HSA Code of Practice"],
  ["Bracing & Ties", "Anchorage/tie pattern and spacing adequate; anchors tested as specified.", "HSA Code of Practice"],
  ["Bracing & Ties", "Records of anchor tests and tie capacities available.", "HSA Code of Practice"],

  ["Platforms & Decking", "Platform width suitable for loading/duty class; working areas unobstructed.", "HSA Code of Practice"],
  ["Platforms & Decking", "Boards/steel decks secured, level, with correct overhang; no damaged boards.", "HSA Code of Practice"],
  ["Platforms & Decking", "No gaps that risk falls of persons or materials; brickguards where required.", "HSA Code of Practice"],

  ["Edge Protection", "Top guardrail, mid-rail (or equivalent) and toeboards fitted to all open edges.", "HSA Code of Practice"],
  ["Edge Protection", "Loading bays fitted with gates and full edge protection; gates self-closing/managed.", "HSA Code of Practice"],
  ["Edge Protection", "Openings/trapdoors protected and kept closed or guarded.", "HSA Code of Practice"],

  ["Access & Egress", "Safe access provided (stair tower or secured ladders) to all working platforms.", "HSA Code of Practice"],
  ["Access & Egress", "Ladders at correct angle, tied/secured, extending sufficiently above landing.", "HSA Code of Practice"],
  ["Access & Egress", "Access routes kept clear; no trip hazards or stored materials.", "HSA Code of Practice"],

  ["Protection & Containment", "Debris netting/brickguards/fans fitted where required and properly fixed.", "HSA Code of Practice"],
  ["Protection & Containment", "Sheeting/netting loads considered in design; additional ties/bracing provided.", "HSA Code of Practice"],
  ["Protection & Containment", "Toe-boards/mesh to prevent materials falling; waste chutes managed.", "HSA Code of Practice"],

  ["Services & Environment", "Safe clearances from overhead power lines/services maintained; permits in place.", "HSA Code of Practice"],
  ["Services & Environment", "Weather conditions monitored (wind, storms); scaffold checked after severe weather.", "HSA Code of Practice"],
  ["Services & Environment", "Public protection in place: barriers, signage, lighting, controlled access.", "HSA Code of Practice"],

  ["Erection/Alteration/Dismantling", "EAD carried out by competent persons using a safe system of work.", "HSA Code of Practice"],
  ["Erection/Alteration/Dismantling", "Collective fall protection maintained; personal fall arrest used where necessary.", "HSA Code of Practice"],
  ["Erection/Alteration/Dismantling", "Exclusion zones set up below during EAD activities.", "HSA Code of Practice"],

  ["Mobile Towers (if applicable)", "Correct base dimensions/outriggers; platform height within ratio limits.", "HSA Code of Practice"],
  ["Mobile Towers (if applicable)", "Castors in good condition and locked; moved only when empty.", "HSA Code of Practice"],
  ["Mobile Towers (if applicable)", "Access provided internally; guardrails and toeboards fitted.", "HSA Code of Practice"],

  ["Close-out", "Outstanding defects recorded with corrective actions and target dates.", "HSA Code of Practice"],
  ["Close-out", "Scaffold tag updated after inspection; users informed of restrictions.", "HSA Code of Practice"],
];

const STORAGE_KEY = "scaffold_audit_v2";

function useLocalState(defaultValue) {
  const [state, setState] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : defaultValue;
    } catch {
      return defaultValue;
    }
  });
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);
  return [state, setState];
}

function groupBySection(rows){
  const map = {};
  rows.forEach((r, idx) => {
    const [sec, item, ref] = r;
    if(!map[sec]) map[sec] = [];
    map[sec].push({ idx, item, ref });
  });
  return map;
}

// Preserve original section order for stable rendering
const sectionOrder = Array.from(new Set(CHECKLIST.map(r => r[0])));

export default function App() {
  // Build grouped data inside component to avoid preview/SSR quirks
  const grouped = useMemo(() => groupBySection(CHECKLIST), []);
  const sections = useMemo(() => sectionOrder.filter(s => grouped[s] && grouped[s].length), [grouped]);
  const [data, setData] = useLocalState({
    project: "",
    location: "",
    ga3: "",
    inspector: "",
    date: new Date().toISOString().slice(0,10),
    weather: "",
    scaffoldId: "",
    answers: {},
    pin: BRAND.defaultPin,
    unlocked: false,
  });

  const total = CHECKLIST.length;
  const done = useMemo(() => Object.values(data.answers).filter(a => a?.ans).length, [data.answers]);

  function updateAnswer(idx, patch){
    setData(d => ({
      ...d,
      answers: {
        ...d.answers,
        [idx]: { ...(d.answers[idx]||{ans:"", notes:"", photos:[]}), ...patch }
      }
    }));
  }

  function handlePhoto(idx, files){
    if(!files || !files[0]) return;
    const file = files[0];
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result;
      const prev = data.answers[idx]?.photos || [];
      updateAnswer(idx, { photos: [...prev, url] });
    };
    reader.readAsDataURL(file);
  }

  async function exportExcel(){
    const XLSX = await import("xlsx");
    const rows = CHECKLIST.map(([section,item,ref], idx) => ({
      Section: section,
      Item: item,
      Reference: ref,
      Answer: data.answers[idx]?.ans || "",
      Notes: data.answers[idx]?.notes || "",
      PhotoCount: (data.answers[idx]?.photos||[]).length
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Checklist");

    const meta = [{ Field: "Project / Site", Value: data.project },{ Field: "Location", Value: data.location },{ Field: "GA3 Reference", Value: data.ga3 },{ Field: "Inspector", Value: data.inspector },{ Field: "Date", Value: data.date },{ Field: "Weather / Wind", Value: data.weather },{ Field: "Scaffold ID / Area", Value: data.scaffoldId }];
    const ws2 = XLSX.utils.json_to_sheet(meta);
    XLSX.utils.book_append_sheet(wb, ws2, "Cover");

    const wbout = XLSX.write(wb, {bookType:"xlsx", type:"array"});
    const blob = new Blob([wbout], {type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `Scaffold_Audit_${data.date}.xlsx`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function exportJSON(){
    const blob = new Blob([JSON.stringify(data,null,2)], {type:"application/json"});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `Scaffold_Audit_${data.date}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function importJSON(e){
    const f = e.target.files?.[0];
    if(!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      try { setData(JSON.parse(reader.result)); }
      catch { alert("Invalid file"); }
    };
    reader.readAsText(f);
  }

  function PrintableReport(){
    // Local grouping to ensure report view always renders
    const grouped = useMemo(() => groupBySection(CHECKLIST), []);
    const sectionsPR = useMemo(() => sectionOrder.filter(s => grouped[s] && grouped[s].length), [grouped]);
    /* sections computed via sectionsPR */
    const totalNo = Object.entries(data.answers).filter(([,v])=>v?.ans==="No").length;
    return (
      <div className="p-4">
        <h2 className="text-xl font-bold mb-2" style={{color: BRAND.primary}}>Scaffolding Audit Report</h2>
        <div className="grid grid-cols-1 gap-1 text-sm mb-4">
          <div><b>Project / Site: </b>{data.project}</div>
          <div><b>Location: </b>{data.location}</div>
          <div><b>GA3 Reference: </b>{data.ga3}</div>
          <div><b>Inspector: </b>{data.inspector}</div>
          <div><b>Date: </b>{data.date}</div>
          <div><b>Weather / Wind: </b>{data.weather}</div>
          <div><b>Scaffold ID / Area: </b>{data.scaffoldId}</div>
          <div><b>Summary: </b>{done}/{total} answered, {totalNo} items marked "No".</div>
        </div>
        {sectionsPR.map(sec => (
          <div key={sec} className="mb-6">
            <h3 className="font-semibold text-base rounded px-2 py-1" style={{background: BRAND.surface, color: BRAND.text}}>{sec}</h3>
            {(grouped[sec]||[]).map(({idx, item, ref}) => (
              <div key={idx} className="border rounded p-2 mt-2">
                <div className="text-sm"><b>Item:</b> {item}</div>
                <div className="text-xs" style={{color:'#6B7280'}}>Ref: {ref}</div>
                <div className="text-sm mt-1"><b>Answer:</b> {data.answers[idx]?.ans || ''}</div>
                {data.answers[idx]?.notes && (
                  <div className="text-sm mt-1"><b>Notes:</b> {data.answers[idx]?.notes}</div>
                )}
                {(data.answers[idx]?.photos||[]).length>0 && (
                  <div className="flex gap-2 flex-wrap mt-2">
                    {data.answers[idx]?.photos.map((p,i)=>(
                      <img key={i} src={p} alt={`photo-${idx}-${i}`} className="w-32 h-32 object-cover rounded" />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  const [showReport, setShowReport] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  if(!data.unlocked){
    return <PinScreen data={data} setData={setData} />;
  }

  return (
    <div className="max-w-3xl mx-auto p-4 text-base" style={{color: BRAND.text}}>
      <header className="mb-4 flex items-center gap-3">
        {BRAND.logoUrl ? (
          <img src={BRAND.logoUrl} alt="logo" className="h-10 w-10 object-contain" />
        ) : (
          <div className="h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold" style={{background: BRAND.primary}}>CS</div>
        )}
        <div>
          <h1 className="text-2xl font-bold" style={{color: BRAND.primary}}>{BRAND.name}</h1>
          <p className="text-sm" style={{color:'#4B5563'}}>Scaffolding Audit (HSA / CIF)</p>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-3 mb-6">
        <Field label="Project / Site" value={data.project} onChange={v=>setData({...data, project:v})} />
        <Field label="Location" value={data.location} onChange={v=>setData({...data, location:v})} />
        <Field label="GA3 Reference" value={data.ga3} onChange={v=>setData({...data, ga3:v})} />
        <Field label="Inspector" value={data.inspector} onChange={v=>setData({...data, inspector:v})} />
        <Field label="Date" type="date" value={data.date} onChange={v=>setData({...data, date:v})} />
        <Field label="Weather / Wind" value={data.weather} onChange={v=>setData({...data, weather:v})} />
        <Field label="Scaffold ID / Area" value={data.scaffoldId} onChange={v=>setData({...data, scaffoldId:v})} />
      </section>

      <div className="sticky top-0 py-2 z-10 border-y mb-3" style={{background:'white', borderColor:'#E5E7EB'}}>
        <div className="flex gap-2 items-center text-sm">
          <button className="px-3 py-2 rounded text-white" style={{background: BRAND.primary}} onClick={()=>setShowReport(r=>!r)}>{showReport?"Back to Checklist":"Preview / Print Report"}</button>
          <button className="px-3 py-2 rounded border" style={{borderColor: BRAND.primary}} onClick={exportExcel}>Export Excel</button>
          <button className="px-3 py-2 rounded border" style={{borderColor: BRAND.primary}} onClick={exportJSON}>Export JSON</button>
          <label className="px-3 py-2 rounded border cursor-pointer" style={{borderColor: BRAND.primary}}>
            Import JSON
            <input type="file" accept="application/json" className="hidden" onChange={importJSON} />
          </label>
          <button className="ml-auto px-3 py-2 rounded text-white" style={{background: BRAND.accent}} onClick={()=>setShowSettings(true)}>Settings</button>
        </div>
      </div>

      {showReport ? (
        <PrintableReport />
      ) : (
        sectionsPR.map(sec => (
          <div key={sec} className="mb-6">
            <h2 className="text-lg font-semibold rounded px-2 py-1" style={{background: BRAND.surface}}>{sec}</h2>
            {(grouped[sec]||[]).map(({idx, item, ref}) => (
              <div key={idx} className="mt-3 border rounded-lg p-3" style={{borderColor:'#E5E7EB'}}>
                <div className="text-sm font-medium">{item}</div>
                <div className="text-xs" style={{color:'#6B7280'}}>Ref: {ref}</div>
                <div className="flex gap-3 mt-2">
                  {['Yes','No','N/A'].map(opt => (
                    <label key={opt} className="px-3 py-2 rounded border cursor-pointer" style={{borderColor: BRAND.primary, background: data.answers[idx]?.ans===opt? BRAND.primary: 'white', color: data.answers[idx]?.ans===opt? 'white': BRAND.text}}>
                      <input type="radio" name={`ans-${idx}`} className="hidden" checked={data.answers[idx]?.ans===opt} onChange={()=>updateAnswer(idx,{ans:opt})} />
                      {opt}
                    </label>
                  ))}
                </div>
                <textarea className="mt-2 w-full border rounded p-2 text-sm" rows={3} placeholder="Notes / defects / actions" value={data.answers[idx]?.notes||""} onChange={e=>updateAnswer(idx,{notes:e.target.value})} />
                <div className="mt-2 flex items-center gap-2 flex-wrap">
                  <label className="px-3 py-2 rounded border cursor-pointer text-sm" style={{borderColor: BRAND.secondary}}>
                    Add Photo
                    <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e)=>handlePhoto(idx, e.target.files)} />
                  </label>
                  {(data.answers[idx]?.photos||[]).map((p,i)=> (
                    <div key={i} className="relative">
                      <img src={p} alt={`photo-${idx}-${i}`} className="w-20 h-20 object-cover rounded" />
                      <button className="absolute -top-2 -right-2 bg-white border rounded-full w-6 h-6 text-xs" onClick={()=>{
                        const arr = [...(data.answers[idx]?.photos||[])];
                        arr.splice(i,1);
                        updateAnswer(idx,{photos:arr});
                      }}>×</button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))
      )}

      {showSettings && (
        <Modal onClose={()=>setShowSettings(false)} title="Settings">
          <div className="grid gap-3">
            <Field label="Company Name" value={BRAND.name} onChange={(v)=>{BRAND.name=v; window.location.reload();}} />
            <ColorField label="Primary" value={BRAND.primary} onChange={(v)=>{BRAND.primary=v;}} />
            <ColorField label="Secondary" value={BRAND.secondary} onChange={(v)=>{BRAND.secondary=v;}} />
            <ColorField label="Accent" value={BRAND.accent} onChange={(v)=>{BRAND.accent=v;}} />
            <ColorField label="Danger" value={BRAND.danger} onChange={(v)=>{BRAND.danger=v;}} />
            <label className="grid gap-1">
              <span className="text-sm font-medium">Change PIN</span>
              <input type="password" inputMode="numeric" className="border rounded p-2" placeholder="New PIN" onChange={(e)=>setData({...data, pin:e.target.value})} />
            </label>
            <button className="px-3 py-2 rounded text-white" style={{background: BRAND.accent}} onClick={()=>{ alert('Settings saved. (Brand changes apply immediately; PIN saved in this session.)'); }}>Save</button>
          </div>
        </Modal>
      )}

      <footer className="text-xs" style={{color:'#6B7280', marginTop:'2rem', paddingBottom:'2rem'}}>
        Built for Irish HSA / CIF scaffolding audits. This checklist is a field aid — always follow the HSA Code of Practice and site-specific method statements.
      </footer>
    </div>
  );
}

function PinScreen({data, setData}){
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  useEffect(()=>{ setErr(""); }, [code]);
  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{background: BRAND.surface}}>
      <div className="w-full max-w-sm bg-white rounded-2xl p-6 shadow">
        <div className="flex items-center gap-3 mb-4">
          {BRAND.logoUrl ? (
            <img src={BRAND.logoUrl} alt="logo" className="h-10 w-10 object-contain" />
          ) : (
            <div className="h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold" style={{background: BRAND.primary}}>CS</div>
          )}
          <div>
            <div className="text-lg font-bold" style={{color: BRAND.primary}}>{BRAND.name}</div>
            <div className="text-xs" style={{color:'#6B7280'}}>Scaffolding Audit</div>
          </div>
        </div>
        <label className="grid gap-2">
          <span className="text-sm">Enter PIN</span>
          <input type="password" inputMode="numeric" className="border rounded p-3 tracking-widest text-center text-lg" placeholder="••••" value={code} onChange={(e)=>setCode(e.target.value)} />
        </label>
        {err && <div className="text-sm mt-2" style={{color: BRAND.danger}}>{err}</div>}
        <button className="mt-4 w-full px-3 py-2 rounded text-white" style={{background: BRAND.primary}} onClick={()=>{
          if(code === (data.pin || BRAND.defaultPin)){
            setData({...data, unlocked: true});
          } else {
            setErr("Incorrect PIN");
          }
        }}>Unlock</button>
      </div>
    </div>
  );
}

function Modal({title, children, onClose}){
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-md p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold" style={{color: BRAND.primary}}>{title}</h3>
          <button className="w-7 h-7 border rounded" onClick={onClose}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({label, value, onChange, type="text"}){
  return (
    <label className="grid grid-cols-1 gap-1">
      <span className="text-sm font-medium">{label}</span>
      <input className="border rounded p-2" type={type} value={value} onChange={e=>onChange(e.target.value)} />
    </label>
  );
}

function ColorField({label, value, onChange}){
  return (
    <label className="grid grid-cols-1 gap-1">
      <span className="text-sm font-medium">{label} ({value})</span>
      <input className="border rounded p-2" type="text" value={value} onChange={e=>onChange(e.target.value)} placeholder="#RRGGBB" />
    </label>
  );
}
