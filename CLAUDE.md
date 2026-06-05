# Project Rules

## Import paths
Always use the `@/*` alias instead of relative paths.

```ts
// correct
import { AppService } from '@/app.service'
import { UserModule } from '@/users/user.module'

// wrong
import { AppService } from './app.service'
import { UserModule } from '../../users/user.module'
```

## Code style
- Follow the existing template patterns for naming and structure
- Variable and function names: camelCase, descriptive but short
- Prefer simple, flat logic over nested abstractions
- No unnecessary wrapper classes or helper utilities unless reused 3+ times

## Comments
Write no comments by default. If a comment is truly necessary, use lowercase with no punctuation.

```ts
// correct
// hàm xử lý scroll

// wrong
// Hàm Xử Lý Scroll
// Handle scroll function
```

Never add icon characters or emoji into JSX/HTML elements or comments. Use icon library components (`<SearchOutlined />`) only when genuinely needed for UX — do not decorate.

## Explanations
When introducing a concept, decorator, or term the user may not know, add a 1–3 line explanation inline in the response — no need for the user to ask.

## Responsive design
All frontend pages must be responsive and display correctly on mobile.
Use Ant Design's Grid (`Row` / `Col` with `xs` / `sm` / `md` / `lg` breakpoints) — already installed, zero config overhead.
**Trade-off vs Tailwind CSS:** antd Grid is less flexible (24-column system only) but requires no build config and stays consistent with the existing component library. Add Tailwind only if antd Grid proves insufficient.
Never write fixed-width layouts. Every page needs at minimum `xs` (mobile) and `md` (desktop) breakpoints.
For fluid typography use `clamp()`: `font-size: clamp(28px, 5vw, 48px)`.

## CSS architecture
Component-specific styles (keyframes, hover states, class-based layout) go in a colocated `.module.css` file next to the component — e.g., `alert.context.module.css` next to `alert.context.tsx`.
Only global resets, CSS variables, and font imports belong in `globals.css`.
Type declarations for CSS imports go in `src/types/css.d.ts`.

## CSS (frontend)
Write the shortest CSS that achieves the goal. Use shorthand and utility-first patterns.

```css
/* correct — 2 lines */
display: flex;
place-items: center;

/* wrong — 5 lines */
display: flex;
justify-content: center;
align-items: center;
flex-direction: row;
flex-wrap: nowrap;
```

Prefer Ant Design (`antd`) components over plain HTML elements. Check antd docs before writing a custom `<button>`, `<input>`, `<table>`, etc.

## Next.js — Server vs Client Components
Default to Server Component (no directive needed). Only add `'use client'` when the component uses `useState`, `useEffect`, or event handlers like `onClick`.

```tsx
// server component — no directive, runs on server, can be async
export default async function Page() { ... }

// client component — add directive at top of file
'use client'
export default function Counter() {
  const [count, setCount] = useState(0)
  ...
}
```

## API calls
Always use `sendRequest<T>` from `@/utils/api.ts`. Never call `fetch` directly.

```tsx
// correct
const res = await sendRequest<IBackendRes<IUser>>({ url: '...', method: 'GET' })

// wrong
const res = await fetch('...').then(r => r.json())
```

## Backend response types
Always wrap the expected data type with `IBackendRes<T>` when typing API responses.

```tsx
const res = await sendRequest<IBackendRes<IUser[]>>({ ... })
// res.data is IUser[], res.statusCode is number, res.message is string
```

## Shared types
Types used in more than one file go into `@/types/backend.d.ts` as `declare global` interfaces — no import needed anywhere in the project.

## Component file naming
Use dot notation to reflect parent-child relationships. No PascalCase filenames.

```
// correct
user.table.tsx
modal.change.password.tsx
admin.card.tsx

// wrong
UserTable.tsx
ModalChangePassword.tsx
```

## Server Actions for mutations
Create / update / delete operations go in `@/utils/actions.ts` as Next.js Server Actions — no need to create a separate `/api/...` route. Always call `revalidateTag()` after mutating to invalidate the cached list.

```ts
// correct — in @/utils/actions.ts
'use server'
export async function handleCreateUserAction(data: ICreateUser) {
  await sendRequest({ url: '...', method: 'POST', body: data })
  revalidateTag('list-users')
}

// wrong — creating an extra API route just for CRUD
// app/api/users/route.ts → POST handler
```

## NextAuth session access
Access the session differently depending on where the code runs.

```tsx
// server component / server action
import { auth } from '@/auth'
const session = await auth()

// client component
import { useSession } from 'next-auth/react'
const { data: session } = useSession()
```

## NestJS architecture
Controller handles HTTP only (receive request, return response). All business logic lives in Service.

```ts
// correct
@Get()
getAll() {
  return this.usersService.findAll() // logic in service
}

// wrong
@Get()
async getAll() {
  const users = await this.dataSource.query('SELECT * FROM users') // logic in controller
  return users.filter(u => u.isActive)
}
```

## Environment variables
Always read config via `ConfigService`. Never hardcode URLs, passwords, or keys.

```ts
// correct
const host = this.configService.get('DB_HOST')

// wrong
const host = 'aws-1-ap-northeast-2.pooler.supabase.com'
```

## DTOs
Every request input (body, query param, route param) must have an explicit DTO with typed fields. No raw `req.body` access.

```ts
// correct
@Post()
create(@Body() dto: CreateUserDto) { ... }

// wrong
@Post()
create(@Body() body: any) { ... }
```

## TypeScript types
Avoid `any`. Use the actual type or `unknown` if unsure.

```ts
// correct
const user: User = await this.usersService.findOne(id)

// wrong
const user: any = await this.usersService.findOne(id)
```
