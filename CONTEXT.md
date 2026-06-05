# LLsystem — Project Context

_Cập nhật lần cuối: 2026-06-05_

---

## Tổng quan

Web app học ngôn ngữ **Trung-Anh-Việt**, người dùng mục tiêu là người Việt học tiếng Trung (core) và tiếng Anh (tương lai).

Điểm khác biệt cốt lõi: trường `hanViet` (âm Hán-Việt, ví dụ 學習 → "học tập") — không có trong CC-CEDICT hay bất kỳ từ điển mã nguồn mở nào. Kết hợp với `vietnameseDef` từ CVDICT, đây là bộ từ điển Trung-Việt đầy đủ nhất có sẵn dưới dạng structured data.

---

## Tech stack

| Layer | Công nghệ | Ghi chú |
|---|---|---|
| Backend | NestJS + TypeORM | `backend-official/` |
| Frontend | Next.js 14 + Ant Design | `frontend/` |
| Database | Supabase PostgreSQL | Session Pooler — IPv4 compatible |
| Auth | JWT (Passport) + Email | Nodemailer + Handlebars templates |
| API pattern | `IBackendRes<T>` wrapper | `TransformInterceptor` global |

**TypeORM version:** v1.x — `select` dùng object format `{ id: true, name: true }`, KHÔNG phải array `['id', 'name']`.

**DB connection:** Session Pooler (không phải Transaction Pooler) vì TypeORM dùng persistent connection. Transaction Pooler sẽ lỗi.

---

## Kiến trúc multi-language (quyết định 2026-06-05)

User chọn 2 preference khi vào app:

- **`learnLang`** (`zh` | `en`): ngôn ngữ muốn học — quyết định giao diện bài học vì tiếng Trung và tiếng Anh có cách học khác nhau (tiếng Trung cần: pinyin, tone, stroke order, HSK; tiếng Anh cần: IPA, CEFR, grammar)
- **`transLang`** (`vi` | `en` | `zh`): ngôn ngữ dịch/giải thích — default cho flashcard, nghĩa từ, giải thích ngữ pháp, feedback

**Hướng đã chọn: Hướng 3 hiện tại, thiết kế theo Hướng 2 trong đầu.**

- **Hướng 2 (target architecture):** separate modules per language — `chinese-words/` và `english-words/` với entity riêng, controller riêng. Chinese-specific fields (pinyin, hanViet, hskLevel) không generalize được sang tiếng Anh.
- **Hướng 3 (current):** chỉ implement Chinese path. Word entity giữ nguyên Chinese-centric. Khi làm tiếng Anh sẽ tạo module `english-words/` mới — không đụng Chinese module.
- CC-CEDICT chỉ có Trung→Anh. English learning cần dataset riêng (tương lai).
- `learnLang` + `transLang` đã thêm vào User entity để tránh phải migrate sau.

---

## Database — Entities

### User
```
id          uuid (PK)           — UUID vì bảo mật (user-facing ID)
name        string
email       string (unique)
password    string              — select: false, bcrypt hash
phone       string?
address     string?
image       string?
role        string              — default: 'USER'
accountType string              — default: 'LOCAL'
isActive    boolean             — default: false, bật sau khi verify email
codeId      string?             — verification code (UUID) hoặc password reset code
codeExpired timestamptz?        — expiry 5 phút
learnLang   string              — default: 'zh' | 'en'
transLang   string              — default: 'vi' | 'en' | 'zh'
createdAt   timestamptz
updatedAt   timestamptz
```

### Word
```
id              int serial (PK) — serial int vì hiệu năng bảng lớn (125k rows)
simplified      string (indexed)    — 学习
traditional     string?             — 學習 | null nếu giống simplified
pinyin          string? (indexed)   — xue2 xi2  (tone numbers từ CC-CEDICT)
hanViet         string?             — học tập   (từ hanviet-pinyin-words)
englishDef      text?               — to learn / to study  (từ CC-CEDICT)
vietnameseDef   text?               — để học / để nghiên cứu  (từ CVDICT)
hskLevel        smallint? (indexed) — 1–9
partOfSpeech    string?             — noun/verb/adjective...
frequency       int?                — thứ hạng tần suất
topics          Topic[] (M:M qua bảng word_topics)
examples        Example[] (1:M)
createdAt       timestamptz
updatedAt       timestamptz
```

**Lưu ý pinyin:** lưu dạng tone number (`xue2 xi2`), không phải tone mark (`xuéxí`). CC-CEDICT dùng format này. Chuyển đổi sang tone mark có thể làm sau nếu cần.

**Lưu ý traditional:** `null` khi traditional === simplified (ký tự không có dạng phồn thể riêng). Khi gọi `hanviet-pinyin-words`, dùng `traditional ?? simplified` — package chỉ nhận traditional character.

