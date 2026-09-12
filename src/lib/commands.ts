import { ACCOUNTS, DEMO_KEY, DEMO_OPERATORS, NODES } from "./seed";
import { clamp, jitter, uid } from "./format";
import type {
  Account,
  Alert,
  AuditEvent,
  CommandResult,
  CreditFacility,
  Incident,
  Operator,
  Payment,
  RemoteNode,
  Snapshot,
  TermLine,
  Toast,
  ViewId,
} from "./types";

export type CommandContext = {
  actor: Operator;
  snapshot: Snapshot;
  accounts: Account[];
  payments: Payment[];
  credits: CreditFacility[];
  alerts: Alert[];
  incidents: Incident[];
  nodes: RemoteNode[];
  operators: Operator[];
  connectedNodeId: string | null;
};

export type CommandEffect =
  | { type: "none" }
  | { type: "approve"; id: string }
  | { type: "hold"; id: string }
  | { type: "reject"; id: string }
  | { type: "freeze"; id: string }
  | { type: "thaw"; id: string }
  | { type: "ack-alert"; id: string }
  | { type: "escalate-alert"; id: string }
  | { type: "ack-incident"; id: string }
  | { type: "resolve-incident"; id: string }
  | { type: "open-incident"; title: string }
  | { type: "connect"; id: string }
  | { type: "reboot"; id: string }
  | { type: "isolate"; id: string }
  | { type: "restore"; id: string }
  | { type: "page"; id: string }
  | { type: "clear" };

export type ParsedCommand = {
  result: CommandResult;
  effect: CommandEffect;
};

const HELP = [
  "COEXIST remote command — Bluevine ops",
  "  help                         this list",
  "  status                       live book snapshot",
  "  whoami                       current operator",
  "  liquidity                    treasury position",
  "  nodes list | connect <id> | reboot <id> | isolate <id> | restore <id>",
  "  accounts search <q> | freeze <id> | thaw <id>",
  "  rails list | approve <id> | hold <id> | reject <id>",
  "  alerts list | ack <id> | escalate <id>",
  "  incidents list | ack <id> | resolve <id> | open <title>",
  "  page <operator-id>",
  "  focus deck|treasury|rails|credit|risk|nodes|incidents|roster|terminal|audit",
  "  audit                        last actions",
  "  clear                        wipe terminal",
];

function findAccount(ctx: CommandContext, q: string) {
  const needle = q.toLowerCase();
  return ctx.accounts.find(
    (a) =>
      a.id.toLowerCase() === needle ||
      a.legal.toLowerCase().includes(needle) ||
      a.dba.toLowerCase().includes(needle),
  );
}

function findPayment(ctx: CommandContext, id: string) {
  const needle = id.toLowerCase();
  return ctx.payments.find((p) => p.id.toLowerCase() === needle);
}

function findNode(ctx: CommandContext, id: string) {
  const needle = id.toLowerCase();
  return ctx.nodes.find(
    (n) => n.id.toLowerCase() === needle || n.name.toLowerCase().includes(needle),
  );
}

function findOp(ctx: CommandContext, id: string) {
  const needle = id.toLowerCase();
  return ctx.operators.find(
    (o) => o.id.toLowerCase() === needle || o.name.toLowerCase().includes(needle),
  );
}

function findAlert(ctx: CommandContext, id: string) {
  return ctx.alerts.find((a) => a.id.toLowerCase() === id.toLowerCase());
}

function findIncident(ctx: CommandContext, id: string) {
  return ctx.incidents.find((i) => i.id.toLowerCase() === id.toLowerCase());
}

export function authenticate(handle: string, key: string): Operator | null {
  if (key.trim().toLowerCase() !== DEMO_KEY) return null;
  const op =
    DEMO_OPERATORS.find((o) => o.id.toLowerCase() === handle.trim().toLowerCase()) ??
    DEMO_OPERATORS.find((o) => o.name.toLowerCase().includes(handle.trim().toLowerCase()));
  return op ?? null;
}

