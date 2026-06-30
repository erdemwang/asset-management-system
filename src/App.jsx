import { useMemo, useState } from "react";
import seedDocuments from "./data/documents.json";

const STORAGE_KEY = "dms_documents_v1";

const emptyForm = {
  id: "",
  type: "請求書",
  title: "",
  property: "",
  vendor: "",
  amount: "",
  status: "待處理",
  date: new Date().toISOString().slice(0, 10),
  note: "",
};

function loadDocuments() {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved ? JSON.parse(saved) : seedDocuments;
}

export default function App() {
  const [documents, setDocuments] = useState(loadDocuments);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [keyword, setKeyword] = useState("");
  const [typeFilter, setTypeFilter] = useState("全部");
  const [statusFilter, setStatusFilter] = useState("全部");

  const totalCount = documents.length;
  const pendingCount = documents.filter((d) => d.status === "待處理").length;
  const doneCount = documents.filter((d) => d.status === "已完成").length;
  const totalAmount = documents.reduce((sum, d) => sum + Number(d.amount || 0), 0);

  const saveDocuments = (next) => {
    setDocuments(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const text = `${doc.id} ${doc.type} ${doc.title} ${doc.property} ${doc.vendor} ${doc.status} ${doc.note}`.toLowerCase();
      return (
        text.includes(keyword.toLowerCase()) &&
        (typeFilter === "全部" || doc.type === typeFilter) &&
        (statusFilter === "全部" || doc.status === statusFilter)
      );
    });
  }, [documents, keyword, typeFilter, statusFilter]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.title.trim()) {
      alert("請輸入文件名稱");
      return;
    }

    if (editingId) {
      saveDocuments(
        documents.map((doc) =>
          doc.id === editingId ? { ...form, amount: Number(form.amount || 0) } : doc
        )
      );
    } else {
      saveDocuments([
        {
          ...form,
          id: `DOC-${Date.now()}`,
          amount: Number(form.amount || 0),
        },
        ...documents,
      ]);
    }

    setForm(emptyForm);
    setEditingId(null);
  };

  const handleEdit = (doc) => {
    setEditingId(doc.id);
    setForm({ ...doc, amount: String(doc.amount ?? "") });
  };

  const handleDelete = (id) => {
    if (!confirm("確定要刪除此文件嗎？")) return;
    saveDocuments(documents.filter((doc) => doc.id !== id));
  };

  const resetSeedData = () => {
    localStorage.removeItem(STORAGE_KEY);
    setDocuments(seedDocuments);
    setForm(emptyForm);
    setEditingId(null);
  };

  return (
    <div className="app">
      <header className="hero">
        <div>
          <p className="eyebrow">Asset Management System</p>
          <h1>文件管理系統</h1>
          <p>管理請求書與修繕單，可新增、編輯、刪除與搜尋篩選。</p>
        </div>
        <button className="secondary" onClick={resetSeedData}>
          載入新版資料
        </button>
      </header>

      <section className="stats">
        <div className="stat-card">
          <span>文件總數</span>
          <strong>{totalCount}</strong>
        </div>
        <div className="stat-card">
          <span>待處理</span>
          <strong>{pendingCount}</strong>
        </div>
        <div className="stat-card">
          <span>已完成</span>
          <strong>{doneCount}</strong>
        </div>
        <div className="stat-card">
          <span>總金額</span>
          <strong>{totalAmount.toLocaleString()}</strong>
        </div>
      </section>

      <main className="grid">
        <section className="card">
          <h2>{editingId ? "編輯文件" : "新增文件"}</h2>

          <form onSubmit={handleSubmit} className="form">
            <label>
              文件類型
              <select name="type" value={form.type} onChange={handleChange}>
                <option>請求書</option>
                <option>修繕單</option>
              </select>
            </label>

            <label>
              文件名稱
              <input name="title" value={form.title} onChange={handleChange} placeholder="例：信義華廈 7月請求書" />
            </label>

            <label>
              資產名稱
              <input name="property" value={form.property} onChange={handleChange} placeholder="例：信義華廈" />
            </label>

            <label>
              廠商／對象
              <input name="vendor" value={form.vendor} onChange={handleChange} placeholder="例：潔泰企業社" />
            </label>

            <label>
              金額
              <input name="amount" type="number" value={form.amount} onChange={handleChange} placeholder="0" />
            </label>

            <label>
              狀態
              <select name="status" value={form.status} onChange={handleChange}>
                <option>待處理</option>
                <option>審核中</option>
                <option>已完成</option>
                <option>已取消</option>
              </select>
            </label>

            <label>
              日期
              <input name="date" type="date" value={form.date} onChange={handleChange} />
            </label>

            <label className="full">
              備註
              <textarea name="note" value={form.note} onChange={handleChange} rows="3" />
            </label>

            <div className="actions full">
              <button type="submit">{editingId ? "儲存修改" : "新增文件"}</button>
              {editingId && (
                <button type="button" className="secondary" onClick={() => {
                  setEditingId(null);
                  setForm(emptyForm);
                }}>
                  取消編輯
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="card">
          <div className="listHeader">
            <h2>文件清單</h2>
            <span>{filteredDocuments.length} 筆</span>
          </div>

          <div className="filters">
            <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="搜尋文件、資產、廠商、備註..." />

            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option>全部</option>
              <option>請求書</option>
              <option>修繕單</option>
            </select>

            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option>全部</option>
              <option>待處理</option>
              <option>審核中</option>
              <option>已完成</option>
              <option>已取消</option>
            </select>
          </div>

          <div className="tableWrap">
            <table>
              <thead>
                <tr>
                  <th>類型</th>
                  <th>文件名稱</th>
                  <th>資產</th>
                  <th>廠商</th>
                  <th>金額</th>
                  <th>狀態</th>
                  <th>日期</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocuments.map((doc) => (
                  <tr key={doc.id}>
                    <td><span className="pill">{doc.type}</span></td>
                    <td>
                      <strong>{doc.title}</strong>
                      <small>{doc.note}</small>
                    </td>
                    <td>{doc.property}</td>
                    <td>{doc.vendor}</td>
                    <td>{Number(doc.amount || 0).toLocaleString()}</td>
                    <td>{doc.status}</td>
                    <td>{doc.date}</td>
                    <td className="rowActions">
                      <button onClick={() => handleEdit(doc)}>編輯</button>
                      <button className="danger" onClick={() => handleDelete(doc.id)}>刪除</button>
                    </td>
                  </tr>
                ))}

                {filteredDocuments.length === 0 && (
                  <tr>
                    <td colSpan="8" className="empty">查無符合條件的文件</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
