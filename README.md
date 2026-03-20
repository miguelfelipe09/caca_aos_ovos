# Caça aos Ovos 🥚 (MVP AR Web)

Experiência web de realidade aumentada com image tracking (MindAR) para caça de personagens 3D. Stack: React + Vite + Tailwind + Three.js + MindAR no frontend e Node + Express + Prisma + PostgreSQL + JWT no backend.

## Requisitos
- Node 18+
- PostgreSQL rodando e URL no `.env`

## Backend
```bash
cd backend
cp .env.example .env   # configure DATABASE_URL e JWT_SECRET
npm install
npx prisma generate
npx prisma migrate dev --name init
npx ts-node prisma/seed.ts  # cria admin padrão admin@caca.com / admin123
npm run dev
```
API sobe em `http://localhost:4000`.

### Endpoints principais
- `POST /auth/register` / `POST /auth/login` / `GET /auth/me`
- `GET /ar-points` (autenticado) lista com flag `captured` por usuário
- `POST /ar-points` (admin) CRUD completo
- `POST /captures` registra captura (proteção duplicada)
- `GET /captures/me` histórico
- `GET /captures/ranking` ranking top 20

## Frontend
```bash
cd ../frontend
cp .env.example .env   # aponte VITE_API_URL para o backend
npm install
npm run dev
```
App em `http://localhost:5173`.

### Fluxo de uso
1. Registrar/login (admin já criado no seed).
2. Admin cria pontos AR: define targetIndex/targetName, URL do modelo `.glb`, pose (pos/rot/scale) e pontos.
3. Usuário vai à tela **Caça AR**, MindAR carrega `/targets.mind` (coloque o arquivo exportado do MindAR nessa rota pública).
4. Ao detectar um alvo, renderiza o modelo; toque → animação simples + POST `/captures`; overlay “Capturado” e score atualizado. Cada usuário só captura 1x por ponto; depois some para ele.
5. Ranking e histórico disponíveis.

## Estrutura
- `backend/src` camadas: routes, controllers, services, middleware.
- `backend/prisma/schema.prisma` modelos User, ARPoint, Capture com constraint única (userId, arPointId).
- `frontend/src` páginas: Login, Register, Home, ARScene, Ranking, History, Admin dashboard e editor.

## Notas de AR
- `targets.mind` deve conter todos os alvos na mesma ordem dos `targetIndex`.
- Modelos `.glb` podem ser servidos via URL pública (ex: `/assets/models/ovo.glb`).
- Pose aplicada em runtime conforme valores salvos.

## Scripts úteis
- `npm run prisma:migrate` (backend) — criar/atualizar schema.
- `npm run dev` (backend/frontend) — desenvolvimento.

## Segurança
- JWT em header `Authorization: Bearer <token>`.
- Rotas admin protegidas por middleware.
- Captura possui validação + índice único para evitar duplicidade.
