"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { Role, EnquiryStatus, JobStatus, JobVisitStatus, InvoiceStatus, PaymentMethod, AMCStatus, FollowUpStatus } from "@prisma/client";
import { z } from "zod";

async function sessionOrThrow() {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Not authorized");
  return session;
}

function str(v: FormDataEntryValue | null) { return String(v ?? "").trim(); }
function num(v: FormDataEntryValue | null) { const n = Number(v); return Number.isFinite(n) ? n : 0; }
function date(v: FormDataEntryValue | null) { const d = new Date(str(v)); return Number.isNaN(d.getTime()) ? null : d; }
function allowed(role: Role, roles: Role[]) { return roles.includes(role); }

export async function createEnquiry(formData: FormData) {
  const session = await sessionOrThrow();
  if (!allowed(session.user.role, ["ADMIN","MANAGER","SALES"])) throw new Error("Not authorized");
  const data = z.object({ contactName:z.string().min(2), mobile:z.string().min(6), requirement:z.string().min(2), notes:z.string().optional() }).parse({contactName:str(formData.get("contactName")),mobile:str(formData.get("mobile")),requirement:str(formData.get("requirement")),notes:str(formData.get("notes"))});
  const customerId = str(formData.get("customerId")) || null;
  const propertyId = str(formData.get("propertyId")) || null;
  const count = await prisma.enquiry.count();
  const enquiry = await prisma.enquiry.create({data:{enquiryNumber:`ENQ-${new Date().toISOString().slice(0,10).replaceAll('-','')}-${String(count+1).padStart(4,'0')}`,contactName:data.contactName,mobile:data.mobile,requirement:data.requirement,notes:data.notes||null,source:(str(formData.get("source")) as any)||"PHONE",customerId,propertyId,createdById:session.user.id}});
  revalidatePath("/enquiries"); revalidatePath("/dashboard"); redirect(`/enquiries?created=${enquiry.id}`);
}

export async function updateEnquiryStatus(formData: FormData) {
  const session = await sessionOrThrow();
  if (!allowed(session.user.role,["ADMIN","MANAGER","SALES"])) throw new Error("Not authorized");
  const id=str(formData.get("id")); const status=str(formData.get("status")) as EnquiryStatus;
  await prisma.enquiry.update({where:{id},data:{status}}); revalidatePath("/enquiries"); revalidatePath("/dashboard");
}

export async function updateEnquiry(formData: FormData) {
  const session = await sessionOrThrow();
  if (!allowed(session.user.role, ["ADMIN", "MANAGER", "SALES"])) throw new Error("Not authorized");
  const id = str(formData.get("id"));
  if (!id) throw new Error("Enquiry ID is required");
  await prisma.enquiry.update({
    where: { id },
    data: {
      contactName: str(formData.get("contactName")),
      mobile: str(formData.get("mobile")),
      requirement: str(formData.get("requirement")),
      source: (str(formData.get("source")) as any) || "PHONE",
      notes: str(formData.get("notes")) || null,
    },
  });
  revalidatePath("/enquiries");
  revalidatePath("/dashboard");
}

export async function archiveEnquiry(formData: FormData) {
  const session = await sessionOrThrow();
  if (!allowed(session.user.role, ["ADMIN", "MANAGER", "SALES"])) throw new Error("Not authorized");
  const id = str(formData.get("id"));
  await prisma.enquiry.update({
    where: { id },
    data: { status: "LOST" },
  });
  revalidatePath("/enquiries");
  revalidatePath("/dashboard");
}

export async function softDeleteEnquiry(formData: FormData) {
  const session = await sessionOrThrow();
  if (!allowed(session.user.role, ["ADMIN", "MANAGER", "SALES"])) throw new Error("Not authorized");
  const id = str(formData.get("id"));
  await prisma.enquiry.update({
    where: { id },
    data: { deletedAt: new Date(), status: "LOST" },
  });
  revalidatePath("/enquiries");
  revalidatePath("/dashboard");
}

