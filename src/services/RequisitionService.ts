import { Requisition, RequisitionItem } from '@prisma/client';
import { prisma } from '../config/database.js';
import dayjs from 'dayjs';

export const RequisitionService = {

async GetAllRequisition(){
return prisma.requisition.findMany({
  select:{
    requisitionNo:true,
    date:true,
    status:true,
    reason:true,
    createdAt:true,

        items:{
          select:{
            description:true,
            quantityRequested:true,
            quantityIssued:true,
            unitCost:true,
            totalCost:true,
          }
        },

        createdBy:{
          select:{
            firstname:true,
            lastname:true,
            middlename:true,
          email:true,
          phone:true
          }
        }
  }
})
},






async CreateRequisition(data: any) {
  // 1. Check if the user exists
  const user = await prisma.user.findUnique({
    where: {
      id: data.createdById,
    },
  });

  if (!user) {
    throw new Error("The user creating the requisition does not exist");
  }

  // 2. Validate items array
  if (!Array.isArray(data.items) || data.items.length === 0) {
    throw new Error("At least one requisition item is required");
  }

  // 3. Validate every item
  const hasValidItems = data.items.every(
    (item: RequisitionItem) =>
      typeof item.description === "string" &&
      item.description.trim().length > 0 &&
      Number.isInteger(item.quantityRequested) &&
      item.quantityRequested > 0
  );

  if (!hasValidItems) {
    throw new Error(
      "Every item must have a description and a positive whole-number quantity"
    );
  }

  // 4. Validate reason
  if (
    typeof data.reason !== "string" ||
    data.reason.trim().length === 0
  ) {
    throw new Error("Requisition reason is required");
  }

  // 5. Validate requisition date
  // if (!data.date || !dayjs(data.date).isValid()) {
  //   throw new Error("A valid requisition date is required");
  // }

  const requisitionDate = dayjs(data.date);

  if (!requisitionDate.isSame(dayjs(), "day")) {
    throw new Error("Requisition date must be today's date");
  }

  // 6. Generate requisition number
  const requisitionNumber = `REQ-${Date.now()}`;

  // 7. Set status based on the user's role
  const requisitionStatus =
    user.role === "HOD" ? "HOD_APPROVED" : "SUBMITTED";

  // 8. Create requisition and items
  const requisitionCreated = await prisma.requisition.create({
    data: {
      requisitionNo: requisitionNumber,
      date: requisitionDate.toDate(),
      reason: data.reason.trim(),
      createdById: user.id,
      status: requisitionStatus,

      items: {
        create: data.items.map((item: RequisitionItem) => ({
          description: item.description.trim(),
          quantityRequested: item.quantityRequested,
        })),
      },
    },

    include: {
      createdBy: true,
      items: true,
    },
  });

  return requisitionCreated;
},

async ApproveRequisition(RequisitionId: string, hodId: string) {
  // 1. Find the requisition
  const requisition = await prisma.requisition.findUnique({
    where: { id: RequisitionId },
  });

  if (!requisition) {
    throw new Error("Requisition does not exist");
  }

  // 2. Check requisition status
  if (requisition.status !== "SUBMITTED") {
    throw new Error("Only submitted requisitions can be approved");
  }

  // 3. Check the HOD
  const hod = await prisma.user.findUnique({
    where: { id: hodId },
  });

  if (!hod || hod.role !== "HOD") {
    throw new Error("Only an HOD can approve requisitions");
  }

  // 4. Save approval and update status together
  return prisma.$transaction(async (tx) => {


    await tx.requisitionApproval.create({
      data: {
        requisitionId: RequisitionId,
        approvedById: hodId,
        decision: "APPROVED",
      },
    });


    return tx.requisition.update({
      where: { id: RequisitionId },
      data: {
        status: "HOD_APPROVED",
      },
      include: {
        approval: {
          include: {
            approvedBy: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });
  });
},

async UpdateRequisition(data: any) {
  const { RequisitionId, createdById, status, reason, items } = data;

  // 1. Check if user exists
  const user = await prisma.user.findUnique({
    where: {
      id: createdById,
    },
  });

  if (!user) {
    throw new Error('The user creating the requisition does not exist');
  }  

  // 2. Check if requisition exists
  const requisition = await prisma.requisition.findUnique({
    where: {
      id: RequisitionId,
    },
    include: {
      items: true,
    },
  });

  if (!requisition) {
    throw new Error('This requisition does not exist');
  }


if (requisition.createdById !== createdById) {
  throw new Error("You cannot update another user's requisition");
}


if (requisition.status !== "DRAFT") {
  throw new Error("Only draft requisitions can be updated");
}

  
  // 3. Allow editing only while in DRAFT
  if (requisition.status !== 'DRAFT') {
    throw new Error('Only draft requisitions can be updated');
  }

  // 4. Validate items
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('At least one requisition item is required');
  }

  const hasInvalidItems = items.some(
    (item: RequisitionItem) =>
      typeof item.description !== 'string' ||
      item.description.trim().length === 0 ||
      !Number.isInteger(item.quantityRequested) ||
      item.quantityRequested <= 0
  );

  if (hasInvalidItems) {
    throw new Error(
      'Every item must have a description and a positive whole-number quantity'
    );
  }

  // 5. Validate reason
  if (typeof reason !== 'string' || reason.trim().length === 0) {
    throw new Error('Requisition reason is required for update');
  }

  // 6. Update requisition and existing items
const updatedData = await prisma.requisition.update({
  where: {
    id: RequisitionId,
  },
  data: {
    reason: reason.trim(),
    items: {
      update: items.map((item: RequisitionItem) => ({
        where: {
          id: item.id,
        },
        data: {
          description: item.description.trim(),
          quantityRequested: item.quantityRequested,
        },
      })),
    },
  },
  include: {
    items: true,
  },
});

return updatedData;

},

// Stores 
async StoresOperation(data: any) {

  const { RequisitionId, items } = data;

  // 1. Find the requisition and its items
  const requisition = await prisma.requisition.findUnique({
    where: {
      id: RequisitionId,
    },
    include: {
      items: true,
    },
  });

  if (!requisition) {
    throw new Error("This requisition does not exist");
  }

  // 2. Check requisition status
  if (requisition.status !== "HOD_APPROVED") {
    throw new Error(
      "Only HOD-approved requisitions can be costed"
    );
  }

  // 3. Check that items is a non-empty array
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("At least one requisition item is required");
  }

  // 4. Validate each item's ID, quantity, and unit cost
  const allItemsValid = items.every(
    (item: any) =>
      typeof item.id === "string" &&
      item.id.trim().length > 0 &&
      Number.isInteger(item.quantityIssued) &&
      item.quantityIssued > 0 &&
      typeof item.unitCost === "number" &&
      Number.isFinite(item.unitCost) &&
      item.unitCost >= 0
  );

  if (!allItemsValid) {
    throw new Error(
      "Every item must have a valid ID, positive quantity issued, and valid unit cost"
    );
  }


  // 5. Prevent duplicate item IDs
  const itemIds = items.map((item: any) => item.id);

  if (new Set(itemIds).size !== itemIds.length) {
    throw new Error("Duplicate requisition items are not allowed");
  }

  // 6. Check that items belong to this requisition
  for (const item of items) {
    const existingItem = requisition.items.find(
      (requisitionItem) => requisitionItem.id === item.id
    );

    if (!existingItem) {
      throw new Error(
        `Item ${item.id} does not belong to this requisition`
      );
    }

    if (item.quantityIssued > existingItem.quantityRequested) {
      throw new Error(
        `Quantity cannot exceed requested quantity for ${existingItem.description}`
      );
    }
  }

  // 7. Calculate and save costs
  const updatedItems = await prisma.$transaction(
    items.map((item: any) =>
      prisma.requisitionItem.update({
        where: {
          id: item.id,
        },
        data: {
          quantityIssued: item.quantityIssued,
          unitCost: item.unitCost,
          totalCost: item.quantityIssued * item.unitCost,
        },
      })
    )
  );

  // 8. Return the result without changing requisition status
  return {
    message: "Stores costing completed successfully",
    requisitionId: RequisitionId,
    items: updatedItems,
  };
},



async AuditVerification(requisitionId: string, auditorId: string) {
  // 1. Find the requisition and its items
  const requisition = await prisma.requisition.findUnique({
    where: { id: requisitionId },
    include: {
      items: true,
    },
  });

  if (!requisition) {
    throw new Error("Requisition does not exist");
  }

  // 2. Check the requisition status
  if (requisition.status !== "HOD_APPROVED") {
    throw new Error("Only HOD-approved requisitions can be audited");
  }

  // 3. Check the auditor
  const auditor = await prisma.user.findUnique({
    where: { id: auditorId },
  });

  if (!auditor || auditor.role !== "AUDIT") {
    throw new Error("Only Internal Audit can verify requisitions");
  }

  // 4. Ensure the requisition has items
  if (requisition.items.length === 0) {
    throw new Error("Cannot verify a requisition without items");
  }

  // 5. Verify every item's cost
const allItemsAreCorrect = requisition.items.every((item) => {
  if (
    item.quantityIssued == null ||
    item.unitCost == null ||
    item.totalCost == null
  ) {
    return false;
  }

  const expectedTotal = 
    item.quantityIssued * Number(item.unitCost);

  return expectedTotal === Number(item.totalCost);
});

if (!allItemsAreCorrect) {
  await prisma.requisition.update({
    where: { id: requisitionId },
    data: {
      status: "REJECTED",
    },
  });

  throw new Error(
    "Audit verification failed: incorrect or missing item costs"
  );
}
  if (!allItemsAreCorrect) {



    throw new Error("Audit verification failed: incorrect or missing item costs");

    
  }

  // 6. Save the audit record and update the status together
  return prisma.$transaction(async (tx) => {
    await tx.auditVerification.create({
      data: {
        requisitionId,
        auditorId,
        decision: "CERTIFIED",
      },
    });

    return tx.requisition.update({
      where: { id: requisitionId },
      data: {
        status: "AUDIT_CERTIFIED",
      },
      // include: {
      //   audit: {
      //     include: {
      //       auditor: {
      //         select: {
      //           id: true,
      //           name: true,
      //         },
      //       },
      //     },
      //   },
      //   items: true,
      // },
    });
  });
},




async FinanceApproval(RequisitionId: string, financeId: string) {
  // 1. Check whether the user exists and is Finance
  const financeUser = await prisma.user.findUnique({
    where: { id: financeId },
  });

  if (!financeUser || financeUser.role !== "FINANCE") {
    throw new Error("Only Finance staff can approve requisitions");
  }

  // 2. Find the requisition and its items
  const requisition = await prisma.requisition.findUnique({
    where: { id: RequisitionId },
    include: {
      items: true,
      audit: true,
    },
  });

  if (!requisition) {
    throw new Error("Requisition does not exist");
  }

  // 3. Only audit-certified requisitions can proceed to Finance
  if (requisition.status !== "AUDIT_CERTIFIED") {
    throw new Error(
      "Only audit-certified requisitions can be reviewed by Finance"
    );
  }

  // 4. Confirm that Audit actually certified the requisition
  if (
    !requisition.audit ||
    requisition.audit.decision !== "CERTIFIED"
  ) {
    throw new Error("Requisition has not been certified by Internal Audit");
  }

  // 5. Ensure the requisition contains items
  if (requisition.items.length === 0) {
    throw new Error("Cannot approve a requisition without items");
  }

  // 6. Ensure every item has valid costing details
  const allItemsAreCorrect = requisition.items.every((item) => {
    if (
      item.quantityIssued == null ||
      item.unitCost == null ||
      item.totalCost == null
    ) {
      return false;
    }

    const expectedTotal =
      item.quantityIssued * Number(item.unitCost);

    return expectedTotal === Number(item.totalCost);
  });

  if (!allItemsAreCorrect) {
    throw new Error(
      "Cannot approve: requisition contains incorrect or missing costing details"
    );
  }

  // 7. Save Finance's approval and update the requisition together
  return prisma.$transaction(async (tx) => {
    await tx.financeApproval.create({
      data: {
        requisitionId: RequisitionId,
        approvedById: financeId,
        decision: "APPROVED",
      },
    });

    // Finance approval sends the requisition back to Stores.
    // It does not mean the items have been physically issued.
    return tx.requisition.update({
      where: { id: RequisitionId },
      data: {
        status: "FINANCE_APPROVED",
      },
      include: {
        finance: {
          include: {
            approvedBy: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        items: true,
      },
    });
  });
},







async GetRequisitionHisotry(RequisitionId: string) {
  return prisma.requisition.findUnique({
    where: {
      id: RequisitionId,
    },
    include: {
      history: {
        include: {
          performedBy: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });
},










}