export function parseCommand(raw: string, ctx: CommandContext): ParsedCommand {
  const text = raw.trim();
  if (!text) return { result: { ok: true, lines: [] }, effect: { type: "none" } };

  const parts = text.split(/\s+/);
  const head = parts[0].toLowerCase();
  const arg1 = parts[1] ?? "";
  const rest = parts.slice(1).join(" ");
  const rest2 = parts.slice(2).join(" ");

  const fail = (msg: string): ParsedCommand => ({
    result: { ok: false, lines: [msg] },
    effect: { type: "none" },
  });
  const ok = (lines: string[], extra?: Partial<ParsedCommand>): ParsedCommand => ({
    result: { ok: true, lines },
    effect: { type: "none" },
    ...extra,
  });

  if (head === "help" || head === "?") return ok(HELP);

  if (head === "whoami") {
    const a = ctx.actor;
    return ok([`${a.id}  ${a.name}  ${a.role}  ${a.seat}  ${a.status}`]);
  }

  if (head === "status") {
    const s = ctx.snapshot;
    return ok([
      `deposits ${s.deposits.toFixed(0)}`,
      `loans ${s.loansOutstanding.toFixed(0)}`,
      `ach.today ${s.achToday.toFixed(0)}`,
      `wires.pending ${s.wiresPending}`,
      `fraud.open ${s.fraudOpen}`,
      `nodes.online ${s.nodesOnline}/${ctx.nodes.length}`,
      `businesses ${s.businesses}`,
    ]);
  }

  if (head === "liquidity") {
    const performing = ctx.credits.filter((c) => c.status === "performing").length;
    return ok([
      `book.deposits ${ctx.snapshot.deposits.toFixed(0)}`,
      `fdic.program ${ctx.snapshot.fdicCoverage}`,
      `credit.performing ${performing}/${ctx.credits.length}`,
      `wires.held ${ctx.payments.filter((p) => p.kind === "WIRE" && p.status === "held").length}`,
    ]);
  }

  if (head === "clear") {
    return { result: { ok: true, lines: [] }, effect: { type: "clear" } };
  }

  if (head === "focus") {
    const map: Record<string, ViewId> = {
      deck: "deck",
      treasury: "treasury",
      rails: "rails",
      payments: "rails",
      credit: "credit",
      risk: "risk",
      nodes: "nodes",
      incidents: "incidents",
      roster: "roster",
      terminal: "terminal",
      audit: "audit",
    };
    const view = map[arg1.toLowerCase()];
    if (!view) return fail("unknown view");
    return {
      result: { ok: true, lines: [`focus ${view}`], navigate: view },
      effect: { type: "none" },
    };
  }

  if (head === "nodes") {
    if (!arg1 || arg1 === "list") {
      return ok(
        ctx.nodes.map(
          (n) => `${n.id.padEnd(14)} ${n.status.padEnd(10)} ${n.latencyMs}ms  cpu ${n.cpu}%  ${n.city}`,
        ),
      );
    }
    if (["connect", "reboot", "isolate", "restore"].includes(arg1)) {
      const node = findNode(ctx, rest2);
      if (!node) return fail(`node not found: ${rest2}`);
      if (arg1 === "connect") {
        return {
          result: { ok: true, lines: [`session attached · ${node.id} ${node.name}`], navigate: "nodes" },
          effect: { type: "connect", id: node.id },
        };
      }
      if (arg1 === "reboot") {
        return {
          result: { ok: true, lines: [`reboot queued · ${node.id}`] },
          effect: { type: "reboot", id: node.id },
        };
      }
      if (arg1 === "isolate") {
        return {
          result: { ok: true, lines: [`isolated · ${node.id}`] },
          effect: { type: "isolate", id: node.id },
        };
      }
      return {
        result: { ok: true, lines: [`restored · ${node.id}`] },
        effect: { type: "restore", id: node.id },
      };
    }
    return fail("nodes list | connect | reboot | isolate | restore");
  }

  if (head === "accounts") {
    if (arg1 === "search") {
      const q = rest2.toLowerCase();
      const hits = ctx.accounts.filter(
        (a) =>
          a.id.toLowerCase().includes(q) ||
          a.legal.toLowerCase().includes(q) ||
          a.dba.toLowerCase().includes(q) ||
          a.city.toLowerCase().includes(q),
      );
      if (!hits.length) return fail("no accounts");
      return ok(hits.map((a) => `${a.id}  ${a.dba}  ${a.status}  risk ${a.risk}  ${a.city}`));
    }
    if (arg1 === "freeze" || arg1 === "thaw") {
      const acct = findAccount(ctx, rest2);
      if (!acct) return fail(`account not found: ${rest2}`);
      return {
        result: { ok: true, lines: [`${arg1} ${acct.id} ${acct.dba}`] },
        effect: { type: arg1, id: acct.id },
      };
    }
    return fail("accounts search | freeze | thaw");
  }

  if (head === "rails" || head === "wires" || head === "payments") {
    if (!arg1 || arg1 === "list") {
      return ok(
        ctx.payments.map(
          (p) => `${p.id.padEnd(12)} ${p.kind.padEnd(5)} ${p.status.padEnd(9)} ${p.amount}  ${p.from} → ${p.to}`,
        ),
      );
    }
    if (["approve", "hold", "reject"].includes(arg1)) {
      const p = findPayment(ctx, rest2);
      if (!p) return fail(`payment not found: ${rest2}`);
      return {
        result: { ok: true, lines: [`${arg1} ${p.id} ${p.kind} ${p.amount}`] },
        effect: { type: arg1 as "approve" | "hold" | "reject", id: p.id },
      };
    }
    return fail("rails list | approve | hold | reject");
  }

  if (head === "alerts") {
    if (!arg1 || arg1 === "list") {
      return ok(ctx.alerts.map((a) => `${a.id}  ${a.severity}  ${a.acked ? "acked" : "open"}  ${a.title}`));
    }
    if (arg1 === "ack") {
      const a = findAlert(ctx, rest2);
      if (!a) return fail(`alert not found: ${rest2}`);
      return {
        result: { ok: true, lines: [`acked ${a.id}`] },
        effect: { type: "ack-alert", id: a.id },
      };
    }
    if (arg1 === "escalate") {
      const a = findAlert(ctx, rest2);
      if (!a) return fail(`alert not found: ${rest2}`);
      return {
        result: { ok: true, lines: [`escalated ${a.id} → incident`] },
        effect: { type: "escalate-alert", id: a.id },
      };
    }
    return fail("alerts list | ack | escalate");
  }

  if (head === "incidents") {
    if (!arg1 || arg1 === "list") {
      return ok(ctx.incidents.map((i) => `${i.id}  ${i.status}  ${i.severity}  ${i.title}`));
    }
    if (arg1 === "ack" || arg1 === "resolve") {
      const i = findIncident(ctx, rest2);
      if (!i) return fail(`incident not found: ${rest2}`);
      return {
        result: { ok: true, lines: [`${arg1} ${i.id}`] },
        effect: {
          type: arg1 === "ack" ? "ack-incident" : "resolve-incident",
          id: i.id,
        },
      };
    }
    if (arg1 === "open") {
      if (!rest2) return fail("incidents open <title>");
      return {
        result: { ok: true, lines: [`opened incident · ${rest2}`] },
        effect: { type: "open-incident", title: rest2 },
      };
    }
    return fail("incidents list | ack | resolve | open");
  }

  if (head === "page") {
    const op = findOp(ctx, rest);
    if (!op) return fail(`operator not found: ${rest}`);
    return {
      result: { ok: true, lines: [`paged ${op.id} ${op.name}`] },
      effect: { type: "page", id: op.id },
    };
  }

  if (head === "audit") {
    return ok(["open the audit view with: focus audit"]);
  }

  return fail(`unknown command: ${text}  (try help)`);
}