export async function createFollowUp(formData: FormData) {
  const session=await sessionOrThrow(); if(!allowed(session.user.role,["ADMIN","MANAGER","SALES"])) throw new Error("Not authorized");
  const dueAt=date(formData.get("dueAt")); if(!dueAt) throw new Error("Valid due date is required");
  await prisma.followUp.create({data:{enquiryId:str(formData.get("enquiryId"))||null,customerId:str(formData.get("customerId"))||null,dueAt,note:str(formData.get("note"))||"Follow up",assignedToId:str(formData.get("assignedToId"))||session.user.id}});
  revalidatePath("/follow-ups"); revalidatePath("/dashboard");
}

export async function updateFollowUp(formData: FormData) {
  const session=await sessionOrThrow(); if(!allowed(session.user.role,["ADMIN","MANAGER","SALES"])) throw new Error("Not authorized");
  const id=str(formData.get("id")); const status=str(formData.get("status")) as FollowUpStatus;
  await prisma.followUp.update({where:{id},data:{status,completedAt:status==="COMPLETED"?new Date():null}}); revalidatePath("/follow-ups"); revalidatePath("/dashboard");
}

export async function editFollowUp(formData: FormData) {
  const session = await sessionOrThrow();
  if (!allowed(session.user.role, ["ADMIN", "MANAGER", "SALES"])) throw new Error("Not authorized");
  const id = str(formData.get("id"));
  const dueAt = date(formData.get("dueAt"));
  if (!dueAt) throw new Error("Valid due date is required");
  await prisma.followUp.update({
    where: { id },
    data: {
      dueAt,
      note: str(formData.get("note")) || "Follow up",
      assignedToId: str(formData.get("assignedToId")) || null,
    },
  });
  revalidatePath("/follow-ups");
  revalidatePath("/dashboard");
}

export async function cancelFollowUp(formData: FormData) {
  const session = await sessionOrThrow();
  if (!allowed(session.user.role, ["ADMIN", "MANAGER", "SALES"])) throw new Error("Not authorized");
  const id = str(formData.get("id"));
  await prisma.followUp.update({
    where: { id },
    data: { status: "CANCELLED" },
  });
  revalidatePath("/follow-ups");
  revalidatePath("/dashboard");
}

export async function softDeleteFollowUp(formData: FormData) {
  const session = await sessionOrThrow();
  if (!allowed(session.user.role, ["ADMIN", "MANAGER", "SALES"])) throw new Error("Not authorized");
  const id = str(formData.get("id"));
  await prisma.followUp.update({
    where: { id },
    data: { deletedAt: new Date(), status: "CANCELLED" },
  });
  revalidatePath("/follow-ups");
  revalidatePath("/dashboard");
}

export async function convertQuotationToJob(formData: FormData) {
  const session=await sessionOrThrow(); if(!allowed(session.user.role,["ADMIN","MANAGER","SALES"])) throw new Error("Not authorized");
  const quotationId=str(formData.get("quotationId"));
  const q=await prisma.quotation.findUnique({where:{id:quotationId},include:{customer:true,property:true,items:true}});
  if(!q || q.status!=="ACCEPTED") throw new Error("Only an accepted quotation can be converted");
  const existing=await prisma.job.findUnique({where:{quotationId}}); if(existing){redirect(`/jobs/${existing.id}`);}
  const count=await prisma.job.count();
  const job=await prisma.$transaction(async tx=>{
    const j=await tx.job.create({data:{jobNumber:`JOB-${new Date().toISOString().slice(0,10).replaceAll('-','')}-${String(count+1).padStart(4,'0')}`,quotationId:q.id,customerId:q.customerId,propertyId:q.propertyId,status:"SCHEDULED",notes:q.notes,createdById:session.user.id}});
    await tx.quotation.update({where:{id:q.id},data:{status:"CONVERTED"}});
    await tx.auditLog.create({data:{userId:session.user.id,quotationId:q.id,action:"CONVERT_TO_JOB",detail:j.jobNumber}});
    return j;
  });
  revalidatePath(`/quotations/${quotationId}`); revalidatePath("/quotations"); revalidatePath("/jobs"); redirect(`/jobs/${job.id}`);
}

