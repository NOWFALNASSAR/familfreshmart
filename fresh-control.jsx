import React, { useState, useEffect, useMemo, useRef } from "react";

/* ==========================================================================
   FRESH CONTROL — Family Fresh Mart retail control system (working prototype)
   Money-in / money-out / day closing. No item-wise stock (V1 rules).
   Data is saved with the artifact storage API, so entries survive reload.
   ========================================================================== */

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Archivo:wght@500;600;800&family=Archivo+Narrow:wght@600;700&family=IBM+Plex+Mono:wght@400;600&display=swap');
.fc *{box-sizing:border-box}
.fc{
  --ink:#0E1F1B; --board:#16302A; --raise:#1D3C34; --line:#2C5348;
  --chalk:#EAF2EC; --muted:#8FAEA2; --mango:#F5A83C; --beet:#D4567B; --leaf:#6FD09B;
  --disp:'Archivo Narrow','Archivo',system-ui,sans-serif;
  --body:'Archivo',system-ui,-apple-system,sans-serif;
  --mono:'IBM Plex Mono',ui-monospace,monospace;
  background:var(--ink); color:var(--chalk); font-family:var(--body);
  min-height:100vh; width:100%; -webkit-font-smoothing:antialiased;
}
.fc button{font-family:var(--body); cursor:pointer; border:none; background:none; color:inherit}
.fc input,.fc select,.fc textarea{
  font-family:var(--body); width:100%; background:var(--ink); color:var(--chalk);
  border:1px solid var(--line); border-radius:10px; padding:13px 14px; font-size:16px; outline:none;
}
.fc input:focus,.fc select:focus,.fc textarea:focus{border-color:var(--mango)}
.fc :focus-visible{outline:2px solid var(--mango); outline-offset:2px}
.wrap{max-width:820px;margin:0 auto;padding:0 16px 110px}
.bar{position:sticky;top:0;z-index:20;background:var(--ink);border-bottom:1px solid var(--line);
  padding:14px 16px;display:flex;align-items:center;gap:12px}
