# CALOPS Environment Lifecycle

## The Model

```
LOCAL (feature branch) → DEVL (remote) → TEST → PROD
```

| Stage | Location | Branch | Deploy Target | Purpose |
|-------|----------|--------|---------------|---------|
| **LOCAL** | Your machine | `feature/CALOPS-XXX` | localhost:3000 | Development |
| **DEVL** | Remote | `main` | (preview deploys) | Integration |
| **TEST** | Remote | `TEST` | calops-test.vercel.app | QA/Staging |
| **PROD** | Remote | `PROD` | calops.vercel.app | Production |

## Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│  LOCAL                                                          │
│  You work on: feature/CALOPS-XXX                                │
│  Run locally: localhost:3000                                    │
│  Backend: localhost:7071                                        │
│  Autonomy: Full (commit freely, push to feature branch)         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ merge feature → main
┌─────────────────────────────────────────────────────────────────┐
│  DEVL (remote)                                                  │
│  Branch: main                                                   │
│  Deploy: Vercel preview (auto on PR/push)                       │
│  Backend: calendarbeaf-test.azurewebsites.net                   │
│  Autonomy: Semi-controlled                                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ merge main → TEST
┌─────────────────────────────────────────────────────────────────┐
│  TEST                                                           │
│  Branch: TEST                                                   │
│  Deploy: calops-test.vercel.app                                 │
│  Backend: calendarbeaf-test.azurewebsites.net                   │
│  Autonomy: Approval required                                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ merge TEST → PROD (explicit approval)
┌─────────────────────────────────────────────────────────────────┐
│  PROD                                                           │
│  Branch: PROD                                                   │
│  Deploy: calops.vercel.app, cal-ops.org                         │
│  Backend: calendarbeaf-prod.azurewebsites.net                   │
│  Autonomy: Locked (always requires approval)                    │
└─────────────────────────────────────────────────────────────────┘
```

## Current Shortcut (Temporary)

**Why**: Single developer, single prod user (Toby).

**Shortcut workflow**:
```
LOCAL (feature) → main (DEVL) → PROD
                      ↓
                 (skip TEST)
```

**When to use full lifecycle**:
1. Multiple developers
2. Multiple production users
3. Need QA/acceptance phase
4. Compliance requirements

## Vercel Deployments

| Branch | URL | Auto-Deploy |
|--------|-----|-------------|
| `main` | Preview URLs | Yes (on push) |
| `TEST` | calops-test.vercel.app | Yes |
| `PROD` | calops.vercel.app | Yes |

## Backend Alignment

| FE Stage | BE Stage | BE Branch | BE URL |
|----------|----------|-----------|--------|
| LOCAL | LOCAL | main | localhost:7071 |
| DEVL | TEST | TEST | calendarbeaf-test.azurewebsites.net |
| TEST | TEST | TEST | calendarbeaf-test.azurewebsites.net |
| PROD | PROD | PROD | calendarbeaf-prod.azurewebsites.net |

## Branch Autonomy (AI Agents)

| Branch | Autonomy Level |
|--------|----------------|
| `feature/*` | Full autonomous |
| `main` | Semi-controlled |
| `TEST` | Approval required |
| `PROD` | Locked (always approval) |

See `CLAUDE.md` → `YBOTBOT-BRANCH-AUTONOMY.md` for details.

---

**Last Updated**: 2026-02-23
**Status**: Shortcut active (skipping TEST)
**Infrastructure**: Full lifecycle ready when needed