### Topic
```
id          int serial (PK)
name        string              — tên tiếng Anh: "Family"
nameVi      string?             — tên tiếng Việt: "Gia đình"
description text?
words       Word[] (M:M)
createdAt   timestamptz
updatedAt   timestamptz
```
`GET /topics` không phân trang — danh sách nhỏ, dùng làm dropdown khi tạo/edit từ.

### Example
```
id          int serial (PK)
chinese     text                — câu ví dụ tiếng Trung
pinyin      text?
english     text?
vietnamese  text?
wordId      int (FK → words, CASCADE DELETE, indexed)
createdAt   timestamptz
```

---

## API Endpoints

### Auth (`/auth`)
| Method | Path | Auth | Mô tả |
|---|---|---|---|
| POST | `/auth/login` | public | Local login, trả `access_token` + `user` info |
| POST | `/auth/register` | public | Đăng ký, gửi email verification (code UUID, hết hạn 5 phút) |
| POST | `/auth/check-code` | public | Kích hoạt tài khoản — body: `{ _id, code }` |
| POST | `/auth/retry-active` | public | Gửi lại email kích hoạt — body: `{ email }` |
| POST | `/auth/retry-password` | public | Gửi email reset password — body: `{ email }` |
| POST | `/auth/change-password` | public | Đổi mật khẩu — body: `{ email, password, confirmPassword }` |
| GET | `/auth/profile` | JWT | Trả thông tin user hiện tại từ JWT token |

**JWT payload:** `{ username: email, sub: userId }`. Strategy validate trả `{ _id, username }` vào `req.user`.

### Users (`/users`)
| Method | Path | Auth | Mô tả |
|---|---|---|---|
| POST | `/users` | JWT | Tạo user (admin dùng) |
| GET | `/users?current=&pageSize=` | JWT | Danh sách user, phân trang |
| GET | `/users/:id` | JWT | Chi tiết user theo UUID |
| PATCH | `/users` | JWT | Cập nhật user — body có `id` (UUID) |
| DELETE | `/users/:id` | JWT | Xóa user |

### Words (`/words`)
| Method | Path | Auth | Mô tả |
|---|---|---|---|
| POST | `/words` | JWT | Tạo từ — body: `CreateWordDto` |
| GET | `/words` | public | Danh sách từ với filter và phân trang |
| GET | `/words/:id` | public | Chi tiết từ kèm `topics[]` + `examples[]` |
| PATCH | `/words/:id` | JWT | Cập nhật từ |
| DELETE | `/words/:id` | JWT | Xóa từ |

Query params cho `GET /words`:
- `search` — tìm trong simplified / pinyin / hanViet / vietnameseDef (LIKE %s%)
- `hskLevel` — filter theo cấp độ (1–9)
- `current` — trang hiện tại (default: 1)
- `pageSize` — số item/trang (default: 10)

Response `GET /words`:
```json
{
  "meta": { "current": 1, "pageSize": 10, "pages": 12502, "total": 125019 },
  "results": [ ...Word[] ]
}
```

### Topics (`/topics`)
| Method | Path | Auth | Mô tả |
|---|---|---|---|
| POST | `/topics` | JWT | Tạo chủ đề |
| GET | `/topics` | public | Tất cả chủ đề (no pagination) |
| GET | `/topics/:id` | public | Chi tiết chủ đề kèm `words[]` |
| PATCH | `/topics/:id` | JWT | Cập nhật chủ đề |
| DELETE | `/topics/:id` | JWT | Xóa chủ đề |

### Examples (`/examples`)
| Method | Path | Auth | Mô tả |
|---|---|---|---|
| POST | `/examples` | JWT | Tạo câu ví dụ — body phải có `wordId` |
| GET | `/examples?wordId=` | public | Câu ví dụ theo từ |
| GET | `/examples/:id` | public | Chi tiết câu ví dụ |
| PATCH | `/examples/:id` | JWT | Cập nhật câu ví dụ |
| DELETE | `/examples/:id` | JWT | Xóa câu ví dụ |

---

## Response format (global)

```json
{
  "statusCode": 200,
  "message": "...",
  "data": { ... }
}
```
Wrap bởi `TransformInterceptor`. Decorator `@ResponseMessage('...')` set message. Decorator `@Public()` bỏ JWT guard.

---

## Data pipeline — Scripts

Tất cả scripts nằm tại `backend-official/src/scripts/`. Chạy từ thư mục `backend-official/`.

### 1. Import CC-CEDICT
```bash
npm run import:cedict -- <path-to-cedict_ts.u8>
# ví dụ: npm run import:cedict -- ../cedict_1_0_ts_utf-8_mdbg.txt
```
- Bulk insert 125,019 từ từ CC-CEDICT (format: `Traditional Simplified [pinyin] /def1/def2/`)
- Điền: `simplified`, `traditional`, `pinyin`, `englishDef`
- Batch size: 500 / insert
- **Chạy 1 lần duy nhất.** Nếu chạy lại sẽ thêm duplicate — truncate bảng trước nếu cần.

