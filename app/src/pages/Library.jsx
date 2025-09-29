import { useMemo, useRef, useState } from "react";
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
  const [uploadFiles, setUploadFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState(null);
  const [uploadResults, setUploadResults] = useState([]);
  const [convertCursor, setConvertCursor] = useState(null);
  const [convertStatus, setConvertStatus] = useState(null);
  const [converting, setConverting] = useState(false);
  const fileInputRef = useRef(null);

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

  const onFileChange = (event) => {
    const files = Array.from(event.target.files ?? []);
    setUploadFiles(files);
    setUploadMessage(null);
  };

  const handleUpload = async () => {
    if (!uploadFiles.length) {
      setUploadMessage({ kind: "warning", text: "Choose one or more files first." });
      return;
    }
    setUploading(true);
    setUploadMessage(null);
    try {
      const form = new FormData();
      uploadFiles.forEach((file) => form.append('files', file));
      const response = await fetch('/api/autorag/upload', {
        method: 'POST',
        body: form,
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result?.error || 'Upload failed');
      }
      const count = Array.isArray(result?.uploaded) ? result.uploaded.length : 0;
      setUploadMessage({
        kind: 'success',
        text: count
          ? `Uploaded ${count} file${count === 1 ? '' : 's'} to the research corpus.`
          : 'Upload succeeded.',
      });
      if (Array.isArray(result?.uploaded)) {
        setUploadResults(result.uploaded);
      } else {
        setUploadResults([]);
      }
      setUploadFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      setUploadMessage({ kind: 'warning', text: error instanceof Error ? error.message : 'Upload failed.' });
    } finally {
      setUploading(false);
    }
  };

  const handleConvert = async () => {
    setConverting(true);
    setConvertStatus(null);
    try {
      const payload = convertCursor ? { limit: 20, cursor: convertCursor } : { limit: 20 };
      const response = await fetch('/api/autorag/convert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result?.error || 'Conversion request failed');
      }
      setConvertStatus(result);
      setConvertCursor(result?.nextCursor ?? null);
    } catch (error) {
      setConvertStatus({ error: error instanceof Error ? error.message : 'Conversion failed.' });
    } finally {
      setConverting(false);
    }
  };

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

      <div className="section upload-panel">
        <h2 style={{marginBottom:6}}>Upload new research</h2>
        <p className="helper">Drop PDFs or DOCX files to add them to the AutoRAG corpus. After uploading, run the conversion to produce cleaned markdown.</p>
        <div className="upload-controls">
          <input ref={fileInputRef} type="file" multiple onChange={onFileChange} aria-label="Choose research files" />
          <div className="upload-actions">
            <button className="btn primary" onClick={handleUpload} disabled={uploading}>
              {uploading ? 'Uploading…' : uploadFiles.length ? `Upload ${uploadFiles.length} file${uploadFiles.length === 1 ? '' : 's'}` : 'Upload files'}
            </button>
            <button className="btn secondary" onClick={handleConvert} disabled={converting}>
              {converting ? 'Converting…' : 'Convert to markdown'}
            </button>
          </div>
        </div>
        <div className="meta" aria-live="polite">
          {uploadMessage && (
            <div className={uploadMessage.kind === 'success' ? 'status success' : 'status warning'}>
              {uploadMessage.text}
            </div>
          )}
          {convertStatus && (
            <div className={convertStatus.error ? 'status warning' : 'status info'}>
              {convertStatus.error
                ? convertStatus.error
                : `Processed ${convertStatus.processed ?? 0} file${(convertStatus.processed ?? 0) === 1 ? '' : 's'}.`}
              {convertStatus?.nextCursor && !convertStatus.error && (
                <span> Next cursor available—run convert again to continue.</span>
              )}
              {!convertStatus?.nextCursor && !convertStatus?.error && (
                <span> No further cursor returned.</span>
              )}
            </div>
          )}
        </div>
        {uploadResults.length > 0 && (
          <div className="upload-results">
            <h3>Draft alignment</h3>
            <div className="meta">We won’t add this to the dataset until the next release, but here’s how it might map today.</div>
            <div className="list" style={{ marginTop: 12 }}>
              {uploadResults.map((item, idx) => (
                <div key={idx} className="card" style={{ background: '#101a32', border: '1px solid #1b294d' }}>
                  <strong>{item.name}</strong>
                  <div className="meta">Stored at: <span className="kbd">{item.key}</span></div>
                  {item.alignment ? (
                    <div className="upload-alignment">
                      {item.alignment.summary && <p>{item.alignment.summary}</p>}
                      <div className="meta">
                        {item.alignment.identities?.length ? (
                          <span>Identities: {item.alignment.identities.join(', ')}</span>
                        ) : null}
                        {item.alignment.audiences?.length ? (
                          <span> · Audiences: {item.alignment.audiences.join(', ')}</span>
                        ) : null}
                        {item.alignment.motivations?.length ? (
                          <span> · Drivers: {item.alignment.motivations.join(', ')}</span>
                        ) : null}
                      </div>
                      <p className="meta" style={{ marginTop: 6 }}>{item.alignment.notes}</p>
                    </div>
                  ) : (
                    <p className="meta">AI alignment unavailable for this upload.</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
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
