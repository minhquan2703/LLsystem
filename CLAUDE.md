# Project Rules

## Import paths
Always use the `@/*` alias instead of relative paths.

## Code style
- Variable and function names: camelCase, **full and descriptive — no abbreviations**
- Prefer simple, flat logic over nested abstractions
- No unnecessary wrapper classes or helper utilities unless reused 3+ times

```ts
// correct
const userWord = await this.userWordRepo.findOne(...)
export function handleSubmitWordReviewAction() {}
export function calculateSpacedRepetition() {}

// wrong — abbreviations forbidden
const uw = await this.userWordRepo.findOne(...)
export function sm2() {}
```

## Comments
Write no comments by default. Add step-by-step comments inside **complex functions** (multi-step algorithms, non-obvious logic). Format: `//comment` — no space after `//`, lowercase, no punctuation.

```ts
//tính khoảng cách ôn tập tiếp theo   ← correct
// tính khoảng cách ôn tập tiếp theo  ← wrong (space after //)
```

Never add emoji into JSX/HTML or comments.

## Control flow
Always use braces `{}` for `if`/`else`/`for` blocks, even single-statement.

## Object formatting
Multi-line objects must be expanded — never inline when the value is long. Applies to `sendRequest` params and JSX props objects.

```ts
// correct
headers: {
    Authorization: `Bearer ${token}`,
},
nextOption: {
    next: { tags: ['list-users'] }
},

// wrong
headers: { Authorization: `Bearer ${token}` },
```

## Explanations
When introducing a concept, decorator, or term the user may not know, add a 1–3 line explanation inline — no need for the user to ask.

## Responsive design
All frontend pages must be responsive. Use antd Grid (`Row` / `Col` with `xs` / `md` breakpoints). Never write fixed-width layouts. Fluid typography: `font-size: clamp(28px, 5vw, 48px)`.

## CSS architecture
Component-specific styles go in a colocated `.module.css` file. Only global resets and CSS variables belong in `globals.css`.

## CSS (frontend)
Write the shortest CSS that achieves the goal. Prefer antd components over plain HTML elements.

## Next.js — Server vs Client Components
Default to Server Component. Only add `'use client'` when using `useState`, `useEffect`, or event handlers.

## Modal mount pattern
Only mount modals when they need to be shown. Never keep a modal always in DOM unless it fetches data on mount (e.g. loads a dropdown from API).

```tsx
// correct — unmounts when closed, form always fresh
{isCreateOpen && <TopicCreate isOpen={isCreateOpen} setIsOpen={setIsCreateOpen} />}
{isUpdateOpen && dataUpdate && (
    <TopicUpdate isOpen={isUpdateOpen} setIsOpen={setIsUpdateOpen} data={dataUpdate} setData={setDataUpdate} />
)}

// wrong — always in DOM, needs manual form.resetFields()
<TopicCreate isOpen={isCreateOpen} setIsOpen={setIsCreateOpen} />
```

Pattern A (always mounted) is only justified when the modal initializes with an API call that you don't want to re-trigger on every open.

## API calls
Always use `sendRequest<T>` from `@/utils/api.ts`. Never call `fetch` directly.

## Backend response types
Always wrap with `IBackendRes<T>`: `sendRequest<IBackendRes<IUser[]>>({ ... })`.

## Shared types
Types used in more than one file go into `@/types/backend.d.ts` as `declare global` interfaces.

## Component file naming
Dot notation, no PascalCase: `user.table.tsx`, `modal.change.password.tsx`.

## Server Actions for mutations
Create / update / delete → `@/utils/actions.ts` as Server Actions. Always call `revalidateTag()` after mutating.

## NextAuth session access
```tsx
// server component / server action
const session = await auth()

// client component
const { data: session } = useSession()
```

## NestJS architecture
Controller handles HTTP only. All business logic lives in Service.

## Environment variables
Always read via `ConfigService`. Never hardcode URLs, passwords, or keys.

## DTOs
Every request input must have an explicit DTO. No `body: any`.

## TypeScript types
Avoid `any`. Use the actual type or `unknown`.
