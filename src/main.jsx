import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { FileText, Wrench, LayoutDashboard, LogOut, Search, Eye, Download, Calendar, Building2, Menu, X, Plus, Pencil, Trash2, Database, Link as LinkIcon, Save, Upload, FolderKanban } from 'lucide-react';
import './styles/global.css';

const USERS = [{ account: 'admin', password: '123456', name: 'Admin', role: '管理員' }];
const STORAGE_KEY = 'dmsDocumentsV2A';
const DATA_VERSION = '2026-06-30-intl-requests-v2';
const VERSION_KEY = 'dmsDocumentsVersion';

function driveDownloadUrl(url='') {
  const match = url.match(/\/file\/d\/([^/]+)/) || url.match(/[?&]id=([^&]+)/);
  return match?.[1] ? `https://drive.google.com/uc?export=download&id=${match[1]}` : url;
}

function parseFromFileName(fileName='', base={}) {
  const clean = fileName.replace(/\.(docx?|pdf|xlsx?|pptx?)$/i, '');
  const parts = clean.split('_').map(p => p.trim()).filter(Boolean);
  const number = clean.match(/第(\d+)號/)?.[1] || clean.match(/(\d{6})/)?.[1] || base.number || '';
  const building = ['國際大樓','信義華廈','樂富大直館','台茂','順達','觀音物流中心','大直館'].find(b => clean.includes(b)) || base.building || '';
  const floor = parts.find(p => /^(B\d+F?|B\d+|\d+F|\d+樓)$/i.test(p)) || base.floor || '';
  const year = number ? number.slice(0,3) : base.year || '115';
  let title = parts[parts.length - 1] || clean;
  title = title.replace(/^資產管理或處分請求書$/,'').trim() || base.title || clean;
  let type = base.type || (clean.includes('修繕') || clean.includes('報價') || clean.includes('工程') ? '修繕單' : '請求書');
  if (clean.includes('請求書')) type = '請求書';
  return { ...base, number, building, floor, year, title, type, fileName };
}

function normalizeDoc(doc) {
  const parsed = parseFromFileName(doc.fileName || doc.title || '', doc);
  return {
    uid: doc.uid || crypto.randomUUID(),
    type: parsed.type || '請求書',
    number: parsed.number || '-',
    building: parsed.building || '未分類',
    floor: parsed.floor || '',
    title: parsed.title || doc.title || '未命名文件',
    year: parsed.year || '115',
    fileName: parsed.fileName || doc.fileName || doc.title || '',
    viewUrl: doc.viewUrl || doc.url || '',
    modifiedTime: doc.modifiedTime || new Date().toISOString().slice(0,10),
  };
}

function Login({ onLogin }) {
  const [account, setAccount] = useState('admin');
  const [password, setPassword] = useState('123456');
  const [error, setError] = useState('');
  const submit = (e) => {
    e.preventDefault();
    const user = USERS.find(u => u.account === account && u.password === password);
    if (!user) return setError('帳號或密碼錯誤');
    onLogin(user);
  };
  return <main className="login-page">
    <section className="login-card">
      <div className="brand-mark">文</div>
      <h1>文件管理系統</h1>
      <p>請使用帳號密碼登入</p>
      <form onSubmit={submit}>
        <label>帳號<input value={account} onChange={e=>setAccount(e.target.value)} /></label>
        <label>密碼<input type="password" value={password} onChange={e=>setPassword(e.target.value)} /></label>
        {error && <div className="error">{error}</div>}
        <button className="primary">登入</button>
      </form>
      <small>測試帳號：admin / 123456</small>
    </section>
  </main>
}

function Sidebar({ active, setActive, user, onLogout, open, setOpen }) {
  const items = [
    { key:'dashboard', label:'Dashboard', icon:LayoutDashboard },
    { key:'documents', label:'文件清單', icon:FolderKanban },
  ];
  return <aside className={`sidebar ${open ? 'open' : ''}`}>
    <div className="side-head"><div className="side-logo">文</div><div><strong>文件管理系統</strong><span>Document Portal</span></div><button className="icon-btn mobile-only" onClick={()=>setOpen(false)}><X size={18}/></button></div>
    <nav>{items.map(item => { const Icon=item.icon; return <button key={item.key} className={active===item.key?'active':''} onClick={()=>{setActive(item.key);setOpen(false)}}><Icon size={18}/>{item.label}</button>})}</nav>
    <div className="user-box"><div><b>{user.name}</b><span>{user.role}</span></div><button onClick={onLogout}><LogOut size={16}/>登出</button></div>
  </aside>
}