export async function createJob(formData: FormData) {
  const session=await sessionOrThrow(); if(!allowed(session.user.role,["ADMIN","MANAGER"])) throw new Error("Not authorized");
  const customerId=str(formData.get("customerId")), propertyId=str(formData.get("propertyId")); if(!customerId||!propertyId) throw new Error("Customer and property are required");
  const count=await prisma.job.count(); const scheduledAt=date(formData.get("scheduledAt"));
  const job=await prisma.job.create({data:{jobNumber:`JOB-${new Date().toISOString().slice(0,10).replaceAll('-','')}-${String(count+1).padStart(4,'0')}`,customerId,propertyId,status:scheduledAt?"SCHEDULED":"SCHEDULED",scheduledAt,notes:str(formData.get("notes"))||null,createdById:session.user.id}});
  const technicianId=str(formData.get("technicianId")); if(technicianId) await prisma.jobAssignment.create({data:{jobId:job.id,technicianId}});
  revalidatePath("/jobs"); redirect(`/jobs/${job.id}`);
}

export async function assignTechnician(formData: FormData) {
  const session=await sessionOrThrow(); if(!allowed(session.user.role,["ADMIN","MANAGER"])) throw new Error("Not authorized");
  const jobId=str(formData.get("jobId")), technicianId=str(formData.get("technicianId"));
  await prisma.jobAssignment.upsert({where:{jobId_technicianId:{jobId,technicianId}},update:{notes:str(formData.get("notes"))||null},create:{jobId,technicianId,notes:str(formData.get("notes"))||null}});
  await prisma.job.update({where:{id:jobId},data:{status:"ASSIGNED"}}); revalidatePath(`/jobs/${jobId}`); revalidatePath("/jobs");
}

export async function updateJobStatus(formData: FormData) {
  const session=await sessionOrThrow(); if(!allowed(session.user.role,["ADMIN","MANAGER","TECHNICIAN"])) throw new Error("Not authorized");
  const id=str(formData.get("id")), status=str(formData.get("status")) as JobStatus;
  await prisma.job.update({where:{id},data:{status}}); revalidatePath(`/jobs/${id}`); revalidatePath("/jobs"); revalidatePath("/dashboard");
}

export async function createJobVisit(formData: FormData) {
  const session=await sessionOrThrow(); if(!allowed(session.user.role,["ADMIN","MANAGER","TECHNICIAN"])) throw new Error("Not authorized");
  const scheduledAt=date(formData.get("scheduledAt")); if(!scheduledAt) throw new Error("Valid visit date required");
  await prisma.jobVisit.create({data:{jobId:str(formData.get("jobId")),technicianId:str(formData.get("technicianId"))||null,scheduledAt,status:"SCHEDULED"}});
  revalidatePath(`/jobs/${str(formData.get("jobId"))}`); revalidatePath("/jobs");
}

export async function completeJobVisit(formData: FormData) {
  const session=await sessionOrThrow(); if(!allowed(session.user.role,["ADMIN","MANAGER","TECHNICIAN"])) throw new Error("Not authorized");
  const id=str(formData.get("id")); const visit=await prisma.jobVisit.update({where:{id},data:{status:"COMPLETED",completedAt:new Date(),notes:str(formData.get("notes"))||null,chemicalUsed:str(formData.get("chemicalUsed"))||null,customerSigned:formData.get("customerSigned")==="on"},include:{job:true}});
  await prisma.job.update({where:{id:visit.jobId},data:{status:"COMPLETED"}}); revalidatePath(`/jobs/${visit.jobId}`); revalidatePath("/jobs");
}

export async function createTechnician(formData: FormData) {
  const session=await sessionOrThrow(); if(!allowed(session.user.role,["ADMIN","MANAGER"])) throw new Error("Not authorized");
  await prisma.technician.create({data:{name:str(formData.get("name")),mobile:str(formData.get("mobile")),employeeCode:str(formData.get("employeeCode"))||null,skills:str(formData.get("skills"))||null}}); revalidatePath("/technicians");
}

