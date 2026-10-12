"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateQuotation } from "../../edit-actions";

type Property = { id: string; serviceAddress: string; areaSqft: number | null; bhkOrRooms: string | null };
type Customer = { id: string; name: string; mobile: string; properties: Property[] };
type Service = { id: string; name: string; warrantyMonths: number; hasRule: boolean; method: string | null };
type AddOn = { id: string; name: string; amount: number };
type Surcharge = { id: string; name: string; amount: number; requiresApproval: boolean };
type DiscountRule = { id: string; name: string; type: "PERCENT" | "FLAT"; value: number; maxRole: string };
type Item = { serviceId: string; quantity: number; lineTotal: number };

const methodHint: Record<string, string> = { SQFT: "Area (sq.ft)", BHK: "BHK quantity", ROOM: "Rooms", VISIT: "Visits", UNIT: "Units", STATION: "Stations", FIXED: "Quantity (fixed price)", CONTRACT: "Contracts", TIERED: "Area (sq.ft)" };

export default function EditQuotationForm({ quotation, customers, services, addOns, surcharges, discountRules }: {
  quotation: { id: string; customerId: string; propertyId: string; taxRatePercent: number; notes: string; validUntil: string; discountRuleId: string | null; items: Item[]; addOnIds: string[]; surchargeIds: string[]; pestTypes: string | null; paymentTerms: string | null; visitFrequency: string | null; visitCount: number | null };
  customers: Customer[]; services: Service[]; addOns: AddOn[]; surcharges: Surcharge[]; discountRules: DiscountRule[];
}) {
  const router = useRouter();
  const [customerId, setCustomerId] = useState(quotation.customerId);
  const [propertyId, setPropertyId] = useState(quotation.propertyId);
  const [items, setItems] = useState<Item[]>(quotation.items.length ? quotation.items : [{ serviceId: "", quantity: 0, lineTotal: 0 }]);
  const [addOnIds, setAddOnIds] = useState(quotation.addOnIds);
  const [surchargeIds, setSurchargeIds] = useState(quotation.surchargeIds);
  const [discountRuleId, setDiscountRuleId] = useState(quotation.discountRuleId ?? "");
  const [taxRatePercent, setTaxRatePercent] = useState(quotation.taxRatePercent);
  const [notes, setNotes] = useState(quotation.notes);
  const [validUntil, setValidUntil] = useState(quotation.validUntil);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedCustomer = customers.find((c) => c.id === customerId);
  const selectedDiscount = discountRules.find((d) => d.id === discountRuleId);
  const subtotal = items.reduce((s, i) => s + i.lineTotal, 0) + addOns.filter((a) => addOnIds.includes(a.id)).reduce((s, a) => s + a.amount, 0) + surcharges.filter((s) => surchargeIds.includes(s.id)).reduce((s, a) => s + a.amount, 0);
  const discount = selectedDiscount ? selectedDiscount.type === "PERCENT" ? subtotal * selectedDiscount.value / 100 : selectedDiscount.value : 0;
  const taxable = Math.max(subtotal - discount, 0);
  const tax = taxable * taxRatePercent / 100;
  const total = taxable + tax;

  const updateLine = (index: number, patch: Partial<Item>) => setItems((prev) => prev.map((x, i) => i === index ? { ...x, ...patch } : x));
  const addLine = () => setItems((prev) => [...prev, { serviceId: "", quantity: 0, lineTotal: 0 }]);
  const removeLine = (index: number) => setItems((prev) => prev.length > 1 ? prev.filter((_, i) => i !== index) : prev);

  async function recalc(index: number, serviceId: string, quantity: number) {
    updateLine(index, { lineTotal: 0 });
    if (!serviceId || quantity <= 0) return;
    try {
      const res = await fetch("/api/pricing/calculate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ serviceId, quantity }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Pricing calculation failed");
      updateLine(index, { lineTotal: data.lineTotal });
    } catch (e: any) {
  console.error("Quotation update failed:", e);

  setError(
    e?.message ||
      "Unable to update quotation. Please check the server terminal."
  );
  }

}

  function save() {
    setError(null);
    startTransition(async () => {
      try {
        const result = await updateQuotation({ quotationId: quotation.id, customerId, propertyId, items: items.map(({ serviceId, quantity }) => ({ serviceId, quantity })), addOnIds, surchargeIds, discountRuleId: discountRuleId || null, taxRatePercent, notes, validUntil: validUntil || null });
        router.push(`/quotations/${result.id}`);
        router.refresh();
      } catch (e: any) { setError(e.message || "Could not update quotation"); }
    });
  }

  return <div className="grid gap-6 lg:grid-cols-3">
    <div className="lg:col-span-2 space-y-6">
      <div className="card p-5 space-y-4">
        <h2 className="font-medium">Customer & property</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="label">Customer</label><select className="input" value={customerId} onChange={(e) => { setCustomerId(e.target.value); setPropertyId(""); }}><option value="">Select customer…</option>{customers.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.mobile})</option>)}</select></div>
          <div><label className="label">Property</label><select className="input" value={propertyId} onChange={(e) => setPropertyId(e.target.value)} disabled={!selectedCustomer}><option value="">Select property…</option>{selectedCustomer?.properties.map((p) => <option key={p.id} value={p.id}>{p.serviceAddress}{p.areaSqft ? ` (${p.areaSqft} sqft)` : ""}</option>)}</select></div>
        </div>
      </div>

      <div className="card p-5 space-y-4">
        <h2 className="font-medium">Services</h2>
        {items.map((item, index) => { const svc = services.find((s) => s.id === item.serviceId); return <div key={index} className="grid grid-cols-1 gap-3 sm:grid-cols-6 sm:items-end border-b border-gray-100 pb-4 last:border-0">
          <div className="sm:col-span-3"><label className="label">Service</label><select className="input" value={item.serviceId} onChange={(e) => { updateLine(index, { serviceId: e.target.value, lineTotal: 0 }); recalc(index, e.target.value, item.quantity); }}><option value="">Select service…</option>{services.map((s) => <option key={s.id} value={s.id} disabled={!s.hasRule}>{s.name}{!s.hasRule ? " (no rate)" : ""}</option>)}</select></div>
          <div className="sm:col-span-2"><label className="label">{svc?.method ? methodHint[svc.method] || "Quantity" : "Quantity"}</label><input className="input" type="number" min="0.01" step="0.01" value={item.quantity} onChange={(e) => { const q = Number(e.target.value); updateLine(index, { quantity: q }); recalc(index, item.serviceId, q); }} /></div>
          <div className="flex items-center justify-between gap-2"><span className="text-sm font-medium">₹{item.lineTotal.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span><button type="button" onClick={() => removeLine(index)} className="text-xs text-red-600">Remove</button></div>
        </div> })}
        <button type="button" onClick={addLine} className="btn-secondary">+ Add service</button>
      </div>

      <div className="card p-5 space-y-4">
        <h2 className="font-medium">Add-ons & surcharges</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">{addOns.map((a) => <label key={a.id} className="flex justify-between text-sm"><span><input type="checkbox" checked={addOnIds.includes(a.id)} onChange={(e) => setAddOnIds((p) => e.target.checked ? [...p, a.id] : p.filter((x) => x !== a.id))} /> <span className="ml-2">{a.name}</span></span><span>₹{a.amount.toLocaleString("en-IN")}</span></label>)}</div>
          <div className="space-y-2">{surcharges.map((s) => <label key={s.id} className="flex justify-between text-sm"><span><input type="checkbox" checked={surchargeIds.includes(s.id)} onChange={(e) => setSurchargeIds((p) => e.target.checked ? [...p, s.id] : p.filter((x) => x !== s.id))} /> <span className="ml-2">{s.name}{s.requiresApproval ? " (approval)" : ""}</span></span><span>₹{s.amount.toLocaleString("en-IN")}</span></label>)}</div>
        </div>
      </div>

      <div className="card p-5 space-y-4">
        <h2 className="font-medium">Discount, tax & notes</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="label">Discount</label><select className="input" value={discountRuleId} onChange={(e) => setDiscountRuleId(e.target.value)}><option value="">No discount</option>{discountRules.map((d) => <option key={d.id} value={d.id}>{d.name} ({d.type === "PERCENT" ? `${d.value}%` : `₹${d.value}`})</option>)}</select></div>
          <div><label className="label">GST %</label><input className="input" type="number" min="0" max="100" step="0.01" value={taxRatePercent} onChange={(e) => setTaxRatePercent(Number(e.target.value))} /></div>
          <div><label className="label">Valid until</label><input className="input" type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} /></div>
          <div className="sm:col-span-2"><label className="label">Notes</label><textarea className="input min-h-24" value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
        </div>
      </div>
    </div>

    <div className="card p-5 h-fit space-y-3 lg:sticky lg:top-6">
      <h2 className="font-medium">Updated total</h2>
      <div className="flex justify-between text-sm"><span>Subtotal</span><strong>₹{subtotal.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</strong></div>
      <div className="flex justify-between text-sm"><span>Discount</span><strong className="text-red-600">-₹{Math.min(discount, subtotal).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</strong></div>
      <div className="flex justify-between text-sm"><span>Taxable</span><strong>₹{taxable.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</strong></div>
      <div className="flex justify-between text-sm"><span>GST ({taxRatePercent}%)</span><strong>₹{tax.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</strong></div>
      <div className="border-t pt-3 flex justify-between"><span className="font-semibold">Total</span><strong className="text-lg">₹{total.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</strong></div>
      {selectedDiscount && <p className="text-xs text-gray-500">Discount approval: {selectedDiscount.maxRole}</p>}
      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      <div className="flex gap-2"><button type="button" className="btn-secondary flex-1" onClick={() => router.back()} disabled={isPending}>Cancel</button><button type="button" className="btn-primary flex-1" onClick={save} disabled={isPending || !customerId || !propertyId || items.some((i) => !i.serviceId || i.quantity <= 0)}>{isPending ? "Saving…" : "Save changes"}</button></div>
    </div>
  </div>;
}
