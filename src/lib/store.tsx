import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from "react";
import {
  ACCOUNTS,
  ALERTS,
  CREDITS,
  DEMO_OPERATORS,
  INCIDENTS,
  NODES,
  PAYMENTS,
} from "./seed";
import {
  applyTick,
  auditLine,
  authenticate,
  initialSnapshot,
  parseCommand,
  term,
  toast,
  type CommandContext,
} from "./commands";
import { uid } from "./format";
import type {
  Account,
  Alert,
  AuditEvent,
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

const SESSION_KEY = "coexist.session";

type State = {
  operator: Operator | null;
  snapshot: Snapshot;
  accounts: Account[];
  payments: Payment[];
  credits: CreditFacility[];
  alerts: Alert[];
  incidents: Incident[];
  nodes: RemoteNode[];
  operators: Operator[];
  audit: AuditEvent[];
  toasts: Toast[];
  terminal: TermLine[];
  connectedNodeId: string | null;
  now: number;
};

type Action =
  | { type: "login"; operator: Operator }
  | { type: "logout" }
  | { type: "hydrate"; operator: Operator }
  | { type: "tick" }
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
  | { type: "finish-reboot"; id: string }
  | { type: "dismiss-toast"; id: string }
  | { type: "run"; raw: string };

function withAudit(state: State, action: string, target: string, detail: string): AuditEvent[] {
  const actor = state.operator?.id ?? "SYSTEM";
  return [auditLine(actor, action, target, detail), ...state.audit].slice(0, 80);
}

function withToast(state: State, tone: Toast["tone"], text: string): Toast[] {
  return [toast(tone, text), ...state.toasts].slice(0, 4);
}

function paymentById(state: State, id: string) {
  return state.payments.find((p) => p.id === id);
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "hydrate":
    case "login":
      return {
        ...state,
        operator: action.operator,
        terminal: [
          term("sys", `COEXIST uplink established · ${action.operator.id}`),
          term("sys", "type help · dual-control required on international wires"),
        ],
      };
    case "logout":
      return { ...state, operator: null, connectedNodeId: null };
    case "tick": {
      const { snapshot, nodes, extraPayment } = applyTick(state.snapshot, state.nodes, state.payments);
      const payments = extraPayment
        ? [extraPayment, ...state.payments].slice(0, 40)
        : state.payments;
      return {
        ...state,
        snapshot: {
          ...snapshot,
          fraudOpen: state.alerts.filter((a) => !a.acked && a.severity !== "info").length,
          wiresPending: payments.filter((p) => p.kind === "WIRE" && (p.status === "queued" || p.status === "held")).length,
        },
        nodes,
        payments,
        now: Date.now(),
      };
    }
    case "approve": {
      const p = paymentById(state, action.id);
      if (!p || p.status === "settled" || p.status === "rejected") return state;
      return {
        ...state,
        payments: state.payments.map((x) => (x.id === action.id ? { ...x, status: "approved" } : x)),
        audit: withAudit(state, "APPROVE", action.id, `${p.kind} ${p.amount} ${p.from} → ${p.to}`),
        toasts: withToast(state, "ok", `Released ${p.id}`),
      };
    }
    case "hold": {
      const p = paymentById(state, action.id);
      if (!p) return state;
      return {
        ...state,
        payments: state.payments.map((x) => (x.id === action.id ? { ...x, status: "held" } : x)),
        audit: withAudit(state, "HOLD", action.id, p.memo),
        toasts: withToast(state, "warn", `Held ${p.id}`),
      };
    }
    case "reject": {
      const p = paymentById(state, action.id);
      if (!p) return state;
      return {
        ...state,
        payments: state.payments.map((x) => (x.id === action.id ? { ...x, status: "rejected" } : x)),
        audit: withAudit(state, "REJECT", action.id, p.memo),
        toasts: withToast(state, "bad", `Rejected ${p.id}`),
      };
    }
    case "freeze": {
      const a = state.accounts.find((x) => x.id === action.id);
      if (!a) return state;
      return {
        ...state,
        accounts: state.accounts.map((x) => (x.id === action.id ? { ...x, status: "frozen" } : x)),
        payments: state.payments.map((p) =>
          p.accountId === action.id && (p.status === "queued" || p.status === "held")
            ? { ...p, status: "rejected" }
            : p,
        ),
        audit: withAudit(state, "FREEZE", action.id, a.legal),
        toasts: withToast(state, "bad", `Frozen ${a.dba}`),
      };
    }
    case "thaw": {
      const a = state.accounts.find((x) => x.id === action.id);
      if (!a) return state;
      return {
        ...state,
        accounts: state.accounts.map((x) => (x.id === action.id ? { ...x, status: "active" } : x)),
        audit: withAudit(state, "THAW", action.id, a.legal),
        toasts: withToast(state, "ok", `Thawed ${a.dba}`),
      };
    }
    case "ack-alert": {
      const alert = state.alerts.find((x) => x.id === action.id);
      if (!alert) return state;
      return {
        ...state,
        alerts: state.alerts.map((x) => (x.id === action.id ? { ...x, acked: true } : x)),
        audit: withAudit(state, "ACK", action.id, alert.title),
        toasts: withToast(state, "ok", `Acked ${alert.id}`),
      };
    }
    case "escalate-alert": {
      const alert = state.alerts.find((x) => x.id === action.id);
      if (!alert) return state;
      const incident: Incident = {
        id: `INC-${uid("").slice(0, 4).toUpperCase()}`,
        title: alert.title,
        severity: alert.severity,
        status: "open",
        owner: state.operator?.name ?? "Unassigned",
        openedAt: Date.now(),
        notes: `Escalated from ${alert.id}. ${alert.detail}`,
      };
      return {
        ...state,
        alerts: state.alerts.map((x) => (x.id === action.id ? { ...x, acked: true } : x)),
        incidents: [incident, ...state.incidents],
        audit: withAudit(state, "ESCALATE", action.id, incident.id),
        toasts: withToast(state, "warn", `Opened ${incident.id}`),
      };
    }
    case "ack-incident":
      return {
        ...state,
        incidents: state.incidents.map((i) =>
          i.id === action.id ? { ...i, status: "acked" } : i,
        ),
        audit: withAudit(state, "INC-ACK", action.id, ""),
        toasts: withToast(state, "ok", `Incident ${action.id} acknowledged`),
      };
    case "resolve-incident":
      return {
        ...state,
        incidents: state.incidents.map((i) =>
          i.id === action.id ? { ...i, status: "resolved" } : i,
        ),
        audit: withAudit(state, "INC-RESOLVE", action.id, ""),
        toasts: withToast(state, "ok", `Incident ${action.id} resolved`),
      };
    case "open-incident": {
      const incident: Incident = {
        id: `INC-${uid("").slice(0, 4).toUpperCase()}`,
        title: action.title,
        severity: "watch",
        status: "open",
        owner: state.operator?.name ?? "Unassigned",
        openedAt: Date.now(),
        notes: "Opened from command deck.",
      };
      return {
        ...state,
        incidents: [incident, ...state.incidents],
        audit: withAudit(state, "INC-OPEN", incident.id, action.title),
        toasts: withToast(state, "warn", `Opened ${incident.id}`),
      };
    }
    case "connect":
      return {
        ...state,
        connectedNodeId: action.id,
        nodes: state.nodes.map((n) =>
          n.id === action.id ? { ...n, sessions: n.sessions + 1 } : n,
        ),
        audit: withAudit(state, "CONNECT", action.id, "remote session"),
        toasts: withToast(state, "ok", `Attached ${action.id}`),
      };
    case "reboot":
      return {
        ...state,
        nodes: state.nodes.map((n) =>
          n.id === action.id ? { ...n, status: "rebooting", sessions: 0 } : n,
        ),
        connectedNodeId: state.connectedNodeId === action.id ? null : state.connectedNodeId,
        audit: withAudit(state, "REBOOT", action.id, "soft bounce"),
        toasts: withToast(state, "warn", `Rebooting ${action.id}`),
      };
    case "finish-reboot":
      return {
        ...state,
        nodes: state.nodes.map((n) =>
          n.id === action.id ? { ...n, status: "online", latencyMs: 18, cpu: 22 } : n,
        ),
        toasts: withToast(state, "ok", `${action.id} back online`),
      };
    case "isolate":
      return {
        ...state,
        nodes: state.nodes.map((n) =>
          n.id === action.id ? { ...n, status: "isolated", sessions: 0 } : n,
        ),
        connectedNodeId: state.connectedNodeId === action.id ? null : state.connectedNodeId,
        audit: withAudit(state, "ISOLATE", action.id, "traffic shed"),
        toasts: withToast(state, "bad", `Isolated ${action.id}`),
      };
    case "restore":
      return {
        ...state,
        nodes: state.nodes.map((n) =>
          n.id === action.id ? { ...n, status: "online" } : n,
        ),
        audit: withAudit(state, "RESTORE", action.id, "returned to pool"),
        toasts: withToast(state, "ok", `Restored ${action.id}`),
      };
    case "page":
      return {
        ...state,
        operators: state.operators.map((o) =>
          o.id === action.id ? { ...o, status: "paged" } : o,
        ),
        audit: withAudit(state, "PAGE", action.id, "on-call"),
        toasts: withToast(state, "warn", `Paged ${action.id}`),
      };
    case "dismiss-toast":
      return { ...state, toasts: state.toasts.filter((t) => t.id !== action.id) };
    case "run": {
      if (!state.operator) return state;
      const ctx: CommandContext = {
        actor: state.operator,
        snapshot: state.snapshot,
        accounts: state.accounts,
        payments: state.payments,
        credits: state.credits,
        alerts: state.alerts,
        incidents: state.incidents,
        nodes: state.nodes,
        operators: state.operators,
        connectedNodeId: state.connectedNodeId,
      };
      const parsed = parseCommand(action.raw, ctx);
      let next: State = {
        ...state,
        terminal: [
          term("in", `› ${action.raw}`),
          ...parsed.result.lines.map((line) => term(parsed.result.ok ? "out" : "err", line)),
          ...state.terminal,
        ].slice(0, 200),
      };

      const effect = parsed.effect;
      if (effect.type === "clear") {
        next = {
          ...next,
          terminal: [term("sys", "buffer cleared")],
        };
      } else if (effect.type !== "none") {
        next = reducer(next, effect as Action);
      }
      return next;
    }
    default:
      return state;
  }
}

