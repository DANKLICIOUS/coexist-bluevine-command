export type ViewId =
  | "deck"
  | "treasury"
  | "rails"
  | "credit"
  | "risk"
  | "nodes"
  | "incidents"
  | "roster"
  | "terminal"
  | "audit";

export type Severity = "info" | "watch" | "critical";
export type PaymentKind = "ACH" | "WIRE" | "CHECK" | "RTP";
export type PaymentStatus = "queued" | "held" | "approved" | "rejected" | "settled";
export type NodeStatus = "online" | "degraded" | "isolated" | "rebooting";
export type IncidentStatus = "open" | "acked" | "resolved";
export type AccountStatus = "active" | "frozen" | "review";
export type CreditKind = "line" | "term";

export type Operator = {
  id: string;
  name: string;
  role: string;
  seat: string;
  shift: "alpha" | "bravo" | "night";
  status: "on-desk" | "remote" | "paged" | "offline";
  region: string;
};

export type Account = {
  id: string;
  legal: string;
  dba: string;
  city: string;
  state: string;
  deposits: number;
  apyPlan: "Standard" | "Plus" | "Premier";
  status: AccountStatus;
  risk: number;
  naics: string;
};

export type Payment = {
  id: string;
  kind: PaymentKind;
  amount: number;
  from: string;
  to: string;
  accountId: string;
  status: PaymentStatus;
  submittedAt: number;
  memo: string;
  rail: string;
};

export type CreditFacility = {
  id: string;
  accountId: string;
  legal: string;
  kind: CreditKind;
  limit: number;
  drawn: number;
  rate: number;
  status: "performing" | "watch" | "past-due";
};

export type Alert = {
  id: string;
  severity: Severity;
  title: string;
  detail: string;
  accountId?: string;
  createdAt: number;
  acked: boolean;
};

export type Incident = {
  id: string;
  title: string;
  severity: Severity;
  status: IncidentStatus;
  owner: string;
  openedAt: number;
  notes: string;
};

export type RemoteNode = {
  id: string;
  name: string;
  kind: "hq" | "cloud" | "edge" | "partner";
  city: string;
  lat: number;
  lon: number;
  status: NodeStatus;
  latencyMs: number;
  cpu: number;
  sessions: number;
};

export type AuditEvent = {
  id: string;
  at: number;
  actor: string;
  action: string;
  target: string;
  detail: string;
};

export type Toast = {
  id: string;
  tone: "ok" | "warn" | "bad";
  text: string;
};

export type TermLine = {
  id: string;
  kind: "in" | "out" | "sys" | "err";
  text: string;
};

export type CommandResult = {
  ok: boolean;
  lines: string[];
  navigate?: ViewId;
};

export type Snapshot = {
  deposits: number;
  loansOutstanding: number;
  achToday: number;
  wiresPending: number;
  fraudOpen: number;
  nodesOnline: number;
  fdicCoverage: number;
  businesses: number;
};
