# PreFit — AI 피부·성형 컨시어지

검증된 전문의 유튜브 데이터(RAG) 기반 AI 상담 플랫폼.

## Stack

- **Frontend**: Next.js 16 (App Router), TypeScript, Tailwind CSS v4
- **State**: Zustand
- **Animation**: Framer Motion
- **Icons**: Lucide React
- **Backend/DB**: Supabase
- **Deploy**: Vercel (GitHub 연동 자동 배포)

## 프로젝트 구조

```
src/
├── app/                    # Next.js App Router pages
│   ├── chat/               # AI 상담 채팅방
│   ├── layout.tsx
│   └── page.tsx            # 랜딩 페이지
├── components/
│   ├── layout/             # Header, Footer, MobileNav, AppShell
│   └── ui/                 # 공통 UI (Button, Avatar)
├── features/
│   └── chat/               # 채팅 feature (components, store, types)
└── lib/
    ├── supabase/           # Supabase client (browser + server)
    └── utils.ts
```

## 로컬 개발

```bash
npm install
cp .env.example .env.local   # Supabase 키 입력
npm run dev
```

http://localhost:3000 에서 확인

## Supabase · GitHub · Vercel 자동 배포 설정

### 1. GitHub → Vercel 연동 (한 번만)

1. [Vercel Dashboard](https://vercel.com/new) → **Import Git Repository**
2. `okas2022/beautyconsult` 선택
3. Framework: **Next.js** (자동 감지)
4. Environment Variables 추가:

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://pqqhqkqovxvusxktcuce.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Publishable Key |

5. **Deploy** 클릭

이후 `main` 브랜치에 push할 때마다 Vercel이 자동으로 빌드·배포합니다.

### 2. Cursor에서 수정 → 자동 반영 흐름

```
Cursor에서 코드 수정 → git push → GitHub → Vercel 자동 배포
```

### 3. Supabase

- Project URL: `https://pqqhqkqovxvusxktcuce.supabase.co`
- Dashboard: https://supabase.com/dashboard/project/pqqhqkqovxvusxktcuce

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | 개발 서버 |
| `npm run build` | 프로덕션 빌드 |
| `npm run start` | 프로덕션 서버 |
| `npm run lint` | ESLint |

## License

Private
