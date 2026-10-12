import { createCustomer } from "../actions";

export default function NewCustomerPage() {
  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">New customer</h1>
        <p className="text-sm text-gray-500">Section 4 — name, mobile, email and address.</p>
      </div>
      <form action={createCustomer} className="card p-6 space-y-4">
        <div>
          <label className="label">Full name *</label>
          <input className="input" name="name" required />
        </div>
        <div>
          <label className="label">Mobile *</label>
          <input className="input" name="mobile" required />
        </div>
        <div>
          <label className="label">Email</label>
          <input className="input" type="email" name="email" />
        </div>
        <div>
          <label className="label">Customer GST Number (GSTIN)</label>
          <input className="input font-mono uppercase" name="gstNumber" placeholder="e.g. 33AAAAA0000A1Z5" />
        </div>
        <div>
          <label className="label">Address</label>
          <textarea className="input" name="address" rows={3} />
        </div>
        <button type="submit" className="btn-primary w-full">
          Save customer
        </button>
      </form>
    </div>
  );
}