### 2. Fill hanViet
```bash
npm run fill:hanviet
```
- Dùng package `hanviet-pinyin-words` (MIT) — chuyển từ Hán sang âm Hán-Việt dựa trên pinyin
- Input: `traditional ?? simplified` + pinyin array (split by space từ CC-CEDICT pinyin)
- Bỏ qua nếu kết quả chứa `_` (ký tự không map được — Latin, số, v.v.)
- Dùng cursor-based pagination (`id > lastId`) thay vì skip/offset
- Bulk update bằng PostgreSQL `unnest` — 1 query/batch thay vì N queries
- **Kết quả:** ~122,417 / 125,019 từ (~97.9%)

### 3. Fill vietnameseDef
```bash
npm run fill:viet -- <path-to-CVDICT.u8>
# ví dụ: npm run fill:viet -- ../CVDICT.u8
```
- Dùng CVDICT (CC BY-SA 4.0) — từ điển Trung-Việt 122k từ, dịch từ CC-CEDICT bằng ChatGPT-4o
- Parse CVDICT vào Map (`simplified|pinyin` → vietnameseDef) — load toàn bộ vào RAM trước
- Match key: `simplified + "|" + pinyin` — gần như 100% match vì cùng nguồn CC-CEDICT
- **Kết quả:** 117,019 / 125,019 từ (~93.6%). ~8,000 không match: tên riêng, từ viết tắt mới, entries thêm sau khi CVDICT được tạo.

### Trạng thái data hiện tại (2026-06-05)
| Field | Số từ có data | Tỷ lệ |
|---|---|---|
| simplified / pinyin / englishDef | 125,019 | 100% |
| traditional | ~100,000 | ~80% (null = giống simplified) |
| hanViet | ~122,417 | ~97.9% |
| vietnameseDef | 117,019 | 93.6% |

---

## Frontend — Cấu trúc hiện tại

```
frontend/src/app/
  (admin)/dashboard/
    layout.tsx              — sidebar + header + footer layout
    page.tsx                — dashboard home
    user/page.tsx           — quản lý users ✅ (table/create/update hoàn chỉnh)
    product/page.tsx        — quản lý words (đang build)
  (guest)/
    auth/login/page.tsx     — đăng nhập
    auth/register/page.tsx  — đăng ký
    verify/[id]/page.tsx    — kích hoạt tài khoản
  layout.tsx
  page.tsx                  — landing page
```

**Patterns:**
- API calls: `sendRequest<IBackendRes<T>>` từ `@/utils/api.ts` — KHÔNG dùng `fetch` trực tiếp
- Mutations: Next.js Server Actions trong `@/utils/actions.ts`, gọi `revalidateTag()` sau khi mutate
- Session server-side: `import { auth } from '@/auth'` + `const session = await auth()`
- Session client-side: `import { useSession } from 'next-auth/react'`
- Default: Server Component (không cần directive). Thêm `'use client'` chỉ khi dùng `useState`/`useEffect`/event handlers

---

## Roadmap

### Đã hoàn thành ✅
- Auth flow đầy đủ (register, login, verify email, reset password)
- CRUD: Users, Words, Topics, Examples
- `learnLang` + `transLang` field trên User entity
- Data pipeline: CC-CEDICT import → fill hanViet → fill vietnameseDef
- `GET /auth/profile` endpoint

### Tiếp theo
1. **Trang quản lý Words** (frontend `dashboard/product/`) — backend đã đủ
2. **Tier 2 — SRS Learning:**
   - Entity `UserWord` (user ↔ word + SRS metadata: interval, easeFactor, nextReviewAt, repetitions)
   - Thuật toán SM-2: từ khó ôn dày, thuộc ôn thưa
   - API: POST `/learning/review` (nhận điểm 0–5, tính lại schedule), GET `/learning/due` (từ cần ôn hôm nay)

### Tương lai xa
- Trang học từ vựng (flashcard UI với learnLang/transLang aware)
- English learning path (module `english-words/` riêng, dataset riêng)
- Speaking/writing feedback
- Reading comprehension

---

## Technical constraints & notes

- **`synchronize: true`** đang bật trong TypeORM — chỉ dùng trong dev. Production phải đổi sang migration.
- **JWT_SECRET** trong `.env` là placeholder — bắt buộc đổi trước khi deploy.
- **DB:** Session Pooler (không phải Transaction Pooler) vì TypeORM dùng persistent connection.
- **TypeORM v1 `select`:** dùng object `{ id: true }` không phải array `['id']`.
- **Pagination trong scripts:** dùng cursor `id > lastId` thay vì `skip/offset` khi WHERE clause thay đổi theo batch — tránh bỏ sót rows.
- **hanviet-pinyin-words** nhận traditional character, không phải simplified — luôn dùng `traditional ?? simplified`.
- **changePassword** đã fix: kiểm tra cả `codeId` lẫn `codeExpired` (trước đó chỉ check expiry — security bug).
