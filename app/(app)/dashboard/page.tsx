import { prisma } from "@/lib/prisma";
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";

export default async function DashboardPage() {
  const [customers,enquiries,quotations,jobs,technicians,invoices,payments,amcs,services,recent] = await Promise.all([
    prisma.customer.count(), prisma.enquiry.count({where:{status:{not:"LOST"}}}), prisma.quotation.count(), prisma.job.count({where:{status:{in:["SCHEDULED","ASSIGNED","IN_PROGRESS"]}}}), prisma.technician.count({where:{active:true}}), prisma.invoice.count({where:{balanceAmount:{gt:0.01}}}), prisma.payment.aggregate({_sum:{amount:true}}), prisma.aMCContract.count({where:{status:"ACTIVE"}}), prisma.service.count({where:{active:true}}), prisma.quotation.findMany({orderBy:{createdAt:"desc"},take:6,include:{customer:true,property:true}})
  ]);
  const collected=payments._sum.amount??0;
  const outstandingRows=await prisma.invoice.findMany({where:{balanceAmount:{gt:0.01}},select:{balanceAmount:true}});
  const outstanding=outstandingRows.reduce((s,i)=>s+i.balanceAmount,0);
  const stats=[
    ["Customers",customers,"/customers"],["Open enquiries",enquiries,"/enquiries"],["Active jobs",jobs,"/jobs"],["Technicians",technicians,"/technicians"],["Outstanding invoices",invoices,"/invoices"],["AMC contracts",amcs,"/amc"],["Active services",services,"/services"], ["Collected",`₹${collected.toLocaleString("en-IN")}`,"/payments"]
  ];
  return <div className="space-y-8"><div><h1 className="page-title">Dashboard</h1><p className="page-subtitle">Live EPCI business overview from MySQL.</p></div><div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">{stats.map(([label,value,href])=><Link href={href as string} key={label as string} className="card p-4 hover:shadow-md"><div className="metric">{value}</div><div className="text-xs text-gray-500 mt-1">{label}</div></Link>)}</div><div className="grid gap-6 lg:grid-cols-3"><div className="card lg:col-span-2"><div className="flex items-center justify-between border-b px-5 py-4"><h2 className="section-title">Recent quotations</h2><Link href="/quotations" className="text-sm text-brand-700">View all</Link></div><div className="divide-y">{recent.map(q=><Link key={q.id} href={`/quotations/${q.id}`} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50"><div><div className="font-medium">{q.quotationNumber}</div><div className="text-xs text-gray-500">{q.customer.name} · {q.property.serviceAddress}</div></div><div className="flex items-center gap-3"><b>₹{q.total.toLocaleString("en-IN")}</b><StatusBadge status={q.status}/></div></Link>)}</div></div><div className="card p-5"><h2 className="section-title">Finance snapshot</h2><div className="mt-4 space-y-4"><div><div className="text-xs text-gray-500">Collected</div><div className="text-2xl font-bold">₹{collected.toLocaleString("en-IN")}</div></div><div><div className="text-xs text-gray-500">Outstanding</div><div className="text-2xl font-bold">₹{outstanding.toLocaleString("en-IN")}</div></div></div></div></div></div>
}