function Dashboard({ docs, setActive }) {
  const requests = docs.filter(d=>d.type==='請求書');
  const repairs = docs.filter(d=>d.type==='修繕單');
  const latest = [...docs].sort((a,b)=>String(b.modifiedTime).localeCompare(String(a.modifiedTime))).slice(0,6);
  return <section>
    <div className="page-title"><h1>Dashboard</h1><p>請求書與修繕單管理總覽</p></div>
    <div className="stats">
      <button className="stat-card" onClick={()=>setActive('documents')}><Database/><span>全部文件</span><b>{docs.length}</b></button>
      <button className="stat-card" onClick={()=>setActive('documents')}><FileText/><span>請求書</span><b>{requests.length}</b></button>
      <button className="stat-card" onClick={()=>setActive('documents')}><Wrench/><span>修繕單</span><b>{repairs.length}</b></button>
      <div className="stat-card"><Building2/><span>建物</span><b>{new Set(docs.map(d=>d.building)).size}</b></div>
    </div>
    <div className="panel"><h2>最近更新</h2><div className="recent-list">{latest.map(d=><a key={d.uid} href={d.viewUrl} target="_blank"><b>{d.number}</b><span>{d.building}</span><em>{d.title}</em></a>)}</div></div>
  </section>
}

function DocModal({ editing, onClose, onSave }) {
  const [form,setForm] = useState(()=> editing || { type:'請求書', number:'', building:'', floor:'', title:'', year:'115', fileName:'', viewUrl:'' });
  const update = (key,val)=>setForm(prev=>({...prev,[key]:val}));
  const autoParse = () => setForm(prev => normalizeDoc({ ...prev, fileName: prev.fileName || prev.title }));
  const save = () => {
    if (!form.viewUrl.trim()) return alert('請貼上 Google Drive 連結');
    onSave(normalizeDoc(form));
  };
  return <div className="modal-backdrop">
    <div className="modal-card">
      <div className="modal-head"><h2>{editing ? '編輯文件' : '新增文件'}</h2><button className="icon-btn" onClick={onClose}><X/></button></div>
      <div className="form-grid">
        <label className="span-2">Google Drive 連結<input value={form.viewUrl} onChange={e=>update('viewUrl',e.target.value)} placeholder="https://drive.google.com/file/d/..." /></label>
        <label className="span-2">完整檔名<input value={form.fileName} onChange={e=>update('fileName',e.target.value)} placeholder="晶能字第1150026號_...docx" /></label>
        <button className="secondary span-2" onClick={autoParse}><Upload size={16}/>解析檔名</button>
        <label>類型<select value={form.type} onChange={e=>update('type',e.target.value)}><option>請求書</option><option>修繕單</option></select></label>
        <label>年度<input value={form.year} onChange={e=>update('year',e.target.value)} /></label>
        <label>編號<input value={form.number} onChange={e=>update('number',e.target.value)} /></label>
        <label>建物<input value={form.building} onChange={e=>update('building',e.target.value)} /></label>
        <label>樓層<input value={form.floor} onChange={e=>update('floor',e.target.value)} /></label>
        <label className="span-2">案件名稱<input value={form.title} onChange={e=>update('title',e.target.value)} /></label>
      </div>
      <div className="modal-actions"><button className="ghost" onClick={onClose}>取消</button><button className="primary fit" onClick={save}><Save size={16}/>儲存</button></div>
    </div>
  </div>
}

