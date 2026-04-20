"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import "../admin.css";

export default function AccountDashboard() {
  const [activeTab, setActiveTab] = useState("DAYBOOK");
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Expense Form State
  const [expType, setExpType] = useState("EXPENSE");
  const [expCategory, setExpCategory] = useState("Marketing");
  const [expDesc, setExpDesc] = useState("");
  const [expAmount, setExpAmount] = useState("");

  // Edit Expense State
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [editExpType, setEditExpType] = useState("EXPENSE");
  const [editExpCategory, setEditExpCategory] = useState("");
  const [editExpDesc, setEditExpDesc] = useState("");
  const [editExpAmount, setEditExpAmount] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resO, resP, resE] = await Promise.all([
        fetch("/api/orders"),
        fetch("/api/products"),
        fetch("/api/expenses")
      ]);
      if (resO.ok) setOrders((await resO.json()).filter((o: any) => o.status === "Verified" || o.status === "Paid & Verified" || !o.status));
      if (resP.ok) setProducts(await resP.json());
      if (resE.ok) setExpenses(await resE.json());
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expAmount) return;
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: expType, category: expCategory, description: expDesc, amount: Number(expAmount) })
      });
      if (res.ok) {
        setExpDesc(""); setExpAmount("");
        fetchData();
        alert("Expense added!");
      }
    } catch (err) {
      console.error(err);
      alert("Error adding expense");
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm("Are you sure you want to delete this expense?")) return;
    try {
      const res = await fetch(`/api/expenses?id=${id}`, { method: "DELETE" });
      if (res.ok) fetchData();
      else alert("Failed to delete expense");
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateExpense = async (e: React.FormEvent, id: string) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/expenses", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, type: editExpType, category: editExpCategory, description: editExpDesc, amount: Number(editExpAmount) })
      });
      if (res.ok) {
        setEditingExpenseId(null);
        fetchData();
      } else {
        alert("Failed to update expense");
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div style={{ padding: "4rem", textAlign: "center" }}>Loading Accounting System...</div>;

  // --- CALCULATION ENGINE ---
  const calculateCOGS = (order: any) => {
    const items = order.rawItems || order.items || [];
    let cogs = 0;
    items.forEach((item: any) => {
      if (typeof item !== 'object') return;
      let cost = item.cost;
      if (cost === undefined || cost === null) {
        // Try finding by ID first, then fallback to name matching for older cart schemas
        const live = products.find(p => 
          p.id?.toString() === item.id?.toString() || 
          (p.name && item.name && p.name.toString().toLowerCase().trim() === item.name.toString().toLowerCase().trim())
        );
        cost = live?.cost || 0;
      }
      cogs += Number(cost);
    });
    return cogs;
  };

  // Daybook Math
  const today = new Date().toISOString().split("T")[0];
  const todaysOrders = orders.filter(o => o.date?.startsWith(today));
  const todaysSales = todaysOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
  const todaysIncomeEntries = expenses.filter(e => e.date?.startsWith(today) && e.type === "INCOME").reduce((sum, e) => sum + Number(e.amount), 0);
  const todaysExpensesAmount = expenses.filter(e => e.date?.startsWith(today) && e.type !== "INCOME").reduce((sum, e) => sum + Number(e.amount), 0);
  const totalDailyInflow = todaysSales + todaysIncomeEntries;

  // P&L Math
  const totalSalesRevenue = orders.reduce((sum, o) => sum + Number(o.total || 0), 0);
  const totalCOGS = orders.reduce((sum, o) => sum + calculateCOGS(o), 0);
  const grossProfit = totalSalesRevenue - totalCOGS;

  const totalOtherIncome = expenses.filter(e => e.type === "INCOME").reduce((sum, e) => sum + Number(e.amount), 0);
  const totalOpEx = expenses.filter(e => e.type !== "INCOME").reduce((sum, e) => sum + Number(e.amount), 0);
  const netProfit = grossProfit + totalOtherIncome - totalOpEx;

  // Stock Summary Math
  const inventoryCostValue = products.reduce((sum, p) => sum + (Number(p.stock) * Number(p.cost || 0)), 0);
  const inventoryRetailValue = products.reduce((sum, p) => sum + (Number(p.stock) * Number(p.price || 0)), 0);
  const inventoryUnits = products.reduce((sum, p) => sum + Number(p.stock), 0);

  return (
    <div className="admin-container" style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <h1>LYKA Accounting Suite</h1>
        <Link href="/admin"><button className="action-btn" style={{ background: "#333", color: "white" }}>&larr; Back to Admin</button></Link>
      </header>

      <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem", borderBottom: "1px solid #ccc", paddingBottom: "1rem" }}>
        {["DAYBOOK", "P&L", "BALANCE_SHEET", "STOCK"].map(tab => (
          <button 
            key={tab} 
            onClick={() => setActiveTab(tab)}
            style={{ 
              padding: "0.8rem 1.5rem", 
              background: activeTab === tab ? "black" : "transparent",
              color: activeTab === tab ? "white" : "black",
              border: "1px solid black",
              fontWeight: "bold",
              cursor: "pointer"
            }}
          >
            {tab.replace("_", " ")}
          </button>
        ))}
      </div>

      {activeTab === "DAYBOOK" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "3rem" }}>
          <div>
            <h3>Add Ledger Entry</h3>
            <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
              <button type="button" onClick={() => { setExpType("INCOME"); setExpCategory("Offline Sale"); }} style={{ flex: 1, padding: "0.8rem", background: expType === "INCOME" ? "green" : "#eee", color: expType === "INCOME" ? "white" : "black", border: "1px solid #ccc", cursor: "pointer", fontWeight: "bold" }}>+ Income</button>
              <button type="button" onClick={() => { setExpType("EXPENSE"); setExpCategory("Marketing"); }} style={{ flex: 1, padding: "0.8rem", background: expType === "EXPENSE" ? "red" : "#eee", color: expType === "EXPENSE" ? "white" : "black", border: "1px solid #ccc", cursor: "pointer", fontWeight: "bold" }}>- Expense</button>
            </div>
            <form onSubmit={handleAddExpense} style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "0.5rem", background: "#f9f9f9", padding: "1.5rem", border: "1px solid #e0e0e0" }}>
              <select value={expCategory} onChange={(e) => setExpCategory(e.target.value)} required style={{ padding: "0.8rem" }}>
                {expType === "EXPENSE" ? (
                  <>
                    <option value="Marketing">Marketing / Ads</option>
                    <option value="Delivery">Delivery / Riders</option>
                    <option value="Salary">Staff Salary</option>
                    <option value="Rent">Rent & Utilities</option>
                    <option value="Misc">Miscellaneous Expense</option>
                  </>
                ) : (
                  <>
                    <option value="Offline Sale">Offline / Physical Sale</option>
                    <option value="Loan / Capital">Outside Loan / Capital</option>
                    <option value="Refund Received">Refund Received</option>
                    <option value="Misc Income">Miscellaneous Income</option>
                  </>
                )}
              </select>
              <input type="text" placeholder="Description (e.g., Cash from walk-in customer)" value={expDesc} onChange={e => setExpDesc(e.target.value)} required style={{ padding: "0.8rem" }} />
              <input type="number" placeholder="Amount (NPR)" value={expAmount} onChange={e => setExpAmount(e.target.value)} required style={{ padding: "0.8rem" }} />
              <button type="submit" style={{ background: "black", color: "white", padding: "1rem", fontWeight: "bold", cursor: "pointer", border: "none" }}>SAVE ENTRY</button>
            </form>

            <div style={{ marginTop: "2rem", padding: "1.5rem", border: "1px solid #ccc", background: "white" }}>
              <h4>Today's Summary</h4>
              <p>Cash Inflow: <strong style={{ color: "green" }}>Rs.{totalDailyInflow.toLocaleString()}</strong></p>
              <p>Cash Outflow: <strong style={{ color: "red" }}>Rs.{todaysExpensesAmount.toLocaleString()}</strong></p>
              <hr style={{ margin: "1rem 0" }}/>
              <p>Net Daily Position: <strong>Rs.{(totalDailyInflow - todaysExpensesAmount).toLocaleString()}</strong></p>
            </div>
          </div>
          <div>
            <h3>Full Cash Ledger</h3>
            <div style={{ marginTop: "1rem" }}>
              {expenses.length === 0 ? <p>No expenses recorded yet.</p> : expenses.map(e => (
                <div key={e.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem", borderBottom: "1px solid #eee", background: editingExpenseId === e.id ? "#f9fafb" : "transparent" }}>
                  {editingExpenseId === e.id ? (
                    <form onSubmit={(ev) => handleUpdateExpense(ev, e.id)} style={{ display: "flex", gap: "0.5rem", width: "100%", alignItems: "center", flexWrap: "wrap" }}>
                      <select value={editExpType} onChange={ev => { setEditExpType(ev.target.value); setEditExpCategory(ev.target.value === "INCOME" ? "Offline Sale" : "Marketing"); }} required style={{ padding: "0.5rem" }}>
                        <option value="EXPENSE">Expense</option>
                        <option value="INCOME">Income</option>
                      </select>
                      <select value={editExpCategory} onChange={ev => setEditExpCategory(ev.target.value)} required style={{ padding: "0.5rem" }}>
                        {editExpType === "EXPENSE" ? (
                          <>
                            <option value="Marketing">Marketing / Ads</option>
                            <option value="Delivery">Delivery / Riders</option>
                            <option value="Salary">Staff Salary</option>
                            <option value="Rent">Rent & Utilities</option>
                            <option value="Misc">Miscellaneous Expense</option>
                          </>
                        ) : (
                          <>
                            <option value="Offline Sale">Offline / Physical Sale</option>
                            <option value="Loan / Capital">Outside Loan / Capital</option>
                            <option value="Refund Received">Refund Received</option>
                            <option value="Misc Income">Miscellaneous Income</option>
                          </>
                        )}
                      </select>
                      <input type="text" value={editExpDesc} onChange={ev => setEditExpDesc(ev.target.value)} required style={{ padding: "0.5rem", flex: 1, minWidth: "150px" }} />
                      <input type="number" value={editExpAmount} onChange={ev => setEditExpAmount(ev.target.value)} required style={{ padding: "0.5rem", width: "100px" }} />
                      <button type="submit" style={{ background: "green", color: "white", padding: "0.5rem 1rem", border: "none", cursor: "pointer", fontWeight: "bold" }}>Save</button>
                      <button type="button" onClick={() => setEditingExpenseId(null)} style={{ background: "#ccc", color: "black", padding: "0.5rem 1rem", border: "none", cursor: "pointer", fontWeight: "bold" }}>Cancel</button>
                    </form>
                  ) : (
                    <>
                      <div>
                        <strong>{e.type === "INCOME" ? "➕ " : ""}{e.category}</strong>
                        <div style={{ fontSize: "0.8rem", color: "gray" }}>{e.description} • {new Date(e.date).toLocaleDateString()}</div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                        <div style={{ color: e.type === "INCOME" ? "green" : "red", fontWeight: "bold", marginRight: "1rem" }}>
                          {e.type === "INCOME" ? "+" : "-"} Rs.{Number(e.amount).toLocaleString()}
                        </div>
                        <button onClick={() => { setEditingExpenseId(e.id); setEditExpType(e.type || "EXPENSE"); setEditExpCategory(e.category); setEditExpDesc(e.description); setEditExpAmount(e.amount); }} style={{ background: "transparent", border: "none", color: "#2563eb", cursor: "pointer", fontSize: "0.85rem", textDecoration: "underline" }}>Edit</button>
                        <button onClick={() => handleDeleteExpense(e.id)} style={{ background: "transparent", border: "none", color: "#dc2626", cursor: "pointer", fontSize: "0.85rem", textDecoration: "underline" }}>Delete</button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "P&L" && (
        <div style={{ background: "white", padding: "3rem", border: "1px solid #e0e0e0", maxWidth: "800px" }}>
          <h2>Profit & Loss Statement (All Time)</h2>
          <hr style={{ margin: "2rem 0" }} />
          
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1.2rem", marginBottom: "0.5rem" }}>
            <span>Gross Web Sales Revenue:</span>
            <span>Rs. {totalSalesRevenue.toLocaleString()}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1.2rem", color: "red", borderBottom: "1px solid #000", paddingBottom: "1rem", marginBottom: "1rem" }}>
            <span>(-) Cost of Goods Sold (COGS):</span>
            <span>- Rs. {totalCOGS.toLocaleString()}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1.4rem", fontWeight: "bold", marginBottom: "1rem" }}>
            <span>Merchandise Gross Profit:</span>
            <span>Rs. {grossProfit.toLocaleString()}</span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1.2rem", color: "green", marginBottom: "0.5rem" }}>
            <span>(+) Total Other Income (Manual):</span>
            <span>+ Rs. {totalOtherIncome.toLocaleString()}</span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1.2rem", color: "red", borderBottom: "1px solid #000", paddingBottom: "1rem", marginBottom: "1rem" }}>
            <span>(-) Total Manual Expenses:</span>
            <span>- Rs. {totalOpEx.toLocaleString()}</span>
          </div>
          
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1.8rem", fontWeight: "900", background: "#f0f0f0", padding: "1rem" }}>
            <span>NET PROFIT:</span>
            <span style={{ color: netProfit >= 0 ? "green" : "red" }}>Rs. {netProfit.toLocaleString()}</span>
          </div>
        </div>
      )}

      {activeTab === "BALANCE_SHEET" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3rem" }}>
          <div style={{ border: "2px solid black", padding: "2rem" }}>
            <h2 style={{ borderBottom: "1px solid #ccc", paddingBottom: "1rem" }}>Assets</h2>
            <div style={{ marginTop: "1rem", display: "flex", justifyContent: "space-between" }}>
              <span>Total Cash & Revenue Generated</span>
              <strong>Rs. {(totalSalesRevenue + totalOtherIncome).toLocaleString()}</strong>
            </div>
            <div style={{ marginTop: "1rem", display: "flex", justifyContent: "space-between" }}>
              <span>Current Inventory Cost Value</span>
              <strong>Rs. {inventoryCostValue.toLocaleString()}</strong>
            </div>
            <hr style={{ margin: "2rem 0" }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1.4rem", fontWeight: "bold" }}>
              <span>Total Assets</span>
              <span>Rs. {(totalSalesRevenue + totalOtherIncome + inventoryCostValue).toLocaleString()}</span>
            </div>
          </div>
          <div style={{ border: "2px solid #ccc", padding: "2rem", background: "#fafafa" }}>
            <h2 style={{ borderBottom: "1px solid #ccc", paddingBottom: "1rem", color: "gray" }}>Liabilities & Equity</h2>
            <p style={{ marginTop: "1rem", color: "gray" }}>No external liabilities recorded in e-commerce system.</p>
            <div style={{ marginTop: "1rem", display: "flex", justifyContent: "space-between", fontWeight: "bold" }}>
              <span>Owner's Equity (Net Worth)</span>
              <span>Rs. {(totalSalesRevenue + totalOtherIncome + inventoryCostValue).toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}

      {activeTab === "STOCK" && (
        <div>
          <div style={{ display: "flex", gap: "2rem", marginBottom: "2rem" }}>
            <div style={{ padding: "1.5rem", background: "#111", color: "white", flex: 1 }}>
              <p>Total Items in Warehouse</p>
              <h2>{inventoryUnits} Units</h2>
            </div>
            <div style={{ padding: "1.5rem", background: "#f4f4f4", border: "1px solid #ccc", flex: 1 }}>
              <p>Capital Locked (Cost Value)</p>
              <h2 style={{ color: "red" }}>Rs. {inventoryCostValue.toLocaleString()}</h2>
            </div>
            <div style={{ padding: "1.5rem", background: "#e8f5e9", border: "1px solid #4caf50", flex: 1 }}>
              <p>Potential Revenue (Retail Value)</p>
              <h2 style={{ color: "green" }}>Rs. {inventoryRetailValue.toLocaleString()}</h2>
            </div>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", background: "white", border: "1px solid #ccc" }}>
            <thead style={{ background: "#f4f4f4" }}>
              <tr>
                <th style={{ padding: "1rem", borderBottom: "2px solid #ccc", textAlign: "left" }}>Product</th>
                <th style={{ padding: "1rem", borderBottom: "2px solid #ccc" }}>Stock</th>
                <th style={{ padding: "1rem", borderBottom: "2px solid #ccc" }}>Unit Cost</th>
                <th style={{ padding: "1rem", borderBottom: "2px solid #ccc" }}>Unit Price</th>
                <th style={{ padding: "1rem", borderBottom: "2px solid #ccc", background: "#fee2e2" }}>Total Cost Vol.</th>
                <th style={{ padding: "1rem", borderBottom: "2px solid #ccc", background: "#dcfce7" }}>Retail Potential</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: "1rem" }}>{p.name}</td>
                  <td style={{ padding: "1rem", textAlign: "center", fontWeight: "bold" }}>{p.stock}</td>
                  <td style={{ padding: "1rem", textAlign: "center", color: "red" }}>{p.cost}</td>
                  <td style={{ padding: "1rem", textAlign: "center", color: "green" }}>{p.price}</td>
                  <td style={{ padding: "1rem", textAlign: "center" }}>{(p.stock * (p.cost || 0)).toLocaleString()}</td>
                  <td style={{ padding: "1rem", textAlign: "center", fontWeight: "bold" }}>{(p.stock * p.price).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
