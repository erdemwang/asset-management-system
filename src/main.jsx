import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { FileText, Wrench, LayoutDashboard, LogOut, Search, Eye, Download, Calendar, Building2, Menu, X } from 'lucide-react';
import './styles/global.css';
import { mockDocuments } from './data/mockDocuments';

const USERS = [{ account: 'admin', password: '123456', name: 'Admin', role: '管理員' }];

function parseDocument(doc) {
  const parts = doc.title.replace(/\.(docx|pdf|xlsx|xls)$/i, '').split('_');
  const noMatch = doc.title.match(/第(\d+)號/);
  const floor = parts.find(p => /^(B\d+|\d+F|\d+樓|B\d+F)$/i.test(p)) || '';
  const building = ['國際大樓', '信義華廈', '樂富大直館', '台茂', '順達'].find(b => doc.title.includes(b)) || doc.building || '未分類';
  const caseName = parts[parts.length - 1] || doc.title;
  return { ...doc, no: noMatch?.[1] || doc.no || '-', building, floor, caseName };
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
    { key:'requests', label:'請求書', icon:FileText },
    { key:'repairs', label:'修繕單', icon:Wrench },
  ];
  return <aside className={`sidebar ${open ? 'open' : ''}`}>
    <div className="side-head"><div className="side-logo">文</div><div><strong>文件管理系統</strong><span>Document Portal</span></div><button className="icon-btn mobile-only" onClick={()=>setOpen(false)}><X size={18}/></button></div>
    <nav>{items.map(item => { const Icon=item.icon; return <button key={item.key} className={active===item.key?'active':''} onClick={()=>{setActive(item.key);setOpen(false)}}><Icon size={18}/>{item.label}</button>})}</nav>
    <div className="user-box"><div><b>{user.name}</b><span>{user.role}</span></div><button onClick={onLogout}><LogOut size={16}/>登出</button></div>
  </aside>
}

function Dashboard({ docs, setActive }) {
  const requests = docs.filter(d=>d.type==='request');
  const repairs = docs.filter(d=>d.type==='repair');
  const latest = [...docs].sort((a,b)=>new Date(b.modifiedTime)-new Date(a.modifiedTime)).slice(0,5);
  return <section>
    <div className="page-title"><h1>Dashboard</h1><p>請求書與修繕單管理總覽</p></div>
    <div className="stats">
      <button className="stat-card" onClick={()=>setActive('requests')}><FileText/><span>請求書</span><b>{requests.length}</b></button>
      <button className="stat-card" onClick={()=>setActive('repairs')}><Wrench/><span>修繕單</span><b>{repairs.length}</b></button>
      <div className="stat-card"><Building2/><span>建物</span><b>{new Set(docs.map(d=>d.building)).size}</b></div>
      <div className="stat-card"><Calendar/><span>最新年度</span><b>115</b></div>
    </div>
    <div className="panel"><h2>最近更新</h2><div className="recent-list">{latest.map(d=><a key={d.id} href={d.viewUrl} target="_blank"><b>{d.no}</b><span>{d.building}</span><em>{d.caseName}</em></a>)}</div></div>
  </section>
}

function DocumentsPage({ type, docs }) {
  const [q,setQ]=useState('');
  const [year,setYear]=useState('115');
  const [building,setBuilding]=useState('全部');
  const title = type === 'request' ? '請求書' : '修繕單';
  const Icon = type === 'request' ? FileText : Wrench;
  const buildings = ['全部', ...Array.from(new Set(docs.filter(d=>d.type===type).map(d=>d.building)))];
  const filtered = docs.filter(d=>d.type===type)
    .filter(d=>year==='全部'||d.year===year)
    .filter(d=>building==='全部'||d.building===building)
    .filter(d=>`${d.title} ${d.no} ${d.building} ${d.floor} ${d.caseName}`.toLowerCase().includes(q.toLowerCase()));
  return <section>
    <div className="page-title"><h1><Icon size={24}/>{title}</h1><p>預設顯示最新年度 115，可用搜尋與篩選快速找文件。</p></div>
    <div className="toolbar"><div className="searchbox"><Search size={18}/><input placeholder="搜尋編號、建物、樓層、案件..." value={q} onChange={e=>setQ(e.target.value)} /></div><select value={year} onChange={e=>setYear(e.target.value)}>{['全部','115','114','113','112'].map(y=><option key={y}>{y}</option>)}</select><select value={building} onChange={e=>setBuilding(e.target.value)}>{buildings.map(b=><option key={b}>{b}</option>)}</select></div>
    <div className="table-card"><table><thead><tr><th>編號</th><th>建物</th><th>樓層</th><th>案件</th><th>年度</th><th>操作</th></tr></thead><tbody>{filtered.map(d=><tr key={d.id}><td><b>{d.no}</b></td><td>{d.building}</td><td>{d.floor||'-'}</td><td><span className="case-name" title={d.title}>{d.caseName}</span></td><td>{d.year}</td><td className="actions"><a href={d.viewUrl} target="_blank"><Eye size={16}/>開啟</a><a href={d.downloadUrl} target="_blank"><Download size={16}/>下載</a></td></tr>)}</tbody></table>{filtered.length===0 && <div className="empty">找不到符合條件的文件</div>}</div>
  </section>
}

function App(){
  const [user,setUser]=useState(()=>JSON.parse(localStorage.getItem('dmsUser')||'null'));
  const [active,setActive]=useState('dashboard');
  const [sideOpen,setSideOpen]=useState(false);
  const docs = useMemo(()=>mockDocuments.map(parseDocument),[]);
  const login = (u)=>{localStorage.setItem('dmsUser',JSON.stringify(u)); setUser(u)};
  const logout = ()=>{localStorage.removeItem('dmsUser'); setUser(null)};
  if(!user) return <Login onLogin={login}/>;
  return <div className="app"><Sidebar active={active} setActive={setActive} user={user} onLogout={logout} open={sideOpen} setOpen={setSideOpen}/><main className="content"><header className="topbar"><button className="icon-btn mobile-only" onClick={()=>setSideOpen(true)}><Menu/></button><div><b>文件管理系統</b><span>Milestone 1</span></div></header>{active==='dashboard'&&<Dashboard docs={docs} setActive={setActive}/>} {active==='requests'&&<DocumentsPage type="request" docs={docs}/>} {active==='repairs'&&<DocumentsPage type="repair" docs={docs}/>}</main></div>
}

createRoot(document.getElementById('root')).render(<App/>);
