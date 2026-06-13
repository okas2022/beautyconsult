# PreFit — AI 피부·성형 컨시어지

검증된 전문의 유튜브 데이터(RAG) 기반 AI 상담 플랫폼.

## Stack

- **Frontend**: Next.js 16 (App Router), TypeScript, Tailwind CSS v4
- **State**: Zustand
- **Animation**: Framer Motion
- **Icons**: Lucide React
- **AI/RAG**: Google Gemini + YouTube 자막 하이브리드 검색 (벡터 + 키워드)
- **Backend/DB**: Supabase (선택 pgvector)
- **Deploy**: Vercel (GitHub 연동 자동 배포)

## 핵심 기능: YouTube RAG 상담

질문 → 자막 청크 검색 → AI 답변 + **해당 타임스탬프 YouTube 재생**

```
src/lib/youtube-rag.ts          # 하이브리드 RAG 검색
src/lib/consult-gemini.ts       # Gemini 답변 생성
src/app/api/consult/chat/       # 채팅 API
data/youtube/videos_chunks.json # 편집된 자막 청크 (타임스탬프 포함)
scripts/youtube/                # 자막 추출·편집·인덱싱 파이프라인
```

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

## Supabase · GitHub · Vercel 자동 배포

### Live URLs

| Service | URL |
|---------|-----|
| **Production** | https://beutyconsult.vercel.app |
| **GitHub** | https://github.com/okas2022/beautyconsult |
| **Vercel Dashboard** | https://vercel.com/young-joon-seos-projects/beuty_consult |

`main` 브랜치 push → Vercel 자동 배포 (GitHub 연동 완료)

### 환경 변수 (Vercel에 설정됨)

| Key | 설명 |
|-----|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Publishable Key (클라이언트) |
| `SUPABASE_SECRET_KEY` | Secret Key (서버 전용) |
| `SUPABASE_PROJECT_REF` | `pqqhqkqovxvusxktcuce` |
| `GEMINI_API_KEY` | (추가 필요) AI 답변 |
| `REPLICATE_API_TOKEN` | (추가 필요) 시뮬레이션 |

### Cursor → 자동 배포 흐름

```
Cursor 수정 → git push origin main → GitHub → Vercel 자동 빌드·배포
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | 개발 서버 |
| `npm run build` | 프로덕션 빌드 |
| `npm run start` | 프로덕션 서버 |
| `npm run lint` | ESLint |

## License

Private