export async function updateTechnician(formData: FormData) {
  const session = await sessionOrThrow();
  if (!allowed(session.user.role, ["ADMIN", "MANAGER"])) throw new Error("Not authorized");
  const id = str(formData.get("id"));
  if (!id) throw new Error("Technician ID is required");
  await prisma.technician.update({
    where: { id },
    data: {
      name: str(formData.get("name")),
      mobile: str(formData.get("mobile")),
      employeeCode: str(formData.get("employeeCode")) || null,
      skills: str(formData.get("skills")) || null,
      notes: str(formData.get("notes")) || null,
    },
  });
  revalidatePath("/technicians");
}

export async function toggleTechnicianActive(id: string, active: boolean) {
  const session = await sessionOrThrow();
  if (!allowed(session.user.role, ["ADMIN", "MANAGER"])) throw new Error("Not authorized");
  await prisma.technician.update({
    where: { id },
    data: { active },
  });
  revalidatePath("/technicians");
}

export async function softDeleteTechnician(formData: FormData) {
  const session = await sessionOrThrow();
  if (!allowed(session.user.role, ["ADMIN", "MANAGER"])) throw new Error("Not authorized");
  const id = str(formData.get("id"));
  await prisma.technician.update({
    where: { id },
    data: { deletedAt: new Date(), active: false },
  });
  revalidatePath("/technicians");
}

export async function createInvoiceForJob(formData: FormData) {
  const session = await sessionOrThrow();

  /*
   * ADMIN / MANAGER / SALES / TECHNICIAN
   * can start the invoice process.
   *
   * Technician is additionally checked below
   * to make sure the job belongs to them.
   */
  if (
    !allowed(
      session.user.role,
      ["ADMIN", "MANAGER", "SALES", "TECHNICIAN"]
    )
  ) {
    throw new Error("Not authorized");
  }

  const jobId = str(formData.get("jobId"));

  if (!jobId) {
    throw new Error("Job ID is required.");
  }

  /*
   * Load job + quotation + customer +
   * technician assignments + existing invoice.
   */
  const job = await prisma.job.findUnique({
    where: {
      id: jobId,
    },

    include: {
      quotation: true,

      customer: true,

      invoice: true,

      assignments: {
        include: {
          technician: true,
        },
      },
    },
  });

  if (!job) {
    throw new Error("Job not found.");
  }

  if (!job.quotation) {
    throw new Error(
      "Invoice requires a quotation-backed job."
    );
  }

  /*
   * Job must be completed first.
   */
  if (job.status !== "COMPLETED") {
    throw new Error(
      "Complete the job before creating the invoice."
    );
  }

  /*
   * If invoice already exists,
   * open the existing invoice.
   */
  if (job.invoice) {
    redirect(`/invoices/${job.invoice.id}`);
  }

  /*
   * -----------------------------------------
   * TECHNICIAN SECURITY CHECK
   * -----------------------------------------
   *
   * Technician can create invoice ONLY for
   * a completed job assigned to that technician.
   */
  if (session.user.role === "TECHNICIAN") {
    const technician =
      await prisma.technician.findFirst({
        where: {
          userId: session.user.id,
        },
      });

    if (!technician) {
      throw new Error(
        "Your technician login is not linked to a technician profile."
      );
    }

    const assigned =
      job.assignments.some(
        (assignment) =>
          assignment.technicianId ===
          technician.id
      );

    if (!assigned) {
      throw new Error(
        "You can create an invoice only for a completed job assigned to you."
      );
    }
  }

  /*
   * -----------------------------------------
   * CREATE INVOICE
   * -----------------------------------------
   */

  const q = job.quotation;

  const count =
    await prisma.invoice.count();

  const invoiceNumber =
    `EPCI-INV-${new Date()
      .toISOString()
      .slice(0, 10)
      .replaceAll("-", "")}-${String(
      count + 1
    ).padStart(4, "0")}`;

  const subtotal =
    Number(q.subtotal || 0);

  const taxRatePercent =
    Number(q.taxRatePercent || 0);

  const taxAmount =
    Number(q.taxAmount || 0);

  const total =
    Number(q.total || 0);

  const invoice =
    await prisma.invoice.create({
      data: {
        invoiceNumber,

        jobId,

        customerId:
          job.customerId,

        subtotal,

        taxRatePercent,

        taxAmount,

        total,

        paidAmount: 0,

        balanceAmount: total,

        status: "ISSUED",

        dueAt: new Date(
          Date.now() +
            7 * 24 * 60 * 60 * 1000
        ),
      },
    });

  /*
   * Refresh application pages.
   */
  revalidatePath("/invoices");

  revalidatePath(
    `/invoices/${invoice.id}`
  );

  revalidatePath(
    `/jobs/${jobId}`
  );

  revalidatePath("/jobs");

  revalidatePath("/dashboard");

  redirect(
    `/invoices/${invoice.id}`
  );
}

