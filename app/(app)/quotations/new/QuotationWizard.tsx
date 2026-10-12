"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Property = { id: string; serviceAddress: string; areaSqft: number | null; bhkOrRooms: string | null };
type Customer = { id: string; name: string; mobile: string; properties: Property[] };
type Service = { id: string; name: string; warrantyMonths: number; hasRule: boolean; method: string | null };
type AddOn = { id: string; name: string; amount: number };
type Surcharge = { id: string; name: string; amount: number; requiresApproval: boolean };
type DiscountRule = { id: string; name: string; type: "PERCENT" | "FLAT"; value: number; maxRole: string };

type LineItem = {
  key: string;
  serviceId: string;
  quantity: number;
  lineTotal: number | null;
  loading: boolean;
  error: string | null;
};

const quantityHint: Record<string, string> = {
  FIXED: "Not required",
  CONTRACT: "Not required",
  BHK: "Number of BHK",
  ROOM: "Number of rooms",
  SQFT: "Area in sq.ft",
  VISIT: "Number of visits",
  UNIT: "Number of units",
  STATION: "Number of stations",
  TIERED: "Area / quantity",
};

const PEST_TYPE_OPTIONS = [
  "Termite",
  "Cockroach",
  "Rodent",
  "Mosquito",
  "Bed Bug",
  "Ant",
  "Lizard",
  "Fly",
  "Other",
];

const VISIT_FREQUENCY_OPTIONS = [
  "One-time",
  "Monthly",
  "Bi-monthly (every 2 months)",
  "Quarterly",
  "Half-yearly",
  "Annual",
  "Custom",
];

const PAYMENT_TERMS_OPTIONS = [
  "100% advance",
  "50% advance, 50% on completion",
  "30% advance, 70% on completion",
  "On completion",
  "Net 7 days",
  "Net 15 days",
  "Net 30 days",
];