function blank(): State {
  return {
    operator: null,
    snapshot: initialSnapshot(),
    accounts: ACCOUNTS.map((a) => ({ ...a })),
    payments: PAYMENTS.map((p) => ({ ...p })),
    credits: CREDITS.map((c) => ({ ...c })),
    alerts: ALERTS.map((a) => ({ ...a })),
    incidents: INCIDENTS.map((i) => ({ ...i })),
    nodes: NODES.map((n) => ({ ...n })),
    operators: DEMO_OPERATORS.map((o) => ({ ...o })),
    audit: [
      auditLine("SYSTEM", "BOOT", "COEXIST", "Bluevine remote command center online"),
    ],
    toasts: [],
    terminal: [],
    connectedNodeId: null,
    now: Date.now(),
  };
}

type Store = State & {
  login: (handle: string, key: string) => boolean;
  logout: () => void;
  run: (raw: string, navigate?: (v: ViewId) => void) => void;
  dispatch: (action: Exclude<Action, { type: "run" } | { type: "tick" } | { type: "hydrate" }>) => void;
};

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, blank);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return;
    const op = DEMO_OPERATORS.find((o) => o.id === raw);
    if (op) dispatch({ type: "hydrate", operator: op });
  }, []);

  useEffect(() => {
    if (!state.operator) return;
    const id = window.setInterval(() => dispatch({ type: "tick" }), 1600);
    return () => window.clearInterval(id);
  }, [state.operator]);

  const rebootKey = state.nodes
    .filter((n) => n.status === "rebooting")
    .map((n) => n.id)
    .join(",");

  useEffect(() => {
    if (!rebootKey) return;
    const timers = rebootKey.split(",").map((id) =>
      window.setTimeout(() => dispatch({ type: "finish-reboot", id }), 4200),
    );
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [rebootKey]);

  useEffect(() => {
    if (!state.toasts.length) return;
    const timers = state.toasts.map((t) =>
      window.setTimeout(() => dispatch({ type: "dismiss-toast", id: t.id }), 4200),
    );
    return () => timers.forEach((x) => window.clearTimeout(x));
  }, [state.toasts]);

  const login = useCallback((handle: string, key: string) => {
    const op = authenticate(handle, key);
    if (!op) return false;
    sessionStorage.setItem(SESSION_KEY, op.id);
    dispatch({ type: "login", operator: op });
    return true;
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    dispatch({ type: "logout" });
  }, []);

  const run = useCallback((raw: string, navigate?: (v: ViewId) => void) => {
    const current = stateRef.current;
    if (!current.operator) return;
    const parsed = parseCommand(raw, {
      actor: current.operator,
      snapshot: current.snapshot,
      accounts: current.accounts,
      payments: current.payments,
      credits: current.credits,
      alerts: current.alerts,
      incidents: current.incidents,
      nodes: current.nodes,
      operators: current.operators,
      connectedNodeId: current.connectedNodeId,
    });
    if (parsed.result.navigate) navigate?.(parsed.result.navigate);
    dispatch({ type: "run", raw });
  }, []);

  const value = useMemo<Store>(
    () => ({ ...state, login, logout, run, dispatch }),
    [state, login, logout, run],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("Store missing");
  return ctx;
}
