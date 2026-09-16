# COEXIST · Bluevine Command

A live **remote command center** for Bluevine operations: treasury, payment rails, credit, risk, and the nationwide node fabric.

This is a fully interactive operator desk. Every approve, freeze, reboot, page, and terminal command mutates the live book. Telemetry keeps moving. The audit log never forgets.

## Uplink

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

| Field | Demo value |
| --- | --- |
| Operator | `BV-OPS-01` (or `07`, `12`, `19`, `22`, `31`) |
| Access key | `coexist` |

`⌘K` / `Ctrl+K` opens the command palette. `/` focuses the HUD command line.

## What you can actually do

- **Command deck** — live deposits, lending, ACH, dual-control wires
- **Treasury** — concentration, APY stack, FDIC program coverage
- **Payment rails** — filter/search; approve, hold, or reject ACH / wire / RTP / check
- **Credit book** — lines of credit and term facilities with utilization
- **Risk sentinel** — ack or escalate alerts; freeze / thaw accounts (freeze kills queued rails)
- **Remote nodes** — attach a session, reboot, isolate, restore; live latency/CPU
- **Incident bridge** — open, ack, resolve
- **Roster** — page operators onto the desk
- **Terminal** — real command parser against the live store
- **Audit** — every action, timestamped

### Terminal

```
help
status
rails approve WIR-118304
accounts freeze kite
nodes connect DEN-EDGE
nodes reboot DEN-EDGE
alerts escalate RSK-441
page BV-OPS-07
focus risk
```

## Build & test

```bash
npm test
npm run build
```

Static output lands in `dist/`. `netlify.toml` is already wired for SPA routing.

## Brand

Palette and mark follow Bluevine’s current identity: signature blues, vine teal, leaf green, and the three-shape modular logo — staged as a dark remote-ops HUD rather than a consumer banking site.