export default function QuotationWizard({
  customers,
  services,
  addOns,
  surcharges,
  discountRules,
  initialCustomerId,
  pricingConfigured,
}: {
  customers: Customer[];
  services: Service[];
  addOns: AddOn[];
  surcharges: Surcharge[];
  discountRules: DiscountRule[];
  initialCustomerId?: string;
  pricingConfigured: boolean;
}) {
  const router = useRouter();

  // --- Customer & Property ---
  const [customerId, setCustomerId] = useState(initialCustomerId ?? "");
  const [propertyId, setPropertyId] = useState("");

  // --- Proposal details ---
  const [selectedPestTypes, setSelectedPestTypes] = useState<string[]>([]);
  const [visitFrequency, setVisitFrequency] = useState("");
  const [visitCount, setVisitCount] = useState(1);
  const [paymentTerms, setPaymentTerms] = useState("50% advance, 50% on completion");
  const [scopeOfWork, setScopeOfWork] = useState("");

  // --- Services ---
  const [items, setItems] = useState<LineItem[]>([
    { key: crypto.randomUUID(), serviceId: "", quantity: 0, lineTotal: null, loading: false, error: null },
  ]);

  // --- Add-ons & Surcharges ---
  const [addOnIds, setAddOnIds] = useState<string[]>([]);
  const [surchargeIds, setSurchargeIds] = useState<string[]>([]);

  // --- Discount, Tax, Validity ---
  const [discountRuleId, setDiscountRuleId] = useState<string>("");
  const [taxRatePercent, setTaxRatePercent] = useState(18);
  const [notes, setNotes] = useState("");
  const [validUntil, setValidUntil] = useState("");

  // --- Submit state ---
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const selectedCustomer = customers.find((c) => c.id === customerId);

  // ---- Live pricing calculation ----
  async function recalcLine(key: string, serviceId: string, quantity: number) {
    setItems((prev) => prev.map((it) => (it.key === key ? { ...it, loading: true, error: null } : it)));
    if (!serviceId) {
      setItems((prev) => prev.map((it) => (it.key === key ? { ...it, loading: false, lineTotal: null } : it)));
      return;
    }
    try {
      const res = await fetch("/api/pricing/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceId, quantity }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Calculation failed");
      setItems((prev) =>
        prev.map((it) => (it.key === key ? { ...it, lineTotal: data.lineTotal, loading: false, error: null } : it))
      );
    } catch (e: any) {
      setItems((prev) => prev.map((it) => (it.key === key ? { ...it, loading: false, error: e.message } : it)));
    }
  }

  function updateItem(key: string, patch: Partial<LineItem>) {
    setItems((prev) => prev.map((it) => (it.key === key ? { ...it, ...patch } : it)));
  }
  function addLine() {
    setItems((prev) => [
      ...prev,
      { key: crypto.randomUUID(), serviceId: "", quantity: 0, lineTotal: null, loading: false, error: null },
    ]);
  }
  function removeLine(key: string) {
    setItems((prev) => (prev.length > 1 ? prev.filter((it) => it.key !== key) : prev));
  }

  // ---- Totals ----
  const addOnsTotal = useMemo(
    () => addOns.filter((a) => addOnIds.includes(a.id)).reduce((s, a) => s + a.amount, 0),
    [addOnIds, addOns]
  );
  const surchargesTotal = useMemo(
    () => surcharges.filter((s) => surchargeIds.includes(s.id)).reduce((s, x) => s + x.amount, 0),
    [surchargeIds, surcharges]
  );
  const servicesTotal = useMemo(() => items.reduce((s, it) => s + (it.lineTotal ?? 0), 0), [items]);
  const subtotal = servicesTotal + addOnsTotal + surchargesTotal;
  const discountRule = discountRules.find((d) => d.id === discountRuleId);
  const discountAmount = discountRule
    ? discountRule.type === "PERCENT"
      ? (subtotal * discountRule.value) / 100
      : discountRule.value
    : 0;
  const taxableAmount = Math.max(subtotal - discountAmount, 0);
  const taxAmount = (taxableAmount * taxRatePercent) / 100;
  const cgst = taxAmount / 2;
  const sgst = taxAmount / 2;
  const total = taxableAmount + taxAmount;

  const canSubmit =
    pricingConfigured &&
    customerId &&
    propertyId &&
    items.every((it) => it.serviceId && it.lineTotal !== null && !it.error) &&
    !submitting;

  async function handleSubmit() {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/quotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          propertyId,
          items: items.map((it) => ({ serviceId: it.serviceId, quantity: it.quantity })),
          addOnIds,
          surchargeIds,
          discountRuleId: discountRuleId || null,
          taxRatePercent,
          notes: [scopeOfWork, notes].filter(Boolean).join("\n\n") || undefined,
          validUntil: validUntil || undefined,
          // Proposal-specific fields
          pestTypes: selectedPestTypes.length ? selectedPestTypes.join(", ") : null,
          paymentTerms: paymentTerms || null,
          visitFrequency: visitFrequency || null,
          visitCount: visitCount || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create quotation");
      router.push(`/quotations/${data.id}`);
    } catch (e: any) {
      setSubmitError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">

        {/* SECTION 1: Customer & Property */}
        <div className="card p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">1. Customer &amp; Property</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Customer</label>
              <select
                className="input"
                value={customerId}
                onChange={(e) => {
                  setCustomerId(e.target.value);
                  setPropertyId("");
                }}
              >
                <option value="">Select customer…</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.mobile})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Property / Service Location</label>
              <select
                className="input"
                value={propertyId}
                onChange={(e) => setPropertyId(e.target.value)}
                disabled={!selectedCustomer}
              >
                <option value="">Select property…</option>
                {selectedCustomer?.properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.serviceAddress} {p.areaSqft ? `(${p.areaSqft} sqft)` : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* SECTION 2: Proposal / Pest Details */}
        <div className="card p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">2. Proposal Details</h2>

          {/* Pest Types */}
          <div>
            <div className="label mb-2">Pest Types</div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {PEST_TYPE_OPTIONS.map((pest) => (
                <label key={pest} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedPestTypes.includes(pest)}
                    onChange={(e) =>
                      setSelectedPestTypes((prev) =>
                        e.target.checked ? [...prev, pest] : prev.filter((p) => p !== pest)
                      )
                    }
                    className="accent-brand-600"
                  />
                  {pest}
                </label>
              ))}
            </div>
          </div>

          {/* Visit Plan */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Visit Frequency</label>
              <select className="input" value={visitFrequency} onChange={(e) => setVisitFrequency(e.target.value)}>
                <option value="">Select frequency…</option>
                {VISIT_FREQUENCY_OPTIONS.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Number of Visits</label>
              <input
                className="input"
                type="number"
                min={1}
                step={1}
                value={visitCount}
                onChange={(e) => setVisitCount(Math.max(1, Number(e.target.value)))}
              />
            </div>
          </div>

          {/* Scope of Work */}
          <div>
            <label className="label">Scope of Work / Treatment Notes</label>
            <textarea
              className="input min-h-24"
              placeholder="Describe treatment areas, chemicals to be used, special instructions…"
              value={scopeOfWork}
              onChange={(e) => setScopeOfWork(e.target.value)}
            />
          </div>

          {/* Payment Terms */}
          <div>
            <label className="label">Payment Terms</label>
            <select className="input" value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)}>
              {PAYMENT_TERMS_OPTIONS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        {/* SECTION 3: Services & Quantity */}
        <div className="card p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">3. Services &amp; Quantity</h2>
          {items.map((it) => {
            const svc = services.find((s) => s.id === it.serviceId);
            return (
              <div key={it.key} className="grid grid-cols-1 gap-3 sm:grid-cols-6 sm:items-end border-b border-gray-100 pb-4 last:border-0">
                <div className="sm:col-span-3">
                  <label className="label">Service</label>
                  <select
                    className="input"
                    value={it.serviceId}
                    onChange={(e) => {
                      updateItem(it.key, { serviceId: e.target.value, lineTotal: null });
                      recalcLine(it.key, e.target.value, it.quantity);
                    }}
                  >
                    <option value="">Select service…</option>
                    {services.map((s) => (
                      <option key={s.id} value={s.id} disabled={!s.hasRule}>
                        {s.name} {!s.hasRule ? "(no rate configured)" : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="label">{svc ? quantityHint[svc.method ?? ""] ?? "Quantity" : "Quantity"}</label>
                  <input
                    className="input"
                    type="number"
                    min={0}
                    step="0.01"
                    value={it.quantity}
                    onChange={(e) => {
                      const q = Number(e.target.value);
                      updateItem(it.key, { quantity: q });
                      recalcLine(it.key, it.serviceId, q);
                    }}
                  />
                </div>
                <div className="text-sm">
                  {it.loading && <span className="text-gray-400">Calculating…</span>}
                  {it.error && <span className="text-red-600">{it.error}</span>}
                  {!it.loading && !it.error && it.lineTotal !== null && (
                    <span className="font-medium text-gray-900">₹{it.lineTotal.toLocaleString("en-IN")}</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeLine(it.key)}
                  className="text-xs text-gray-400 hover:text-red-600 sm:justify-self-end"
                >
                  Remove
                </button>
              </div>
            );
          })}
          <button type="button" onClick={addLine} className="btn-secondary">
            + Add another service
          </button>
        </div>

        {/* SECTION 4: Add-ons & Surcharges */}
        <div className="card p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">4. Add-ons &amp; Surcharges</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <div className="label mb-2">Add-ons</div>
              <div className="space-y-2">
                {addOns.length === 0 && <div className="text-sm text-gray-400">None configured.</div>}
                {addOns.map((a) => (
                  <label key={a.id} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={addOnIds.includes(a.id)}
                        onChange={(e) =>
                          setAddOnIds((prev) =>
                            e.target.checked ? [...prev, a.id] : prev.filter((id) => id !== a.id)
                          )
                        }
                      />
                      {a.name}
                    </span>
                    <span className="text-gray-500">₹{a.amount.toLocaleString("en-IN")}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <div className="label mb-2">Surcharges</div>
              <div className="space-y-2">
                {surcharges.length === 0 && <div className="text-sm text-gray-400">None configured.</div>}
                {surcharges.map((s) => (
                  <label key={s.id} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={surchargeIds.includes(s.id)}
                        onChange={(e) =>
                          setSurchargeIds((prev) =>
                            e.target.checked ? [...prev, s.id] : prev.filter((id) => id !== s.id)
                          )
                        }
                      />
                      {s.name} {s.requiresApproval && <span className="text-xs text-yellow-600">(approval)</span>}
                    </span>
                    <span className="text-gray-500">₹{s.amount.toLocaleString("en-IN")}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 5: Discount, Tax, Validity */}
        <div className="card p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">5. Discount, Tax &amp; Validity</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Discount</label>
              <select className="input" value={discountRuleId} onChange={(e) => setDiscountRuleId(e.target.value)}>
                <option value="">No discount</option>
                {discountRules.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.type === "PERCENT" ? `${d.value}%` : `₹${d.value}`}) — requires {d.maxRole}+
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">GST Rate (%)</label>
              <input
                className="input"
                type="number"
                min={0}
                max={100}
                step="0.01"
                value={taxRatePercent}
                onChange={(e) => setTaxRatePercent(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="label">Proposal Valid Until</label>
              <input className="input" type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
            </div>
            <div>
              <label className="label">Additional Notes</label>
              <input className="input" placeholder="Any extra remarks…" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>
        </div>
      </div>

      {/* SIDEBAR: Summary */}
      <div className="card p-5 space-y-3 h-fit sticky top-8">
        <h2 className="font-semibold text-gray-900">Proposal Summary</h2>

        {selectedPestTypes.length > 0 && (
          <div className="flex flex-wrap gap-1 pb-1">
            {selectedPestTypes.map((p) => (
              <span key={p} className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
                {p}
              </span>
            ))}
          </div>
        )}

        {visitFrequency && (
          <div className="text-xs text-gray-500">
            {visitFrequency} · {visitCount} visit{visitCount !== 1 ? "s" : ""}
          </div>
        )}

        <div className="border-t border-gray-100 pt-3 space-y-1">
          <Row label="Services subtotal" value={servicesTotal} />
          <Row label="Add-ons" value={addOnsTotal} />
          <Row label="Surcharges" value={surchargesTotal} />
          <Row label="Subtotal" value={subtotal} bold />
          <Row label="Discount" value={-discountAmount} negative={discountAmount > 0} />
          <Row label="Taxable amount" value={taxableAmount} />
          <Row label={`CGST (${taxRatePercent / 2}%)`} value={cgst} />
          <Row label={`SGST (${taxRatePercent / 2}%)`} value={sgst} />
        </div>

        <div className="border-t border-gray-200 pt-3">
          <Row label="Total" value={total} bold large />
        </div>

        {paymentTerms && (
          <p className="text-xs text-gray-500 border-t pt-2">Payment: {paymentTerms}</p>
        )}

        {submitError && <p className="text-sm text-red-600">{submitError}</p>}

        <button className="btn-primary w-full" disabled={!canSubmit} onClick={handleSubmit}>
          {submitting ? "Saving…" : "Save Proposal as Draft"}
        </button>
        <p className="text-xs text-gray-400">
          Totals are a live preview. Server recomputes and signs the final totals on save.
        </p>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  bold,
  large,
  negative,
}: {
  label: string;
  value: number;
  bold?: boolean;
  large?: boolean;
  negative?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between ${large ? "text-base" : "text-sm"}`}>
      <span className="text-gray-500">{label}</span>
      <span
        className={`${bold ? "font-semibold" : "font-medium"} ${
          negative ? "text-red-600" : "text-gray-900"
        }`}
      >
        ₹{value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
      </span>
    </div>
  );
}
