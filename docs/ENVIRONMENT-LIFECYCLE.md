# CALOPS Environment Lifecycle

## The Model

```
LOCAL (feature branch) → DEVL → TEST → PROD
```

| Stage | Branch | Deploy Target | Purpose |
|-------|--------|---------------|---------|
| **LOCAL** | `feature/CALOPS-XXX` | localhost:3000 | Development & testing |
| **DEVL** | `main` | Vercel Preview | Integration testing |
| **TEST** | `TEST` | Vercel Staging | QA & acceptance testing |
| **PROD** | `PROD` | Vercel Production | Live users |

## Current Shortcut (Temporary)

**Why**: Single developer, single prod user (Toby). No need for full lifecycle overhead.

**Current workflow**:
```
LOCAL (feature branch) → main → PROD (auto-deploy)
```

| Stage | Branch | Deploy Target |
|-------|--------|---------------|
| **LOCAL** | `feature/CALOPS-XXX` | localhost:3000 |
| **PROD** | `main` | calops.vercel.app |

**What we skip**:
- DEVL environment (merged into main)
- TEST environment (manual testing on Preview deploys)
- Separate PROD branch (main = PROD)

## When to Expand

Expand to full lifecycle when:
1. Multiple developers working on CALOPS
2. Multiple production users (beyond Toby)
3. Need for QA/acceptance testing phase
4. Compliance or audit requirements

## Full Lifecycle (Future)

```
┌──────────────────────────────────────────────────────────────────┐
│  LOCAL                                                           │
│  Branch: feature/CALOPS-XXX                                      │
│  URL: http://localhost:3000                                      │
│  Backend: http://localhost:7071                                  │
│  Autonomy: Full (commit freely)                                  │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼ PR to main
┌──────────────────────────────────────────────────────────────────┐
│  DEVL                                                            │
│  Branch: main                                                    │
│  URL: calops-devl.vercel.app (or preview URL)                    │
│  Backend: calendarbeaf-test.azurewebsites.net                    │
│  Autonomy: Semi-controlled (CR for risky changes)                │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼ merge to TEST
┌──────────────────────────────────────────────────────────────────┐
│  TEST                                                            │
│  Branch: TEST                                                    │
│  URL: calops-test.vercel.app                                     │
│  Backend: calendarbeaf-test.azurewebsites.net                    │
│  Autonomy: Approval required                                     │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼ merge to PROD (explicit approval)
┌──────────────────────────────────────────────────────────────────┐
│  PROD                                                            │
│  Branch: PROD                                                    │
│  URL: calops.vercel.app                                          │
│  Backend: calendarbeaf-prod.azurewebsites.net                    │
│  Autonomy: Locked (always requires approval)                     │
└──────────────────────────────────────────────────────────────────┘
```

## Backend Alignment

The backend (calendar-be-af) uses full lifecycle:

| FE Stage | BE Stage | BE Branch | BE URL |
|----------|----------|-----------|--------|
| LOCAL | LOCAL | main | localhost:7071 |
| DEVL | TEST | TEST | calendarbeaf-test.azurewebsites.net |
| TEST | TEST | TEST | calendarbeaf-test.azurewebsites.net |
| PROD | PROD | PROD | calendarbeaf-prod.azurewebsites.net |

## Branch Autonomy Rules

See `CLAUDE.md` → `YBOTBOT-BRANCH-AUTONOMY.md` for AI agent autonomy levels by branch.

| Branch Type | Autonomy |
|-------------|----------|
| `feature/*` | Full autonomous |
| `main` | Approval required |
| `TEST` | Maximum control |
| `PROD` | Maximum control |

---

**Last Updated**: 2026-02-23
**Status**: Temporary shortcut active (main = PROD)
