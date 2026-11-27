# 票務交流區（twcabbage）

ミオファ的高麗菜園的票務交流區，從 twmiofa 獨立出來。資料庫沿用 twmiofa / twkaitakusha 同一個 Supabase 專案，不需另外建立。

- `index.html`：票務交流區；`admin.html`：管理；`privacy.html`：隱私權政策
- `js/tickets.js`、`js/admin.js`、`js/cloud.js`：功能與 Google 登入
- `supabase/002_ticket_posts.sql`、`003_ticket_admin.sql`：資料表與管理函式（已執行過則不用再跑）