.brand{font-family:var(--disp);font-weight:700;letter-spacing:.06em;text-transform:uppercase;font-size:15px}
.brand span{color:var(--mango)}
.sub{font-size:11px;color:var(--muted);letter-spacing:.12em;text-transform:uppercase}
.card{background:var(--board);border:1px solid var(--line);border-radius:14px;padding:16px;margin-top:12px}
.rowb{display:flex;justify-content:space-between;align-items:baseline;gap:10px;padding:9px 0}
.rowb + .rowb{border-top:1px dashed var(--line)}
.k{font-size:13px;color:var(--muted)}
.v{font-family:var(--mono);font-size:15px;font-variant-numeric:tabular-nums}
.big{font-family:var(--disp);font-weight:700;font-size:34px;line-height:1;font-variant-numeric:tabular-nums}
.lbl{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);margin-bottom:7px;display:block}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.tile{background:var(--raise);border:1px solid var(--line);border-radius:14px;padding:14px 12px;text-align:left}
.tile b{display:block;font-family:var(--disp);font-size:16px;font-weight:700;letter-spacing:.02em}
.tile em{font-style:normal;font-size:11px;color:var(--muted)}
.btn{background:var(--mango);color:#20130A;font-weight:700;border-radius:12px;padding:15px;width:100%;font-size:16px}
.btn.ghost{background:transparent;color:var(--chalk);border:1px solid var(--line);font-weight:600}
.btn.danger{background:var(--beet);color:#2A0B15}
.btn:disabled{opacity:.45}
.tabs{display:flex;gap:6px;overflow-x:auto;padding:12px 0 2px;scrollbar-width:none}
.tabs::-webkit-scrollbar{display:none}
.tab{white-space:nowrap;padding:8px 13px;border-radius:999px;border:1px solid var(--line);font-size:13px;color:var(--muted)}
.tab.on{background:var(--chalk);color:var(--ink);border-color:var(--chalk);font-weight:700}
.nav{position:fixed;bottom:0;left:0;right:0;background:var(--board);border-top:1px solid var(--line);
  display:flex;justify-content:space-around;padding:9px 4px calc(9px + env(safe-area-inset-bottom));z-index:30}
.nav button{font-size:10px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);
  display:flex;flex-direction:column;align-items:center;gap:4px;flex:1;padding:4px}
.nav button.on{color:var(--mango)}
.nav i{font-style:normal;font-size:18px}
.sheet{position:fixed;inset:0;background:rgba(6,16,13,.72);z-index:50;display:flex;align-items:flex-end;justify-content:center}
.sheetin{background:var(--board);border-radius:18px 18px 0 0;width:100%;max-width:820px;max-height:94vh;
  overflow:auto;padding:18px 16px calc(24px + env(safe-area-inset-bottom));border-top:3px solid var(--mango)}
.f{margin-bottom:14px}
.pill{font-family:var(--mono);font-size:11px;padding:3px 8px;border-radius:999px;border:1px solid var(--line);color:var(--muted)}
.pill.in{color:var(--leaf);border-color:#2F6B4E}
.pill.out{color:var(--beet);border-color:#6B2F45}
.item{display:flex;justify-content:space-between;gap:10px;padding:12px 0;border-bottom:1px solid var(--line);align-items:center}
.item small{color:var(--muted);font-size:12px;display:block;margin-top:3px}
.empty{color:var(--muted);font-size:14px;padding:26px 4px;line-height:1.6}
.den{display:grid;grid-template-columns:64px 1fr 96px;gap:8px;align-items:center;margin-bottom:8px}
.den b{font-family:var(--mono);font-size:14px}
.den .amt{font-family:var(--mono);font-size:14px;text-align:right;color:var(--muted)}
.diff{font-family:var(--disp);font-size:28px;font-weight:700}
.warn{background:#3A2412;border:1px solid #6B4A1E;color:#F5C77E;border-radius:12px;padding:12px;font-size:13px;line-height:1.5;margin-top:12px}
.toast{position:fixed;left:50%;transform:translateX(-50%);bottom:86px;background:var(--chalk);color:var(--ink);
  font-weight:700;padding:11px 18px;border-radius:999px;z-index:60;font-size:14px;box-shadow:0 8px 26px rgba(0,0,0,.4)}
@media (prefers-reduced-motion:no-preference){.sheetin{animation:up .22s ease}@keyframes up{from{transform:translateY(24px)}}}
`;

/* ----------------------------- storage ---------------------------------- */
const KEY = "ffm:db:v1";
const seed = () => ({
  settings: { company: "Family Fresh Mart", gpMethod: "markup", gpRate: 12, lowCashAlert: 1000 },
  branches: [{ id: "b1", name: "Mavinchuvadu", code: "MVC" }],
  users: [
    { id: "u1", name: "Nowfal", role: "OWNER", pin: "1111" },
    { id: "u2", name: "Manager", role: "MANAGER", pin: "2222" },
    { id: "u3", name: "Cashier", role: "CASHIER", pin: "3333" },
  ],
  parties: [
    { id: "c0", kind: "customer", name: "Walk-in customer", phone: "", opening: 0 },
  ],
  cats: ["Transport", "Salary", "Rent", "Electricity", "Loading", "Packing", "Maintenance", "Petty cash", "Other"],
  txns: [],
  closings: [],
  audit: [],
});

async function loadDB() {
  try {
    const r = await window.storage.get(KEY);
    return r ? JSON.parse(r.value) : seed();
  } catch { return seed(); }
}

/* ----------------------------- helpers ---------------------------------- */
const today = () => new Date().toISOString().slice(0, 10);
const money = (n) => "₹" + Math.round(n || 0).toLocaleString("en-IN");
const dshow = (d) => new Date(d + "T00:00:00").toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
const uid = () => Math.random().toString(36).slice(2, 10);
const MODES = ["cash", "upi", "card", "bank", "credit"];
const DENOMS = [500, 200, 100, 50, 20, 10, 5, 2, 1];

const CASH_IN = { sale: 1, customer_collection: 1, cash_in: 1 };
const CASH_OUT = { purchase: 1, supplier_payment: 1, expense: 1, cash_out: 1 };
const cashEffect = (t) =>
  t.mode !== "cash" ? 0 : CASH_IN[t.type] ? t.amount : CASH_OUT[t.type] ? -t.amount : 0;

const TYPE_LABEL = {
  sale: "Sale", purchase: "Purchase", supplier_payment: "Supplier payment",
  customer_collection: "Customer collection", expense: "Expense", cash_in: "Cash in", cash_out: "Cash out",
};

/* ================================ APP ==================================== */
export default function App() {
  const [db, setDb] = useState(null);
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("home");
  const [sheet, setSheet] = useState(null);
  const [toast, setToast] = useState("");
  const [date, setDate] = useState(today());
  const branch = db?.branches[0];
  const saveT = useRef(null);

  useEffect(() => { loadDB().then(setDb); }, []);

  useEffect(() => {
    if (!db) return;
    clearTimeout(saveT.current);
    saveT.current = setTimeout(async () => {
      try { await window.storage.set(KEY, JSON.stringify(db)); }
      catch { setToast("Not saved — storage unavailable"); }
    }, 400);
  }, [db]);

  const say = (m) => { setToast(m); setTimeout(() => setToast(""), 1900); };

  const closing = useMemo(
    () => db?.closings.find((c) => c.date === date && c.branchId === branch?.id),
    [db, date, branch]
  );
  const dayLocked = closing?.status === "CLOSED";

  const addTxn = (t) => {
    if (db.closings.some((c) => c.date === t.date && c.status === "CLOSED"))
      return say("That day is closed. Reopen it first.");
    setDb((d) => ({
      ...d,
      txns: [{ id: uid(), branchId: branch.id, by: user.name, createdAt: Date.now(), ...t }, ...d.txns],
      audit: [{ id: uid(), at: Date.now(), who: user.name, what: `Added ${TYPE_LABEL[t.type]} ${money(t.amount)}` }, ...d.audit],
    }));
    setSheet(null);
    say(TYPE_LABEL[t.type] + " saved");
  };

  const delTxn = (id) => {
    const t = db.txns.find((x) => x.id === id);
    setDb((d) => ({
      ...d,
      txns: d.txns.filter((x) => x.id !== id),
      audit: [{ id: uid(), at: Date.now(), who: user.name, what: `Deleted ${TYPE_LABEL[t.type]} ${money(t.amount)} of ${dshow(t.date)}` }, ...d.audit],
    }));
    say("Entry deleted");
  };

  if (!db) return <div className="fc"><style>{CSS}</style><div className="wrap" style={{ paddingTop: 60 }}><p className="empty">Loading…</p></div></div>;
  if (!user) return <Login db={db} onIn={setUser} />;

  const dayTx = db.txns.filter((t) => t.date === date);
  const sum = (type, mode) =>
    dayTx.filter((t) => t.type === type && (!mode || t.mode === mode)).reduce((a, b) => a + b.amount, 0);

  const sales = sum("sale"), purch = sum("purchase"), exp = sum("expense");
  const opGP = sales - purch;
  const gpPct = sales ? (opGP / sales) * 100 : 0;
  const targetSales = db.settings.gpMethod === "markup"
    ? purch * (1 + db.settings.gpRate / 100)
    : purch / (1 - db.settings.gpRate / 100);

  const openingCash = (() => {
    const prev = [...db.closings].filter((c) => c.date < date && c.branchId === branch.id).sort((a, b) => (a.date < b.date ? 1 : -1))[0];
    return prev ? prev.actual : 0;
  })();
  const movement = dayTx.reduce((a, t) => a + cashEffect(t), 0);
  const expectedCash = openingCash + movement;

  const ctx = { db, setDb, user, branch, date, addTxn, delTxn, say, dayTx, dayLocked,
    sales, purch, exp, opGP, gpPct, targetSales, openingCash, expectedCash, closing, setSheet, sum };

  return (
    <div className="fc">
      <style>{CSS}</style>

      <header className="bar">
        <div style={{ flex: 1 }}>
          <div className="brand">Family Fresh <span>Mart</span></div>
          <div className="sub">{branch.name} · {user.role.toLowerCase()} · {user.name}</div>
        </div>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
          style={{ width: 158, padding: "9px 10px", fontSize: 13 }} />
      </header>

      <div className="wrap">
        {tab === "home" && <Home {...ctx} />}
        {tab === "entry" && <Entry {...ctx} />}
        {tab === "parties" && <Parties {...ctx} />}
        {tab === "close" && <DayClose {...ctx} setDate={setDate} />}
        {tab === "reports" && <Reports {...ctx} setDate={setDate} />}
      </div>

      <nav className="nav">
        {[["home", "▤", "Today"], ["entry", "＋", "Entry"], ["close", "🔒", "Day end"],
          ["parties", "👥", "Parties"], ["reports", "📑", "Reports"]].map(([id, ic, lb]) => (
          <button key={id} className={tab === id ? "on" : ""} onClick={() => setTab(id)} aria-label={lb}>
            <i>{ic}</i>{lb}
          </button>
        ))}
      </nav>

      {sheet && <Sheet ctx={ctx} kind={sheet} close={() => setSheet(null)} />}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

/* ------------------------------- login ---------------------------------- */
function Login({ db, onIn }) {
  const [sel, setSel] = useState(db.users[0].id);
  const [pin, setPin] = useState("");
  const [err, setErr] = useState("");
  const go = () => {
    const u = db.users.find((x) => x.id === sel);
    if (u.pin === pin) onIn(u);
    else setErr("Wrong PIN. Try again.");
  };
  return (
    <div className="fc"><style>{CSS}</style>
      <div className="wrap" style={{ paddingTop: 70, maxWidth: 400 }}>
        <div className="brand" style={{ fontSize: 26 }}>Family Fresh <span>Mart</span></div>
        <div className="sub" style={{ marginTop: 8 }}>Retail control system</div>
        <div className="card" style={{ marginTop: 26 }}>
          <div className="f">
            <label className="lbl">Who is working?</label>
            <select value={sel} onChange={(e) => { setSel(e.target.value); setErr(""); }}>
              {db.users.map((u) => <option key={u.id} value={u.id}>{u.name} — {u.role}</option>)}
            </select>
          </div>
          <div className="f">
            <label className="lbl">PIN</label>
            <input type="password" inputMode="numeric" value={pin} placeholder="4 digits"
              onChange={(e) => { setPin(e.target.value); setErr(""); }}
              onKeyDown={(e) => e.key === "Enter" && go()} />
          </div>
          {err && <div className="warn">{err}</div>}
          <button className="btn" onClick={go} style={{ marginTop: 6 }}>Sign in</button>
          <p className="empty" style={{ padding: "16px 0 0", fontSize: 12 }}>
            Demo PINs — Owner 1111, Manager 2222, Cashier 3333. Change these in Settings before real use.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------- today ---------------------------------- */
function Home(c) {
  const cashOnly = (type) => c.dayTx.filter((t) => t.type === type && t.mode === "cash").reduce((a, b) => a + b.amount, 0);
  return (
    <>
      <div className="card">
        <span className="lbl">Sales · {dshow(c.date)}</span>
        <div className="big" style={{ color: "var(--mango)" }}>{money(c.sales)}</div>
        <div className="rowb" style={{ marginTop: 10 }}>
          <span className="k">Purchase</span><span className="v">{money(c.purch)}</span></div>
        <div className="rowb"><span className="k">Operational GP</span>
          <span className="v" style={{ color: c.opGP >= 0 ? "var(--leaf)" : "var(--beet)" }}>{money(c.opGP)}</span></div>
        <div className="rowb"><span className="k">GP %</span><span className="v">{c.gpPct.toFixed(2)}%</span></div>
        <div className="rowb"><span className="k">Sales needed for {c.db.settings.gpRate}% {c.db.settings.gpMethod}</span>
          <span className="v">{money(c.targetSales)}</span></div>
        <div className="rowb"><span className="k">Expenses</span><span className="v">{money(c.exp)}</span></div>
      </div>

      <div className="card">
        <span className="lbl">Cash position</span>
        <div className="rowb"><span className="k">Opening cash</span><span className="v">{money(c.openingCash)}</span></div>
        <div className="rowb"><span className="k">Cash sales</span><span className="v">+{money(cashOnly("sale"))}</span></div>
        <div className="rowb"><span className="k">Collections</span><span className="v">+{money(cashOnly("customer_collection"))}</span></div>
        <div className="rowb"><span className="k">Supplier payments</span><span className="v">−{money(cashOnly("supplier_payment"))}</span></div>
        <div className="rowb"><span className="k">Cash expenses</span><span className="v">−{money(cashOnly("expense"))}</span></div>
        <div className="rowb"><span className="k">Cash purchases</span><span className="v">−{money(cashOnly("purchase"))}</span></div>
        <div className="rowb"><b className="k" style={{ color: "var(--chalk)" }}>Expected in drawer</b>
          <b className="v" style={{ fontSize: 19 }}>{money(c.expectedCash)}</b></div>
        {c.closing && <div className="rowb"><span className="k">Counted</span>
          <span className="v">{money(c.closing.actual)} ({c.closing.actual - c.closing.expected >= 0 ? "+" : ""}{money(c.closing.actual - c.closing.expected)})</span></div>}
      </div>

      <div className="card">
        <span className="lbl">Entries today · {c.dayTx.length}</span>
        {c.dayTx.length === 0
          ? <p className="empty">Nothing recorded yet. Tap Entry below to add the first sale or purchase.</p>
          : c.dayTx.slice(0, 8).map((t) => <TxRow key={t.id} t={t} c={c} />)}
      </div>
    </>
  );
}

function TxRow({ t, c }) {
  const party = c.db.parties.find((p) => p.id === t.partyId);
  const inflow = CASH_IN[t.type];
  return (
    <div className="item">
      <div>
        <b style={{ fontSize: 14 }}>{TYPE_LABEL[t.type]}</b>
        <small>{party ? party.name : t.cat || "—"} · {t.mode}{t.ref ? " · " + t.ref : ""} · by {t.by}</small>
      </div>
      <div style={{ textAlign: "right", display: "flex", alignItems: "center", gap: 10 }}>
        <span className="v" style={{ color: inflow ? "var(--leaf)" : "var(--beet)" }}>
          {inflow ? "+" : "−"}{money(t.amount)}</span>
        {!c.dayLocked && c.user.role !== "CASHIER" &&
          <button onClick={() => c.delTxn(t.id)} className="pill out" style={{ padding: "4px 8px" }}>del</button>}
      </div>
    </div>
  );
}

/* ------------------------------- entry ---------------------------------- */
function Entry(c) {
  const buttons = [
    ["sale", "Sale", "Money coming in"],
    ["purchase", "Purchase", "Goods bought"],
    ["customer_collection", "Collection", "Credit customer paid"],
    ["supplier_payment", "Supplier payment", "You paid a supplier"],
    ["expense", "Expense", "Transport, salary, rent…"],
    ["cash_in", "Cash in", "Owner deposit"],
    ["cash_out", "Cash out", "Bank drop, withdrawal"],
    ["party", "Add supplier / customer", "New name in the book"],
  ];
  return (
    <>
      {c.dayLocked && <div className="warn">{dshow(c.date)} is closed. Reopen it from Day end before adding entries.</div>}
      <div className="grid2" style={{ marginTop: 12 }}>
        {buttons.map(([id, t, s]) => (
          <button key={id} className="tile" onClick={() => c.setSheet(id)}>
            <b>{t}</b><em>{s}</em>
          </button>
        ))}
      </div>
    </>
  );
}

/* ------------------------------- sheets --------------------------------- */
function Sheet({ ctx, kind, close }) {
  if (kind === "party") return <PartyForm ctx={ctx} close={close} />;
  return <TxnForm ctx={ctx} type={kind} close={close} />;
}

function TxnForm({ ctx, type, close }) {
  const needsParty = ["sale", "purchase", "supplier_payment", "customer_collection"].includes(type);
  const partyKind = ["purchase", "supplier_payment"].includes(type) ? "supplier" : "customer";
  const list = ctx.db.parties.filter((p) => p.kind === partyKind);
  const forcedCash = ["cash_in", "cash_out"].includes(type);

  const [partyId, setPartyId] = useState(list[0]?.id || "");
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState(forcedCash ? "cash" : type === "sale" ? "cash" : "credit");
  const [cat, setCat] = useState(ctx.db.cats[0]);
  const [ref, setRef] = useState("");
  const [remarks, setRemarks] = useState("");

  const out = useMemo(() => outstanding(ctx.db, partyId), [ctx.db, partyId]);
  const amt = parseFloat(amount) || 0;
  const ok = amt > 0 && (!needsParty || partyId);

  const save = () => ctx.addTxn({
    type, date: ctx.date, partyId: needsParty ? partyId : null,
    amount: amt, mode, cat: type === "expense" ? cat : null, ref, remarks,
  });

  return (
    <div className="sheet" onClick={close}>
      <div className="sheetin" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div><div className="brand" style={{ fontSize: 18 }}>{TYPE_LABEL[type]}</div>
            <div className="sub">{dshow(ctx.date)} · {ctx.branch.name}</div></div>
          <button className="pill" onClick={close}>Close</button>
        </div>

        {needsParty && (
          <div className="f">
            <label className="lbl">{partyKind === "supplier" ? "Supplier" : "Customer"}</label>
            <select value={partyId} onChange={(e) => setPartyId(e.target.value)}>
              {list.length === 0 && <option value="">Add a {partyKind} first</option>}
              {list.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            {partyId !== "" && <p className="k" style={{ marginTop: 8 }}>
              Outstanding now <span className="v">{money(out)}</span>
              {["supplier_payment", "customer_collection"].includes(type) && amt > 0 &&
                <> → after this <span className="v">{money(out - amt)}</span></>}
            </p>}
          </div>
        )}

        {type === "expense" && (
          <div className="f"><label className="lbl">Category</label>
            <select value={cat} onChange={(e) => setCat(e.target.value)}>
              {ctx.db.cats.map((x) => <option key={x}>{x}</option>)}
            </select></div>
        )}

        <div className="f">
          <label className="lbl">Amount</label>
          <input inputMode="decimal" autoFocus value={amount} placeholder="0"
            onChange={(e) => setAmount(e.target.value)}
            style={{ fontFamily: "var(--mono)", fontSize: 26, padding: "16px 14px" }} />
        </div>

        {!forcedCash && (
          <div className="f"><label className="lbl">Payment mode</label>
            <div className="tabs" style={{ padding: 0 }}>
              {MODES.map((m) => (
                <button key={m} className={"tab" + (mode === m ? " on" : "")} onClick={() => setMode(m)}>{m}</button>
              ))}
            </div></div>
        )}

        <div className="grid2">
          <div className="f"><label className="lbl">Reference no</label>
            <input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="Bill / voucher" /></div>
          <div className="f"><label className="lbl">Remarks</label>
            <input value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Optional" /></div>
        </div>

        <button className="btn" disabled={!ok} onClick={save}>Save {TYPE_LABEL[type].toLowerCase()}</button>
      </div>
    </div>
  );
}

function PartyForm({ ctx, close }) {
  const [kind, setKind] = useState("supplier");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [opening, setOpening] = useState("");
  const save = () => {
    ctx.setDb((d) => ({ ...d, parties: [...d.parties, { id: uid(), kind, name: name.trim(), phone, opening: parseFloat(opening) || 0 }] }));
    ctx.say(name.trim() + " added");
    close();
  };
  return (
    <div className="sheet" onClick={close}>
      <div className="sheetin" onClick={(e) => e.stopPropagation()}>
        <div className="brand" style={{ fontSize: 18, marginBottom: 16 }}>New name</div>
        <div className="f"><label className="lbl">Type</label>
          <div className="tabs" style={{ padding: 0 }}>
            {["supplier", "customer"].map((k) => (
              <button key={k} className={"tab" + (kind === k ? " on" : "")} onClick={() => setKind(k)}>{k}</button>))}
          </div></div>
        <div className="f"><label className="lbl">Name</label>
          <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. ABC Vegetables" /></div>
        <div className="grid2">
          <div className="f"><label className="lbl">Phone</label>
            <input inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
          <div className="f"><label className="lbl">Opening balance</label>
            <input inputMode="decimal" value={opening} onChange={(e) => setOpening(e.target.value)} placeholder="0" /></div>
        </div>
        <button className="btn" disabled={!name.trim()} onClick={save}>Add {kind}</button>
      </div>
    </div>
  );
}

/* ------------------------------ parties --------------------------------- */
function outstanding(db, partyId) {
  const p = db.parties.find((x) => x.id === partyId);
  if (!p) return 0;
  let bal = p.opening || 0;
  db.txns.filter((t) => t.partyId === partyId).forEach((t) => {
    if (t.type === "purchase" && t.mode === "credit") bal += t.amount;
    if (t.type === "supplier_payment") bal -= t.amount;
    if (t.type === "sale" && t.mode === "credit") bal += t.amount;
    if (t.type === "customer_collection") bal -= t.amount;
  });
  return bal;
}

function Parties(c) {
  const [kind, setKind] = useState("supplier");
  const [open, setOpen] = useState(null);
  const list = c.db.parties.filter((p) => p.kind === kind);
  const total = list.reduce((a, p) => a + outstanding(c.db, p.id), 0);

  if (open) {
    const p = c.db.parties.find((x) => x.id === open);
    const rows = c.db.txns.filter((t) => t.partyId === open).sort((a, b) => (a.date < b.date ? 1 : -1));
    return (
      <>
        <button className="pill" style={{ marginTop: 14 }} onClick={() => setOpen(null)}>← Back</button>
        <div className="card">
          <span className="lbl">{p.kind} ledger</span>
          <div className="brand" style={{ fontSize: 20 }}>{p.name}</div>
          <div className="rowb" style={{ marginTop: 12 }}><span className="k">Opening</span><span className="v">{money(p.opening)}</span></div>
          <div className="rowb"><b className="k" style={{ color: "var(--chalk)" }}>Balance</b>
            <b className="v" style={{ fontSize: 19 }}>{money(outstanding(c.db, open))}</b></div>
        </div>
        <div className="card">
          <span className="lbl">Transactions</span>
          {rows.length === 0 ? <p className="empty">No entries yet.</p> : rows.map((t) => (
            <div className="item" key={t.id}>
              <div><b style={{ fontSize: 14 }}>{TYPE_LABEL[t.type]}</b><small>{dshow(t.date)} · {t.mode}{t.ref ? " · " + t.ref : ""}</small></div>
              <span className="v">{money(t.amount)}</span>
            </div>
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      <div className="tabs">
        {["supplier", "customer"].map((k) => (
          <button key={k} className={"tab" + (kind === k ? " on" : "")} onClick={() => setKind(k)}>
            {k === "supplier" ? "Suppliers — payable" : "Customers — receivable"}</button>))}
      </div>
      <div className="card">
        <span className="lbl">Total {kind === "supplier" ? "payable" : "receivable"}</span>
        <div className="big">{money(total)}</div>
      </div>
      <div className="card">
        {list.length === 0 ? <p className="empty">No {kind}s yet. Add one from Entry → Add supplier / customer.</p> :
          list.map((p) => (
            <button key={p.id} className="item" style={{ width: "100%", textAlign: "left" }} onClick={() => setOpen(p.id)}>
              <div><b style={{ fontSize: 15 }}>{p.name}</b><small>{p.phone || "no phone"}</small></div>
              <span className="v">{money(outstanding(c.db, p.id))}</span>
            </button>
          ))}
      </div>
    </>
  );
}

/* ------------------------------ day close -------------------------------- */
function DayClose(c) {
  const existing = c.closing;
  const [qty, setQty] = useState(() => {
    const q = {}; DENOMS.forEach((d) => (q[d] = existing?.denoms?.[d] || 0)); return q;
  });
  const counted = DENOMS.reduce((a, d) => a + d * (qty[d] || 0), 0);
  const diff = counted - c.expectedCash;

  const closeDay = () => {
    c.setDb((d) => ({
      ...d,
      closings: [...d.closings.filter((x) => !(x.date === c.date && x.branchId === c.branch.id)),
        { id: uid(), date: c.date, branchId: c.branch.id, opening: c.openingCash, expected: c.expectedCash,
          actual: counted, denoms: qty, status: "CLOSED", by: c.user.name, at: Date.now() }],
      audit: [{ id: uid(), at: Date.now(), who: c.user.name, what: `Closed ${c.date}: counted ${money(counted)}, difference ${money(diff)}` }, ...d.audit],
    }));
    c.say("Day closed");
  };

  const reopen = () => {
    const reason = prompt("Reason for reopening this day?");
    if (!reason) return;
    c.setDb((d) => ({
      ...d,
      closings: d.closings.map((x) => (x.date === c.date && x.branchId === c.branch.id ? { ...x, status: "REOPENED" } : x)),
      audit: [{ id: uid(), at: Date.now(), who: c.user.name, what: `Reopened ${c.date} — ${reason}` }, ...d.audit],
    }));
    c.say("Day reopened");
  };

  return (
    <>
      <div className="card">
        <span className="lbl">Day end · {dshow(c.date)}</span>
        <div className="rowb"><span className="k">Opening cash</span><span className="v">{money(c.openingCash)}</span></div>
        <div className="rowb"><span className="k">Cash movement today</span><span className="v">{money(c.expectedCash - c.openingCash)}</span></div>
        <div className="rowb"><b className="k" style={{ color: "var(--chalk)" }}>Expected cash</b>
          <b className="v" style={{ fontSize: 19 }}>{money(c.expectedCash)}</b></div>
      </div>

      <div className="card">
        <span className="lbl">Count the drawer</span>
        {DENOMS.map((d) => (
          <div className="den" key={d}>
            <b>₹{d}</b>
            <input inputMode="numeric" value={qty[d] || ""} placeholder="0" disabled={c.dayLocked}
              onChange={(e) => setQty({ ...qty, [d]: parseInt(e.target.value) || 0 })} style={{ padding: "10px 12px" }} />
            <span className="amt">{money(d * (qty[d] || 0))}</span>
          </div>
        ))}
        <div className="rowb" style={{ marginTop: 8 }}><b className="k" style={{ color: "var(--chalk)" }}>Counted</b>
          <b className="v" style={{ fontSize: 19 }}>{money(counted)}</b></div>
        <div className="rowb"><span className="k">Difference</span>
          <span className="diff" style={{ color: diff === 0 ? "var(--leaf)" : "var(--beet)" }}>
            {diff > 0 ? "+" : ""}{money(diff)}</span></div>
        {Math.abs(diff) >= c.db.settings.lowCashAlert &&
          <div className="warn">Difference is over {money(c.db.settings.lowCashAlert)}. Recount before closing, then write the reason in remarks.</div>}
      </div>

      {c.dayLocked ? (
        <>
          <div className="warn">Closed by {existing.by}. Entries for this date are locked.</div>
          {c.user.role !== "CASHIER" && <button className="btn ghost" style={{ marginTop: 12 }} onClick={reopen}>Reopen day</button>}
        </>
      ) : (
        <button className="btn" style={{ marginTop: 14 }} disabled={counted === 0} onClick={closeDay}>
          Close {dshow(c.date)}
        </button>
      )}
      <p className="empty" style={{ fontSize: 12 }}>Today's counted cash becomes tomorrow's opening cash automatically.</p>
    </>
  );
}

/* ------------------------------- reports --------------------------------- */
function Reports(c) {
  const [range, setRange] = useState("month");
  const from = useMemo(() => {
    const d = new Date(c.date + "T00:00:00");
    if (range === "day") return c.date;
    if (range === "week") { d.setDate(d.getDate() - 6); return d.toISOString().slice(0, 10); }
    d.setDate(1); return d.toISOString().slice(0, 10);
  }, [range, c.date]);

  const rows = c.db.txns.filter((t) => t.date >= from && t.date <= c.date);
  const s = (type) => rows.filter((t) => t.type === type).reduce((a, b) => a + b.amount, 0);
  const sales = s("sale"), purch = s("purchase"), exp = s("expense");
  const gp = sales - purch, pct = sales ? (gp / sales) * 100 : 0;
  const payable = c.db.parties.filter((p) => p.kind === "supplier").reduce((a, p) => a + outstanding(c.db, p.id), 0);
  const receivable = c.db.parties.filter((p) => p.kind === "customer").reduce((a, p) => a + outstanding(c.db, p.id), 0);

  const byDay = {};
  rows.forEach((t) => {
    byDay[t.date] = byDay[t.date] || { sale: 0, purchase: 0 };
    if (t.type === "sale") byDay[t.date].sale += t.amount;
    if (t.type === "purchase") byDay[t.date].purchase += t.amount;
  });
  const days = Object.keys(byDay).sort().reverse();
  const peak = Math.max(1, ...Object.values(byDay).map((x) => x.sale));

  return (
    <>
      <div className="tabs">
        {[["day", "This day"], ["week", "Last 7 days"], ["month", "This month"]].map(([k, l]) => (
          <button key={k} className={"tab" + (range === k ? " on" : "")} onClick={() => setRange(k)}>{l}</button>))}
      </div>

      <div className="card">
        <span className="lbl">{dshow(from)} → {dshow(c.date)}</span>
        <div className="big" style={{ color: "var(--mango)" }}>{money(sales)}</div>
        <div className="k" style={{ marginTop: 4 }}>total sales</div>
        <div className="rowb" style={{ marginTop: 12 }}><span className="k">Purchase</span><span className="v">{money(purch)}</span></div>
        <div className="rowb"><span className="k">Operational GP</span><span className="v">{money(gp)} · {pct.toFixed(2)}%</span></div>
        <div className="rowb"><span className="k">Expenses</span><span className="v">{money(exp)}</span></div>
        <div className="rowb"><span className="k">GP after expenses</span>
          <span className="v" style={{ color: gp - exp >= 0 ? "var(--leaf)" : "var(--beet)" }}>{money(gp - exp)}</span></div>
        <div className="rowb"><span className="k">Supplier payable</span><span className="v">{money(payable)}</span></div>
        <div className="rowb"><span className="k">Customer receivable</span><span className="v">{money(receivable)}</span></div>
      </div>

      <div className="card">
        <span className="lbl">Day by day</span>
        {days.length === 0 ? <p className="empty">No entries in this period.</p> : days.map((d) => (
          <div key={d} style={{ padding: "10px 0", borderBottom: "1px solid var(--line)" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span className="k">{dshow(d)}</span>
              <span className="v">{money(byDay[d].sale)} <span style={{ color: "var(--muted)" }}>/ {money(byDay[d].purchase)}</span></span>
            </div>
            <div style={{ height: 6, background: "var(--raise)", borderRadius: 4, marginTop: 7 }}>
              <div style={{ height: 6, width: (byDay[d].sale / peak) * 100 + "%", background: "var(--mango)", borderRadius: 4 }} />
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <span className="lbl">Activity log</span>
        {c.db.audit.length === 0 ? <p className="empty">Nothing logged yet.</p> :
          c.db.audit.slice(0, 12).map((a) => (
            <div className="item" key={a.id}>
              <div><b style={{ fontSize: 13 }}>{a.what}</b>
                <small>{a.who} · {new Date(a.at).toLocaleString("en-IN")}</small></div>
            </div>
          ))}
      </div>

      <Settings c={c} />
    </>
  );
}

function Settings({ c }) {
  const set = (patch) => c.setDb((d) => ({ ...d, settings: { ...d.settings, ...patch } }));
  return (
    <div className="card">
      <span className="lbl">Settings</span>
      <div className="f"><label className="lbl">GP method</label>
        <div className="tabs" style={{ padding: 0 }}>
          {[["markup", "Markup on purchase"], ["margin", "Margin on sales"]].map(([k, l]) => (
            <button key={k} className={"tab" + (c.db.settings.gpMethod === k ? " on" : "")}
              onClick={() => set({ gpMethod: k })}>{l}</button>))}
        </div></div>
      <div className="grid2">
        <div className="f"><label className="lbl">GP rate %</label>
          <input inputMode="decimal" value={c.db.settings.gpRate}
            onChange={(e) => set({ gpRate: parseFloat(e.target.value) || 0 })} /></div>
        <div className="f"><label className="lbl">Cash difference alert ₹</label>
          <input inputMode="numeric" value={c.db.settings.lowCashAlert}
            onChange={(e) => set({ lowCashAlert: parseFloat(e.target.value) || 0 })} /></div>
      </div>
      <p className="empty" style={{ fontSize: 12, padding: "4px 0 0" }}>
        GP here is operational: sales minus purchase for the period. It is not accounting gross profit until opening and
        closing stock value are included — tell your accountant the same.
      </p>
    </div>
  );
}