export function applyTick(
  snapshot: Snapshot,
  nodes: RemoteNode[],
  payments: Payment[],
): { snapshot: Snapshot; nodes: RemoteNode[]; extraPayment?: Payment } {
  const nextNodes = nodes.map((n) => {
    if (n.status === "rebooting") {
      return {
        ...n,
        cpu: clamp(n.cpu + 8, 5, 98),
        latencyMs: clamp(n.latencyMs + 12, 5, 240),
      };
    }
    if (n.status === "isolated") {
      return { ...n, sessions: 0, cpu: clamp(n.cpu * 0.92, 2, 100) };
    }
    const degraded = n.status === "degraded";
    return {
      ...n,
      latencyMs: Math.round(clamp(jitter(n.latencyMs, degraded ? 9 : 2), 5, 180)),
      cpu: Math.round(clamp(jitter(n.cpu, 3), 8, 96)),
      sessions: Math.max(0, n.sessions + (Math.random() < 0.2 ? (Math.random() < 0.5 ? -1 : 1) : 0)),
    };
  });

  const nextSnapshot: Snapshot = {
    ...snapshot,
    deposits: clamp(jitter(snapshot.deposits, 180_000), 2_100_000_000, 2_350_000_000),
    loansOutstanding: clamp(jitter(snapshot.loansOutstanding, 90_000), 16_800_000_000, 17_400_000_000),
    achToday: clamp(jitter(snapshot.achToday, 24_000), 80_000_000, 260_000_000),
    wiresPending: payments.filter((p) => p.kind === "WIRE" && (p.status === "queued" || p.status === "held")).length,
    fraudOpen: snapshot.fraudOpen,
    nodesOnline: nextNodes.filter((n) => n.status === "online").length,
  };

  let extraPayment: Payment | undefined;
  if (Math.random() < 0.08) {
    extraPayment = {
      id: `RTP-${uid("").slice(0, 6).toUpperCase()}`,
      kind: "RTP",
      amount: Math.round(jitter(18_000, 12_000)),
      from: "Inbound RTP",
      to: ACCOUNTS[Math.floor(Math.random() * ACCOUNTS.length)].dba,
      accountId: ACCOUNTS[Math.floor(Math.random() * ACCOUNTS.length)].id,
      status: "queued",
      submittedAt: Date.now(),
      memo: "Live inbound",
      rail: "RTP · instant",
    };
  }

  return { snapshot: nextSnapshot, nodes: nextNodes, extraPayment };
}

export function auditLine(actor: string, action: string, target: string, detail: string): AuditEvent {
  return {
    id: uid("AUD"),
    at: Date.now(),
    actor,
    action,
    target,
    detail,
  };
}

export function term(kind: TermLine["kind"], text: string): TermLine {
  return { id: uid("t"), kind, text };
}

export function toast(tone: Toast["tone"], text: string): Toast {
  return { id: uid("z"), tone, text };
}

export function initialSnapshot(): Snapshot {
  return {
    deposits: 2_210_000_000,
    loansOutstanding: 17_040_000_000,
    achToday: 186_400_000,
    wiresPending: 2,
    fraudOpen: 3,
    nodesOnline: NODES.filter((n) => n.status === "online").length,
    fdicCoverage: 3_000_000,
    businesses: 1_042_000,
  };
}