function DocumentsPage({ docs, onAdd, onEdit, onDelete, onExport, onReset }) {
  const [q,setQ]=useState('');
  const [year,setYear]=useState('115');
  const [type,setType]=useState('全部');
  const [building,setBuilding]=useState('全部');
  const buildings = ['全部', ...Array.from(new Set(docs.map(d=>d.building))).filter(Boolean)];
  const filtered = docs
    .filter(d=>type==='全部'||d.type===type)
    .filter(d=>year==='全部'||d.year===year)
    .filter(d=>building==='全部'||d.building===building)
    .filter(d=>`${d.type} ${d.fileName} ${d.number} ${d.building} ${d.floor} ${d.title}`.toLowerCase().includes(q.toLowerCase()));
  return <section>
    <div className="page-title"><div><h1><FolderKanban size={24}/>文件清單</h1><p>免費版以 documents.json 作為索引；新增、編輯、刪除會先儲存在本機瀏覽器，可匯出備份。</p></div><div className="title-actions"><button className="secondary" onClick={onReset}>載入新版資料</button><button className="secondary" onClick={onExport}><Download size={16}/>匯出 JSON</button><button className="primary fit" onClick={onAdd}><Plus size={16}/>新增文件</button></div></div>
    <div className="toolbar"><div className="searchbox"><Search size={18}/><input placeholder="搜尋編號、建物、樓層、案件、檔名..." value={q} onChange={e=>setQ(e.target.value)} /></div><select value={type} onChange={e=>setType(e.target.value)}>{['全部','請求書','修繕單'].map(x=><option key={x}>{x}</option>)}</select><select value={year} onChange={e=>setYear(e.target.value)}>{['全部','115','114','113','112'].map(y=><option key={y}>{y}</option>)}</select><select value={building} onChange={e=>setBuilding(e.target.value)}>{buildings.map(b=><option key={b}>{b}</option>)}</select></div>
    <div className="table-card"><table><thead><tr><th>類型</th><th>編號</th><th>建物</th><th>樓層</th><th>案件</th><th>年度</th><th>操作</th></tr></thead><tbody>{filtered.map(d=><tr key={d.uid}><td><span className={`pill ${d.type==='請求書'?'blue':'green'}`}>{d.type}</span></td><td><b>{d.number}</b></td><td>{d.building}</td><td>{d.floor||'-'}</td><td><span className="case-name" title={d.fileName}>{d.title}</span></td><td>{d.year}</td><td className="actions"><a href={d.viewUrl} target="_blank"><Eye size={16}/>預覽</a><a href={driveDownloadUrl(d.viewUrl)} target="_blank"><Download size={16}/>下載</a><a href={d.viewUrl} target="_blank"><LinkIcon size={16}/>Drive</a><button onClick={()=>onEdit(d)}><Pencil size={16}/></button><button className="danger" onClick={()=>onDelete(d.uid)}><Trash2 size={16}/></button></td></tr>)}</tbody></table>{filtered.length===0 && <div className="empty">找不到符合條件的文件</div>}</div>
  </section>
}

function App(){
  const [user,setUser]=useState(()=>JSON.parse(localStorage.getItem('dmsUser')||'null'));
  const [active,setActive]=useState('dashboard');
  const [sideOpen,setSideOpen]=useState(false);
  const [docs,setDocs] = useState([]);
  const [modal,setModal] = useState(null);

  const loadSeedData = () => {
    fetch('/data/documents.json')
      .then(r=>r.json())
      .then(data=>{
        const normalized = data.map(normalizeDoc);
        setDocs(normalized);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
        localStorage.setItem(VERSION_KEY, DATA_VERSION);
      })
      .catch(()=>setDocs([]));
  };

  useEffect(()=>{
    const localVersion = localStorage.getItem(VERSION_KEY);
    const local = localStorage.getItem(STORAGE_KEY);
    if (local && localVersion === DATA_VERSION) {
      setDocs(JSON.parse(local).map(normalizeDoc));
      return;
    }
    loadSeedData();
  },[]);
  useEffect(()=>{ if(docs.length) localStorage.setItem(STORAGE_KEY, JSON.stringify(docs)); },[docs]);

  const login = (u)=>{localStorage.setItem('dmsUser',JSON.stringify(u)); setUser(u)};
  const logout = ()=>{localStorage.removeItem('dmsUser'); setUser(null)};
  const saveDoc = (doc)=>{ setDocs(prev => prev.some(d=>d.uid===doc.uid) ? prev.map(d=>d.uid===doc.uid?doc:d) : [doc, ...prev]); setModal(null); };
  const deleteDoc = (uid)=>{ if(confirm('確定刪除此文件索引？不會刪除 Google Drive 原始檔。')) setDocs(prev=>prev.filter(d=>d.uid!==uid)); };
  const exportJson = () => {
    const blob = new Blob([JSON.stringify(docs,null,2)], {type:'application/json'});
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download='documents.json'; a.click(); URL.revokeObjectURL(url);
  };

  if(!user) return <Login onLogin={login}/>;
  return <div className="app"><Sidebar active={active} setActive={setActive} user={user} onLogout={logout} open={sideOpen} setOpen={setSideOpen}/><main className="content"><header className="topbar"><button className="icon-btn mobile-only" onClick={()=>setSideOpen(true)}><Menu/></button><div><b>文件管理系統</b><span>Milestone 2A 免費版</span></div></header>{active==='dashboard'&&<Dashboard docs={docs} setActive={setActive}/>} {active==='documents'&&<DocumentsPage docs={docs} onAdd={()=>setModal({})} onEdit={(d)=>setModal(d)} onDelete={deleteDoc} onExport={exportJson} onReset={loadSeedData}/>}</main>{modal && <DocModal editing={modal.uid?modal:null} onClose={()=>setModal(null)} onSave={saveDoc}/>}</div>
}

createRoot(document.getElementById('root')).render(<App/>);
