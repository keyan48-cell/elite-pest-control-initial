import { prisma } from "@/lib/prisma";
import { createService } from "./actions";
import ServiceRowActions from "@/components/ServiceRowActions";

export default async function ServicesPage() {
  const services = await prisma.service.findMany({
    where: { deletedAt: null },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Services</h1>
        <p className="text-sm text-gray-500">
          Cockroach Control, Termite Treatment, Bed Bug Treatment, Rodent Control, Mosquito Control, etc.
          Each service needs a configured pricing method and warranty (see Pricing).
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 card divide-y divide-gray-100">
          {services.length === 0 && (
            <div className="px-5 py-6 text-sm text-gray-500">No services configured yet.</div>
          )}
          {services.map((s) => (
            <div key={s.id} className="flex items-center justify-between px-5 py-3">
              <div>
                <div className="text-sm font-medium text-gray-900">{s.name}</div>
                <div className="text-xs text-gray-500">
                  {s.description || "No description"} · Warranty: {s.warrantyMonths} mo
                </div>
              </div>
              <ServiceRowActions service={s} />
            </div>
          ))}
        </div>

        <form action={createService} className="card p-5 space-y-3 h-fit">
          <h2 className="font-medium text-gray-900">Add service</h2>
          <div>
            <label className="label">Name *</label>
            <input className="input" name="name" required />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input" name="description" rows={2} />
          </div>
          <div>
            <label className="label">Warranty (months)</label>
            <input className="input" type="number" name="warrantyMonths" defaultValue={0} min={0} />
          </div>
          <button type="submit" className="btn-primary w-full">
            Add service
          </button>
        </form>
      </div>
    </div>
  );
}
