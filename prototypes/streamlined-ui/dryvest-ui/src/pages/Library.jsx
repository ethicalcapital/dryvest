import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { DOCS, FACTS } from "../data.js";
import { downloadString, copyToClipboard } from "../utils/download.js";

function SearchBar({ value, onChange, placeholder="Search..." }) {
  return (
    <div className="searchbar">
      <span className="meta">🔎</span>
      <input
        value={value}
        onChange={e=>onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
      />
    </div>
  );
}

function TagFilter({ tags, selected, onToggle }) {
  return (
    <div style={{display:"flex", gap:6, flexWrap:"wrap"}}>
      {tags.map(t => (
        <button
          key={t}
          className={`tag ${selected.includes(t) ? "selected" : ""}`}
          onClick={() => onToggle(t)}
          aria-pressed={selected.includes(t)}
          title={`Filter by ${t}`}
        >
          #{t}
        </button>
      ))}
    </div>
  );
}

export default function Library({ initialTab="docs" }) {
  const [tab, setTab] = useState(initialTab);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState([]); // for docs & facts multi-select
  const [tagFilter, setTagFilter] = useState([]);
  const [previewDoc, setPreviewDoc] = useState(null);

  const docsTags = useMemo(() => Array.from(new Set(DOCS.flatMap(d => d.tags))).sort(), []);
  const factTags = useMemo(() => Array.from(new Set(FACTS.flatMap(f => f.tags))).sort(), []);

  const visibleDocs = useMemo(() => {
    const query = q.toLowerCase();
    return DOCS.filter(d => {
      const matchesQ = d.title.toLowerCase().includes(query) || d.summary.toLowerCase().includes(query);
      const matchesTags = tagFilter.length===0 || tagFilter.every(t => d.tags.includes(t));
      return matchesQ && matchesTags;
    });
  }, [q, tagFilter]);

  const visibleFacts = useMemo(() => {
    const query = q.toLowerCase();
    return FACTS.filter(f => {
      const matchesQ = f.claim.toLowerCase().includes(query) || f.support.toLowerCase().includes(query);
      const matchesTags = tagFilter.length===0 || tagFilter.every(t => f.tags.includes(t));
      return matchesQ && matchesTags;
    });
  }, [q, tagFilter]);

  const onToggleSelected = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x=>x!==id) : [...prev, id]);
  };

  const onDownloadSelectedDocs = () => {
    const docs = DOCS.filter(d => selected.includes(d.id));
    if (docs.length===0) return alert("Select at least one document.");
    docs.forEach(d => downloadString(`${d.id}.md`, "text/markdown", d.body));
  };

  const onCopySelectedFacts = async () => {
    const facts = FACTS.filter(f => selected.includes(f.id));
    if (facts.length===0) return alert("Select at least one fact.");
    const text = facts.map(f => `• ${f.claim}\n  ${f.support}\n  ${f.citations.map(c=>`- ${c.title} (${c.url})`).join("\n")}`).join("\n\n");
    const ok = await copyToClipboard(text);
    alert(ok ? "Facts copied to clipboard. ✔️" : "Copy failed. ❗");
  };

  const switchTab = (t) => {
    setSelected([]);
    setQ("");
    setTagFilter([]);
    setTab(t);
  };

  const tags = tab==="docs" ? docsTags : factTags;

  return (
    <>
    <div className="card">
      <div className="section" style={{display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, flexWrap:"wrap"}}>
        <div style={{display:"flex", gap:8}}>
          <button className={`btn ${tab==="docs"?"primary":"secondary"}`} onClick={()=>switchTab("docs")} aria-pressed={tab==="docs"}>Model Documents</button>
          <button className={`btn ${tab==="facts"?"primary":"secondary"}`} onClick={()=>switchTab("facts")} aria-pressed={tab==="facts"}>Facts & Citations</button>
        </div>
        <SearchBar value={q} onChange={setQ} placeholder={`Search ${tab==="docs"?"documents":"facts"}...`} />
      </div>

      <div className="section">
        <h2 style={{marginBottom:6}}>Filters</h2>
        <TagFilter
          tags={tags}
          selected={tagFilter}
          onToggle={(t)=> setTagFilter(prev => prev.includes(t)? prev.filter(x=>x!==t) : [...prev,t])}
        />
      </div>

      {tab==="docs" ? (
        <>
          <div className="section">
            <h2 style={{marginBottom:6}}>Documents</h2>
            <div className="list">
              {visibleDocs.map(d => (
                <label key={d.id} className="list-row">
                  <input type="checkbox" checked={selected.includes(d.id)} onChange={()=>onToggleSelected(d.id)} aria-label={`Select ${d.title}`} />
                  <div>
                    <div><strong>{d.title}</strong></div>
                    <div className="meta">{d.summary}</div>
                    <div style={{marginTop:6, display:"flex", gap:6, flexWrap:"wrap"}}>
                      {d.tags.map(t => <span key={t} className="tag">{t}</span>)}
                    </div>
                  </div>
                  <div style={{display:"flex", gap:8}}>
                    <button className="btn ghost" onClick={()=>downloadString(`${d.id}.md`,"text/markdown",d.body)}>Download</button>
                    <button className="btn ghost" onClick={()=>setPreviewDoc(d)}>Preview</button>
                  </div>
                </label>
              ))}
            </div>
          </div>
          <div style={{display:"flex", gap:10, flexWrap:"wrap"}}>
            <button className="btn primary" onClick={onDownloadSelectedDocs}>Download Selected</button>
            <a className="btn secondary" href="/brief">Add to Brief</a>
          </div>
        </>
      ) : (
        <>
          <div className="section">
            <h2 style={{marginBottom:6}}>Facts & Citations</h2>
            <div className="list">
              {visibleFacts.map(f => (
                <label key={f.id} className="list-row" style={{gridTemplateColumns:"24px 1fr auto"}}>
                  <input type="checkbox" checked={selected.includes(f.id)} onChange={()=>onToggleSelected(f.id)} aria-label={`Select fact ${f.id}`} />
                  <div>
                    <div><strong>{f.claim}</strong></div>
                    <div className="meta" style={{marginTop:4}}>{f.support}</div>
                    <div style={{marginTop:6, display:"grid", gap:4}}>
                      {f.citations.map((c,i) => (
                        <div key={i} className="meta">• {c.title} — <span className="kbd">{c.url}</span></div>
                      ))}
                    </div>
                    <div style={{marginTop:6, display:"flex", gap:6, flexWrap:"wrap"}}>
                      {f.tags.map(t => <span key={t} className="tag">{t}</span>)}
                    </div>
                  </div>
                  <div style={{display:"flex", gap:8}}>
                    <button
                      className="btn ghost"
                      onClick={async ()=>{
                        const txt = `${f.claim}\n${f.support}\n${f.citations.map(c=>`- ${c.title} (${c.url})`).join("\n")}`;
                        const ok = await copyToClipboard(txt);
                        alert(ok ? "Fact copied. ✔️" : "Copy failed. ❗");
                      }}
                    >Copy</button>
                  </div>
                </label>
              ))}
            </div>
          </div>
          <div style={{display:"flex", gap:10, flexWrap:"wrap"}}>
          <button className="btn primary" onClick={onCopySelectedFacts}>Copy Selected</button>
          <a className="btn secondary" href="/brief">Use in Brief</a>
        </div>
      </>
      )}
    </div>
    {previewDoc && (
      <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Document preview">
        <div className="modal" style={{maxHeight:"80vh", overflowY:"auto"}}>
          <div className="row" style={{justifyContent:"space-between", alignItems:"center"}}>
            <div>
              <h3 style={{marginBottom:4}}>{previewDoc.title}</h3>
              <p className="meta">{previewDoc.summary}</p>
            </div>
            <button className="btn ghost" onClick={()=>setPreviewDoc(null)}>Close</button>
          </div>
          <div className="helper" style={{marginTop:12}}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{previewDoc.body}</ReactMarkdown>
          </div>
          <div className="row" style={{marginTop:12, justifyContent:"flex-end"}}>
            <button className="btn secondary" onClick={()=>downloadString(`${previewDoc.id}.md`,"text/markdown",previewDoc.body)}>Download markdown</button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
