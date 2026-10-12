import { prisma } from "@/lib/prisma";
import { roleLabel } from "@/lib/permissions";
import { createUser } from "./actions";
import UserToggle from "./UserToggle";

export default async function UsersPage() {
  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Users</h1>
        <p className="text-sm text-gray-500">
          Admin, Manager, Sales and Technician roles (Section 2). Master pricing stays restricted to
          Admin/Manager regardless of what's granted here.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 card divide-y divide-gray-100">
          {users.map((u) => (
            <div key={u.id} className="flex items-center justify-between px-5 py-3">
              <div>
                <div className="text-sm font-medium text-gray-900">{u.name}</div>
                <div className="text-xs text-gray-500">
                  {u.email} · {roleLabel[u.role]}
                </div>
              </div>
              <UserToggle userId={u.id} active={u.active} />
            </div>
          ))}
        </div>

        <form action={createUser} className="card p-5 space-y-3 h-fit">
          <h2 className="font-medium text-gray-900">Add user</h2>
          <div>
            <label className="label">Name *</label>
            <input className="input" name="name" required />
          </div>
          <div>
            <label className="label">Email *</label>
            <input className="input" type="email" name="email" required />
          </div>
          <div>
            <label className="label">Temporary password *</label>
            <input className="input" type="password" name="password" required minLength={8} />
          </div>
          <div>
            <label className="label">Role</label>
            <select className="input" name="role" defaultValue="SALES">
              <option value="ADMIN">Admin</option>
              <option value="MANAGER">Manager</option>
              <option value="SALES">Sales</option>
              <option value="TECHNICIAN">Technician</option>
            </select>
          </div>
          <button type="submit" className="btn-primary w-full">
            Create user
          </button>
        </form>
      </div>
    </div>
  );
}
