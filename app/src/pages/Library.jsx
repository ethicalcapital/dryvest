import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { DOCS, FACTS } from "../data.js";
import { WANTED_DOCS } from "../wantedDocs.js";
import { downloadString, copyToClipboard } from "../utils/download.js";
import { useInfiniteScroll } from "../utils/useInfiniteScroll.js";
import ClarifyButton from "../components/ClarifyButton.jsx";

const PAGE_SIZE = 24;

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

function TagFilter({ tags, active, onSelect }) {
  return (
    <div style={{display:"flex", gap:6, flexWrap:"wrap"}}>
      {tags.map(t => (
        <button
          key={t}
          className={`tag ${active === t ? "selected" : ""}`}
          onClick={() => onSelect(active === t ? null : t)}
          aria-pressed={active === t}
          title={`Filter by ${t}`}
        >
          #{t}
        </button>
      ))}
    </div>
  );
}

export default function Library({ initialTab="facts" }) {
  const [tab, setTab] = useState(initialTab);
  const [q, setQ] = useState("");
  const [selectedDocs, setSelectedDocs] = useState([]);
  const [activeTag, setActiveTag] = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [uploadFiles, setUploadFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState(null);
  const [uploadResults, setUploadResults] = useState([]);
  const [convertCursor, setConvertCursor] = useState(null);
  const [convertStatus, setConvertStatus] = useState(null);
  const [converting, setConverting] = useState(false);
  const fileInputRef = useRef(null);
  const location = useLocation();
  const [pendingFocus, setPendingFocus] = useState(null);

  const [docLimit, setDocLimit] = useState(PAGE_SIZE);
  const [factLimit, setFactLimit] = useState(PAGE_SIZE);

  const statusMeta = {
    open: { label: "Open", className: "pill-open" },
    "in-progress": { label: "In Progress", className: "pill-progress" },
    done: { label: "Complete", className: "pill-done" },
  };

  useEffect(() => {
    setSelectedDocs([]);
  }, [activeTag, q, tab]);

  const docsTags = useMemo(() => Array.from(new Set(DOCS.flatMap(d => d.tags))).sort(), []);
  const factTags = useMemo(() => Array.from(new Set(FACTS.flatMap(f => f.tags))).sort(), []);

  const visibleDocs = useMemo(() => {
    const query = q.toLowerCase();
    return DOCS.filter(d => {
      const matchesQ = d.title.toLowerCase().includes(query) || d.summary.toLowerCase().includes(query);
      const matchesTags = !activeTag || d.tags.includes(activeTag);
      return matchesQ && matchesTags;
    });
  }, [q, activeTag]);

  const visibleFacts = useMemo(() => {
    const query = q.toLowerCase();
    return FACTS.filter(f => {
      const matchesQ = f.claim.toLowerCase().includes(query) || f.support.toLowerCase().includes(query);
      const matchesTags = !activeTag || f.tags.includes(activeTag);
      return matchesQ && matchesTags;
    });
  }, [q, activeTag]);

  useEffect(() => {
    setDocLimit(PAGE_SIZE);
  }, [visibleDocs]);

  useEffect(() => {
    setFactLimit(PAGE_SIZE);
  }, [visibleFacts]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    const focusParam = params.get('focus');
    const tagParam = params.get('tag');

    if (tabParam === 'docs' || tabParam === 'facts') {
      setTab(tabParam);
    }

    if (tagParam) {
      setActiveTag(tagParam);
    } else if (params.has('tag')) {
      setActiveTag(null);
    }

    if (focusParam) {
      const targetTab = tabParam === 'docs' ? 'docs' : tabParam === 'facts' ? 'facts' : tab;
      setPendingFocus({ id: focusParam, tab: targetTab });
    }
  }, [location.search, tab]);

  useEffect(() => {
    if (!pendingFocus) return;
    if (pendingFocus.tab === 'docs') {
      const index = visibleDocs.findIndex((doc) => doc.id === pendingFocus.id);
      if (index !== -1 && index >= docLimit) {
        setDocLimit(Math.min(visibleDocs.length, Math.ceil((index + 1) / PAGE_SIZE) * PAGE_SIZE));
      }
    } else if (pendingFocus.tab === 'facts') {
      const index = visibleFacts.findIndex((fact) => fact.id === pendingFocus.id);
      if (index !== -1 && index >= factLimit) {
        setFactLimit(Math.min(visibleFacts.length, Math.ceil((index + 1) / PAGE_SIZE) * PAGE_SIZE));
      }
    }
  }, [pendingFocus, visibleDocs, visibleFacts, docLimit, factLimit]);

  useEffect(() => {
    if (!pendingFocus) return;
    const elementId = pendingFocus.tab === 'docs' ? `doc-${pendingFocus.id}` : `fact-${pendingFocus.id}`;
    const el = document.getElementById(elementId);
    if (el) {
      el.classList.add('highlight-focus');
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => el.classList.remove('highlight-focus'), 2000);
      setPendingFocus(null);
    }
  }, [pendingFocus, visibleDocs, visibleFacts, docLimit, factLimit]);

  const docsToRender = visibleDocs.slice(0, docLimit);
  const factsToRender = visibleFacts.slice(0, factLimit);
  const docHasMore = docLimit < visibleDocs.length;
  const factHasMore = factLimit < visibleFacts.length;

  const loadMoreDocs = useCallback(() => {
    setDocLimit((current) => Math.min(current + PAGE_SIZE, visibleDocs.length));
  }, [visibleDocs.length]);

  const loadMoreFacts = useCallback(() => {
    setFactLimit((current) => Math.min(current + PAGE_SIZE, visibleFacts.length));
  }, [visibleFacts.length]);

  const docSentinelRef = useInfiniteScroll({
    onLoadMore: loadMoreDocs,
    hasMore: docHasMore,
    disabled: tab !== "docs",
    resetDeps: [docLimit, q, activeTag]
  });

  const factSentinelRef = useInfiniteScroll({
    onLoadMore: loadMoreFacts,
    hasMore: factHasMore,
    disabled: tab !== "facts",
    resetDeps: [factLimit, q, activeTag]
  });

  const onToggleSelected = (id) => {
    setSelectedDocs(prev => prev.includes(id) ? prev.filter(x=>x!==id) : [...prev, id]);
  };

  const onDownloadSelectedDocs = () => {
    const docs = DOCS.filter(d => selectedDocs.includes(d.id));
    if (docs.length===0) return alert("Select at least one document.");
    docs.forEach(d => downloadString(`${d.id}.md`, "text/markdown", d.body));
  };

  const switchTab = (t) => {
    setSelectedDocs([]);
    setQ("");
    setActiveTag(null);
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
        const duplicateCount = result.uploaded.filter((item) => item.duplicate).length;
        if (duplicateCount) {
          setUploadMessage({
            kind: 'warning',
            text: duplicateCount === count
              ? 'All selected files already exist in the corpus; reused existing copies.'
              : `${duplicateCount} file${duplicateCount === 1 ? '' : 's'} already existed; only new files were uploaded.`,
          });
        }
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
      <div className="section wanted-list">
        <div className="wanted-header">
          <h2>Documents Wanted</h2>
          <span className="meta">Help hydrate the dataset—these briefs unblock the next divestment iterations.</span>
        </div>
        <div className="wanted-grid">
          {WANTED_DOCS.map((item) => {
            const status = statusMeta[item.status] ?? statusMeta.open;
            return (
              <div key={item.id} className="wanted-card">
                <div className="wanted-card-header">
                  <span className={`pill ${status.className}`}>{status.label}</span>
                  <span className={`pill pill-priority ${item.priority}`}>Priority: {item.priority}</span>
                </div>
                <h3>{item.title}</h3>
                <p className="meta">{item.summary}</p>
                <p className="helper">{item.context}</p>
                <div className="wanted-section">
                  <strong>What we still need</strong>
                  <ul>
                    {item.deliverables.map((line, idx) => (
                      <li key={idx}>{line}</li>
                    ))}
                  </ul>
                </div>
                <div className="wanted-section">
                  <strong>Source starting points</strong>
                  <div className="tag-row">
                    {item.sources.map((source) => (
                      <span key={source} className="tag">{source}</span>
                    ))}
                  </div>
                </div>
                <div className="wanted-section">
                  <strong>Tags</strong>
                  <div className="tag-row">
                    {item.tags.map((tag) => (
                      <span key={tag} className="tag">#{tag}</span>
                    ))}
                  </div>
                </div>
                <div className="wanted-actions">
                  <button
                    className="btn secondary"
                    onClick={async () => {
                      const ok = await copyToClipboard(item.prompt);
                      alert(ok ? "Prompt copied. Share it with a research agent." : "Copy failed—try again.");
                    }}
                  >
                    Copy researcher prompt
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="section" style={{display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, flexWrap:"wrap"}}>
        <div style={{display:"flex", gap:8}}>
          <button className={`btn ${tab==="docs"?"primary":"secondary"}`} onClick={()=>switchTab("docs")} aria-pressed={tab==="docs"}>Model Documents</button>
          <button className={`btn ${tab==="facts"?"primary":"secondary"}`} onClick={()=>switchTab("facts")} aria-pressed={tab==="facts"}>Facts & Citations</button>
        </div>
        <SearchBar value={q} onChange={setQ} placeholder={`Search ${tab==="docs"?"documents":"facts"}...`} />
      </div>

      <div className="section">
        <h2 style={{marginBottom:6}}>Filters</h2>
        {!!tags.length && (
          <TagFilter
            tags={tags}
            active={activeTag}
            onSelect={setActiveTag}
          />
        )}
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
                  <div className="meta">
                    Stored at: <span className="kbd">{item.key}</span>
                    {item.duplicate ? (
                      <span> • Duplicate of <span className="kbd">{item.existingKey}</span></span>
                    ) : null}
                  </div>
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
                  {item.suspectedSecondary && (
                    <p className="meta" style={{ marginTop: 6, color: '#ff9d9d' }}>
                      ⚠ {item.secondaryReason || 'Likely secondary summary—verify provenance.'}
                    </p>
                  )}
                  {Array.isArray(item.archivedSources) && item.archivedSources.length ? (
                    <div className="meta" style={{ marginTop: 6 }}>
                      Archived sources:{' '}
                      {item.archivedSources.map((ref, i) => (
                        <span key={ref} className="kbd" style={{ marginRight: 6 }}>
                          {ref}
                        </span>
                      ))}
                    </div>
                  ) : null}
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
            <div className="meta" style={{marginBottom:10}}>
              Showing {docsToRender.length} of {visibleDocs.length} documents
            </div>
            <div className="list">
              {docsToRender.map(d => (
                <label key={d.id} className="list-row" id={`doc-${d.id}`}>
                  <input type="checkbox" checked={selectedDocs.includes(d.id)} onChange={()=>onToggleSelected(d.id)} aria-label={`Select ${d.title}`} />
                  <div>
                    <div><strong>{d.title}</strong></div>
                    <div className="meta">{d.summary}</div>
                    <div style={{marginTop:6, display:"flex", gap:6, flexWrap:"wrap"}}>
                      {d.tags.map(t => <span key={t} className="tag">{t}</span>)}
                    </div>
                    <ClarifyButton
                      mode="doc"
                      text={`Document title: ${d.title}\nSummary: ${d.summary}\nExcerpt: ${d.body.slice(0, 800)}`}
                      label="Clarify next steps"
                    />
                  </div>
                  <div style={{display:"flex", gap:8}}>
                    <button className="btn ghost" onClick={()=>downloadString(`${d.id}.md`,"text/markdown",d.body)}>Download</button>
                    <button className="btn ghost" onClick={()=>setPreviewDoc(d)}>Preview</button>
                  </div>
                </label>
              ))}
            </div>
            {docHasMore ? (
              <>
                <div ref={docSentinelRef} className="infinite-sentinel" aria-hidden="true" />
                <button className="btn secondary load-more" onClick={loadMoreDocs} type="button">
                  Load more documents
                </button>
              </>
            ) : (
              visibleDocs.length > 0 && <div className="meta list-end">All documents loaded.</div>
            )}
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
            <div className="meta" style={{marginBottom:10}}>
              Showing {factsToRender.length} of {visibleFacts.length} facts
            </div>
            <div className="list">
              {factsToRender.map(f => (
                <div key={f.id} className="list-row fact-row" id={`fact-${f.id}`}>
                  <div className="fact-content">
                    <div style={{display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:12, marginBottom:8}}>
                      <div style={{fontSize:"15px", lineHeight:"1.4"}}><strong>{f.claim}</strong></div>
                      <code style={{fontSize:"9px", color:"#999", backgroundColor:"#f8f8f8", padding:"1px 4px", borderRadius:"2px", flexShrink:0}}>{f.id}</code>
                    </div>
                    <div style={{fontSize:"13px", color:"#666", lineHeight:"1.4", marginBottom:8}}>{f.support}</div>
                    <div style={{display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", fontSize:"11px", color:"#888"}}>
                      {f.tags?.length ? (
                        <>
                          {f.tags.map(t => <span key={t} className="tag" style={{fontSize:"10px"}}>{t}</span>)}
                          <span style={{color:"#ddd"}}>•</span>
                        </>
                      ) : null}
                      <details style={{cursor:"pointer"}}>
                        <summary style={{display:"inline", listStyle:"none"}}>
                          📚 {f.citations.length} source{f.citations.length !== 1 ? 's' : ''}
                        </summary>
                        <div style={{marginTop:6, paddingLeft:12, borderLeft:"2px solid #eee", fontSize:"11px"}}>
                          {f.citations.map((c,i) => (
                            <div key={i} style={{marginBottom:3}}>
                              • <a href={c.url} target="_blank" rel="noopener noreferrer" style={{textDecoration:"none", color:"#666"}}>{c.title}</a>
                            </div>
                          ))}
                        </div>
                      </details>
                    </div>
                    <ClarifyButton
                      mode="fact"
                      text={`Claim: ${f.claim}\nSupport: ${f.support}\n${f.citations.slice(0, 3).map((c, idx) => `Source ${idx + 1}: ${c.title}${c.url ? ` (${c.url})` : ''}`).join('\n')}`}
                      label="Explain in plain English"
                    />
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
                </div>
              ))}
            </div>
            {factHasMore ? (
              <>
                <div ref={factSentinelRef} className="infinite-sentinel" aria-hidden="true" />
                <button className="btn secondary load-more" onClick={loadMoreFacts} type="button">
                  Load more facts
                </button>
              </>
            ) : (
              visibleFacts.length > 0 && <div className="meta list-end">All facts loaded.</div>
            )}
          </div>
          <div style={{display:"flex", gap:10, flexWrap:"wrap"}}>
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