export async function createPayment(formData: FormData) {
  const session=await sessionOrThrow(); if(!allowed(session.user.role,["ADMIN","MANAGER","SALES"])) throw new Error("Not authorized");
  const invoiceId=str(formData.get("invoiceId")), amount=num(formData.get("amount")); if(amount<=0) throw new Error("Payment amount must be greater than zero");
  const invoice=await prisma.invoice.findUnique({where:{id:invoiceId}}); if(!invoice) throw new Error("Invoice not found"); if(amount>invoice.balanceAmount+0.01) throw new Error("Payment cannot exceed balance");
  const count=await prisma.payment.count(); const receiptNumber=`RCT-${new Date().toISOString().slice(0,10).replaceAll('-','')}-${String(count+1).padStart(4,'0')}`;
  await prisma.$transaction(async tx=>{await tx.payment.create({data:{receiptNumber,invoiceId,amount,method:(str(formData.get("method")) as PaymentMethod)||"UPI",reference:str(formData.get("reference"))||null,notes:str(formData.get("notes"))||null,recordedById:session.user.id}}); const paid=invoice.paidAmount+amount; const balance=Math.max(invoice.total-paid,0); await tx.invoice.update({where:{id:invoiceId},data:{paidAmount:paid,balanceAmount:balance,status:balance<=0.01?"PAID":"PARTIAL"}});});
  revalidatePath(`/invoices/${invoiceId}`); revalidatePath("/payments"); revalidatePath("/dashboard");
}

export async function createAMC(formData: FormData) {
  const session=await sessionOrThrow(); if(!allowed(session.user.role,["ADMIN","MANAGER","SALES"])) throw new Error("Not authorized");
  const start=date(formData.get("startDate")), end=date(formData.get("endDate")); if(!start||!end||end<=start) throw new Error("Valid start/end dates required");
  const count=await prisma.aMCContract.count(); const contract=await prisma.aMCContract.create({data:{contractNumber:`AMC-${new Date().toISOString().slice(0,10).replaceAll('-','')}-${String(count+1).padStart(4,'0')}`,customerId:str(formData.get("customerId")),propertyId:str(formData.get("propertyId")),serviceId:str(formData.get("serviceId")),startDate:start,endDate:end,visitFrequency:str(formData.get("visitFrequency"))||"Monthly",visitCount:Math.max(1,Math.floor(num(formData.get("visitCount"))||12)),contractValue:num(formData.get("contractValue")),status:"ACTIVE",notes:str(formData.get("notes"))||null,createdById:session.user.id}});
  revalidatePath("/amc"); redirect(`/amc/${contract.id}`);
}

export async function createAMCVisit(formData: FormData) {
  const session=await sessionOrThrow(); if(!allowed(session.user.role,["ADMIN","MANAGER","SALES","TECHNICIAN"])) throw new Error("Not authorized");
  const scheduledAt=date(formData.get("scheduledAt")); if(!scheduledAt) throw new Error("Valid visit date required");
  const contractId=str(formData.get("contractId"));
  await prisma.aMCVisit.create({data:{contractId,scheduledAt,technicianId:str(formData.get("technicianId"))||null,status:"SCHEDULED"}});
  revalidatePath(`/amc/${contractId}`); revalidatePath("/amc");
}

export async function updateAMCStatus(formData: FormData) {
  const session=await sessionOrThrow(); if(!allowed(session.user.role,["ADMIN","MANAGER"])) throw new Error("Not authorized");
  await prisma.aMCContract.update({where:{id:str(formData.get("id"))},data:{status:str(formData.get("status")) as AMCStatus}}); revalidatePath("/amc");
}
