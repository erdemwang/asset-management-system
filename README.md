# 文件管理系統 — Milestone 1

這是第一版可部署測試專案，功能包含：登入、Dashboard、請求書列表、修繕單列表、搜尋、年度篩選、建物篩選、Google Drive 開啟／下載連結。

## 測試登入

- 帳號：admin
- 密碼：123456

## 本版資料狀態

Milestone 1 先使用 `src/data/mockDocuments.js` 內的示範資料，資料來源取自目前 Google Drive 資料夾已確認的檔案名稱與連結格式。下一版會改成由 Google Drive API 自動讀取。

## Netlify 設定

Build command：

```bash
npm run build
```

Publish directory：

```bash
dist
```

## 上傳 GitHub

將此資料夾內全部檔案上傳到 GitHub Repository 根目錄。

## 下一個 Milestone

- 串接 Google Drive API
- 自動讀取請求書／修繕單資料夾
- 自動解析檔名
