import { describe, expect, it } from "vitest";
import { authenticate, initialSnapshot, parseCommand, type CommandContext } from "./commands";
import { ACCOUNTS, ALERTS, CREDITS, DEMO_OPERATORS, INCIDENTS, NODES, PAYMENTS } from "./seed";

function ctx(): CommandContext {
  return {
    actor: DEMO_OPERATORS[0],
    snapshot: initialSnapshot(),
    accounts: ACCOUNTS,
    payments: PAYMENTS,
    credits: CREDITS,
    alerts: ALERTS,
    incidents: INCIDENTS,
    nodes: NODES,
    operators: DEMO_OPERATORS,
    connectedNodeId: null,
  };
}

describe("authenticate", () => {
  it("accepts a known operator with the coexist key", () => {
    expect(authenticate("BV-OPS-01", "coexist")?.name).toBe("Mara Voss");
    expect(authenticate("mara", "coexist")?.id).toBe("BV-OPS-01");
  });

  it("rejects a bad key", () => {
    expect(authenticate("BV-OPS-01", "wrong")).toBeNull();
  });
});

describe("parseCommand", () => {
  it("prints help", () => {
    const parsed = parseCommand("help", ctx());
    expect(parsed.result.ok).toBe(true);
    expect(parsed.result.lines[0]).toMatch(/COEXIST/);
  });

  it("approves a held wire", () => {
    const parsed = parseCommand("rails approve WIR-118304", ctx());
    expect(parsed.result.ok).toBe(true);
    expect(parsed.effect).toEqual({ type: "approve", id: "WIR-118304" });
  });

  it("freezes an account by DBA", () => {
    const parsed = parseCommand("accounts freeze kite", ctx());
    expect(parsed.effect).toEqual({ type: "freeze", id: "BV-774001" });
  });

  it("connects a remote node", () => {
    const parsed = parseCommand("nodes connect DEN-EDGE", ctx());
    expect(parsed.result.navigate).toBe("nodes");
    expect(parsed.effect).toEqual({ type: "connect", id: "DEN-EDGE" });
  });

  it("focuses a view", () => {
    const parsed = parseCommand("focus rails", ctx());
    expect(parsed.result.navigate).toBe("rails");
  });

  it("rejects unknown commands", () => {
    const parsed = parseCommand("explode everything", ctx());
    expect(parsed.result.ok).toBe(false);
  });

  it("pages an operator", () => {
    const parsed = parseCommand("page BV-OPS-07", ctx());
    expect(parsed.effect).toEqual({ type: "page", id: "BV-OPS-07" });
  });
});
