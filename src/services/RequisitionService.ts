import { Requisition, RequisitionItem, RequisitionStatus, UserRole } from '@prisma/client';
import { prisma } from '../config/database.js';
import dayjs from 'dayjs';
import { FetchUtils } from '../SearchUtilities/SearchUtils.js';

export const RequisitionService = {

async GetAllRequisition(
  id?: string,
  search?: string,
  status?: RequisitionStatus[],
  dateRange?: string
) {
  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const userRole = user.role;

  const statuses = Array.isArray(status)
    ? status
    : status
      ? [status]
      : undefined;

  // Search through requisition number and related requester
  const searchFilter =
     FetchUtils.FetchRequiation_By_Date_Range_OR_Requester(search);

const dateFilter = FetchUtils.FetchDateRange(dateRange);

  return prisma.requisition.findMany({
    
where: {

  
  AND: [
    // Search filter
    FetchUtils.FetchRequiation_By_Date_Range_OR_Requester(search),

    // Status filter
    ...(statuses?.length
      ? [{ status: { in: statuses } }]
      : []),

    // Date range filter
    FetchUtils.FetchDateRange(dateRange),

    // Role-based filter
    userRole === "STORES"
      ? {
          OR: [
            { status: "HOD_APPROVED" },
            { createdById: user.id },
          ],
        }
      : userRole === "HOD"
        ? {
            OR: [
              { status: "SUBMITTED" },
              { status: "HOD_APPROVED" },
              { createdById: user.id },
            ],
          }
        : userRole === "AUDIT"
          ? {
              OR: [
                { status: "STORES_COSTED" },
                { createdById: user.id },
              ],
            }
          : userRole === "FINANCE"
            ? {
                OR: [
                  { status: "FINANCE_APPROVED" },
                  { status: "AUDIT_CERTIFIED" },
                  { createdById: user.id },
                ],
              }
            : userRole === "ADMIN" || userRole === "IT_ADMIN"
              ? {}
              : { createdById: user.id },
  ],
},
    select: {
      id: true,
      requisitionNo: true,
      date: true,
      status: true,
      reason: true,
      createdAt: true,
      requisitionType: true,
      notes: true,

      items: {
        select: {
          id: true,
          description: true,
          quantityRequested: true,
          quantityIssued: true,
          unitCost: true,
          totalCost: true,
        },
      },

      createdBy: {
        select: {
          firstname: true,
          lastname: true,
          middlename: true,
          email: true,
          phone: true,
        },
      },

      evidenceRequests: {
        select: {
          message: true,
          submissionNote: true,
          status: true,
        },
      },
    },

    orderBy: {
      createdAt: "desc",
    },
  });
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



  // 5. Validate requisition date
  // if (!data.date || !dayjs(data.date).isValid()) {
  //   throw new Error("A valid requisition date is required");Crea
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


//  Special requisition for toner
async TonerRquisition(data: any,) {
  // 1. Check if the user exists
  const isFoundUser = await prisma.user.findUnique({
    where: {
      id: data.createdById,
    },
  });

  if (!isFoundUser) {
    throw new Error("User creating this requisition does not exist");
  }

  // 2. Validate requisition items
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
  const requisitionDate = dayjs(data.date);

  if (
    !requisitionDate.isValid() ||
    !requisitionDate.isSame(dayjs(), "day")
  ) {
    throw new Error("Requisition date must be today's date");
  }

  // 6. Validate requisition type
  if (data.requisitionType !== "TONER") {
    throw new Error("Invalid requisition type");
  }

  // 7. Generate requisition number
  const requisitionNumber = `REQ-${Date.now()}`;


  // 8. Create toner requisition
  const TonerRequest = await prisma.requisition.create({
    data: {
      requisitionNo: requisitionNumber,
      createdById: isFoundUser.id,
      date: requisitionDate.toDate(),
      status: "AWAITING_IT_VERIFICATION",
      requisitionType:"TONER",
      reason: data.reason.trim(),

      items: {
        create: data.items.map((item: RequisitionItem) => ({
          description: item.description.trim(),
          quantityRequested: item.quantityRequested,
        })),
      },
    },
    
    include: {
      items: true,
    },
  });

  // 9. Return the created requisition
  return TonerRequest;
},

// Verify requisition by IT
async ITVerification(data: any) {
  // 1. Validate required data
  if (!data.requisitionId) {
    throw new Error("Requisition ID is required");
  }

  if (!data.verifiedById) {
    throw new Error("IT verifier ID is required");
  }

  // 2. Check that the verifier exists
  const isFoundUser = await prisma.user.findUnique({
    where: {
      id: data.verifiedById,
    },
    select: {
      id: true,
      role: true,
    },
  });

  if (!isFoundUser) {
    throw new Error("User verifying this requisition does not exist");
  }

  // 3. Check verifier role
  if (
    isFoundUser.role !== "ADMIN" &&
    isFoundUser.role !== "IT_ADMIN"
  ) {
    throw new Error(
      "Only an Admin or IT Admin can verify this requisition"
    );
  }

  // 4. Check that the requisition exists
  const requisition = await prisma.requisition.findUnique({
    where: {
      id: data.requisitionId,
    },
    select: {
      id: true,
      requisitionNo: true,
      status: true,
    },
  });

  if (!requisition) {
    throw new Error("Requisition does not exist");
  }

  if (requisition.status === "IT_VERIFIED") {
    throw new Error("This requisition has already been verified by IT");
  }

  // 5. Find the evidence request
  const hasEvidence = await prisma.evidenceRequest.findFirst({
    where: {
      requisitionId: data.requisitionId,
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      status: true,
      submissionNote: true,
      submittedAt: true,
    },
  });

  if (!hasEvidence) {
    throw new Error("No evidence request exists for this requisition");
  }

  // 6. Allow REQUESTED or STAFF_SUBMITTED
  if (
    hasEvidence.status !== "REQUESTED" &&
    hasEvidence.status !== "STAFF_SUBMITTED"
  ) {
    throw new Error(
      `Cannot verify requisition because evidence status is "${hasEvidence.status}"`
    );
  }

  // 7. Update evidence and requisition in one transaction
  const result = await prisma.$transaction(async (tx) => {
    // If evidence is still REQUESTED, change it to STAFF_SUBMITTED
    const updatedEvidence =
      hasEvidence.status === "REQUESTED"
        ? await tx.evidenceRequest.update({
            where: {
              id: hasEvidence.id,
            },
            data: {
              status: "STAFF_SUBMITTED",
              submittedById: data.verifiedById,
              submittedAt: new Date(),
              submissionNote:
                data.comment?.trim() ||
                "Evidence submitted for IT verification",
            },
          })
        : hasEvidence;

    // Create IT verification record
    const verificationRecord = await tx.iTVerification.create({
      data: {
        requisitionId: data.requisitionId,
        verifiedById: data.verifiedById,
        comment: data.comment?.trim() || null,
        decision: "CERTIFIED",
      },
    });

    // Update requisition status
    const updatedRequest = await tx.requisition.update({
      where: {
        id: data.requisitionId,
      },
      data: {
        status: "IT_VERIFIED",
      },
    });

    return {
      updatedEvidence,
      verificationRecord,
      updatedRequest,
    };
  });

  // 8. Return all updated records
  return {
    message: "Evidence updated and requisition successfully verified by IT",
    updatedEvidence: result.updatedEvidence,
    verificationRecord: result.verificationRecord,
    updatedRequest: result.updatedRequest,
  };
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

  if (!hod || hod.role !== "HOD" && hod.role !== "ADMIN") {
    throw new Error("Access Denied");
  }

  // 4. Save approval and status together
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
      // include: {
      //   approval: {
      //     include: {
      //       approvedBy: {
      //         select: {
      //           id: true,
      //           name: true,
      //         },
      //       },
      //     },
      //   },
      // },
    });
  });
},


async UpdateRequisition(data: any) {
  const {
    RequisitionId,
    createdById,
    reason,
    items,
    notes,
  } = data;

  // 1. Check if the user exists
  const user = await prisma.user.findUnique({
    where: {
      id: createdById,
    },
  });

  if (!user) {
    throw new Error("User does not exist");
  }

  // 2. Check if the requisition exists
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

  // 3. ADMIN and IT_ADMIN can request supporting evidence
  if (user.role === "ADMIN" || user.role === "IT_ADMIN") {
    if (typeof notes !== "string" || !notes.trim()) {
      throw new Error("Please provide an evidence request message");
    }

    return prisma.$transaction(async (tx) => {
      // Update the requisition's existing notes
      const updatedRequisition = await tx.requisition.update({
        where: {
          id: RequisitionId,
        },
        data: {
          notes: notes.trim(),
        },
        include: {
          items: true,
        },
      });

      // Create the evidence request record
      const evidenceRequest = await tx.evidenceRequest.create({
        data: {
          message: notes.trim(),
          requisitionId: RequisitionId,
          requestedById: data.requestedById,
          // status: "REQUESTED",
        },
      });

      return {
        ...updatedRequisition,
        evidenceRequest,
      };
    });
  }

  // 4. Other users can only update their own DRAFT requisitions
  if (requisition.createdById !== createdById) {
    throw new Error("You cannot update another user's requisition");
  }

  if (requisition.status !== "DRAFT") {
    throw new Error("Only draft requisitions can be updated");
  }

  // 5. Validate items
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("At least one requisition item is required");
  }

  const hasInvalidItems = items.some(
    (item: RequisitionItem) =>
      typeof item.description !== "string" ||
      item.description.trim().length === 0 ||
      !Number.isInteger(item.quantityRequested) ||
      item.quantityRequested <= 0
  );

  if (hasInvalidItems) {
    throw new Error(
      "Every item must have a description and a positive whole-number quantity"
    );
  }

  // 6. Validate reason
  if (typeof reason !== "string" || reason.trim().length === 0) {
    throw new Error("Requisition reason is required for update");
  }

  // 7. Update the draft requisition
  return prisma.$transaction(async (tx) => {
    const updatedRequisition = await tx.requisition.update({
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

    return updatedRequisition;
  });
},


//  Submuttin an evidence
async EvidenceSubmission(evidence: any) {

console.log("Received evidence:", evidence);
console.log("Received requisitionId:", evidence?.requisitionId);

  const user = await prisma.user.findUnique({
    where: {
      id: evidence.submittedById,
    },
  });

  if (!user) {
    throw new Error("User does not exist");
  }

  const RequisitionId = evidence.requisitionId;

  const foundRequisition = await prisma.requisition.findUnique({
    where: {
      id: RequisitionId,
    },
    select: {
      id: true,
    },
  });

  if (!foundRequisition) {
    throw new Error("This requisition does not exist");
  }

  if (evidence.status !== "STAFF_SUBMITTED") {
    throw new Error("Evidence submission status does not match");
  }

  const foundEvidenceRequest = await prisma.evidenceRequest.findFirst({
    where: {
      requisitionId: foundRequisition.id,
      status: "REQUESTED",
    },
  });

  if (!foundEvidenceRequest) {
    throw new Error("No pending evidence request found for this requisition");
  }

  return prisma.evidenceRequest.update({
    where: {
      id: foundEvidenceRequest.id,
    },
    data: {
      status: "STAFF_SUBMITTED",
      submittedById: evidence.submittedById,
      submissionNote: evidence.submissionNote,
      submittedAt: new Date(),
    },
  });
},





// Stores 
async StoresOperation(data: any) {
  const { RequisitionId, items } = data;

  // 1. Validate requisition ID
  if (
    typeof RequisitionId !== "string" ||
    RequisitionId.trim() === ""
  ) {
    throw new Error("Please select a valid requisition");
  }

  // 2. Find requisition and its items
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

  // 3. Check requisition status
  if (requisition.status !== "HOD_APPROVED" &&  requisition.status !== "IT_VERIFIED" ) {
    throw new Error(
      "Only HOD-approved or IT_Verifed requisitions can be costed"
    );
  }

  // 4. Check that items is a non-empty array
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error(
      "Please complete the costing for every item"
    );
  }

  // 5. Prevent duplicate item IDs
  const itemIds = items.map((item: any) => item.id);

  if (new Set(itemIds).size !== itemIds.length) {
    throw new Error(
      "Duplicate requisition items are not allowed"
    );
  }

  // 6. Ensure every requisition item is included
  if (items.length !== requisition.items.length) {
    throw new Error(
      "Please complete the costing for every item"
    );
  }

  // 7. Validate each item
  for (const item of items) {

    const existingItem = requisition.items.find(
      (requisitionItem) => requisitionItem.id === item.id
    );

    if (!existingItem) {
      throw new Error(
        `Item ${item.id} does not belong to this requisition`
      );
    }

    const quantityIssued = Number(item.quantityIssued);
    const unitCost = Number(item.unitCost);

    const IsValid =
      typeof item.id === "string" &&

      item.id.trim() !== "" &&

      item.quantityIssued !== undefined &&

      item.quantityIssued !== null &&

      item.quantityIssued !== "" &&

      Number.isInteger(quantityIssued) &&

      quantityIssued >= 0 &&

      quantityIssued <= existingItem.quantityRequested &&

      item.unitCost !== undefined &&

      item.unitCost !== null &&

      item.unitCost !== "" &&

      Number.isFinite(unitCost) &&

      unitCost >= 0;

    if (!IsValid) {
      throw new Error(
        `Please enter a valid quantity and unit cost for ${existingItem.description}`
      );
    }
  }

  await prisma.$transaction(async (tx) => {

  // 1. Update each requisition item
  const updatedItems = await Promise.all(
    
    items.map((item: any) => {
      const quantityIssued = Number(item.quantityIssued);
      const unitCost = Number(item.unitCost);

      return tx.requisitionItem.update({
        where: {
          id: item.id,
        },
        data: {
          quantityIssued,
          unitCost,
          totalCost: quantityIssued * unitCost,
        },
      });
    })
  );

  // 2. Update the requisition status
  await tx.requisition.update({
    where: {
      id: RequisitionId,
    },
    data: {
      status: "STORES_COSTED", // Replace with the correct next status
    },
  });

  return updatedItems;
});
  // 9. Return result without changing requisition status
  // return {
  //   message: "Stores costing completed successfully",
  //   requisitionId: RequisitionId,
  //   items: updatedItems,
  // };
},


async AuditVeriification(requisitionId:string, auditorId:string, comment:string){


  const requisition = await prisma.requisition.findUnique({
    where:{
      id:requisitionId
    }, 
    include:{
      items:true
    }
  })

  if (!requisition) {
    throw new Error ("This requisition does not exists")
  }


  if (requisition.status !== "STORES_COSTED"){
    throw new Error ("This requisition is not available and cannot be verified by Audit. Kindly pass through the necessary validations")
  }

  const auditor = await prisma.user.findUnique({
    where:{
      id:auditorId
    }
  })

  if (!auditor){
    throw new Error ("There is no such auditor to perform this task on the requisition")
  }

  const isVerifiedAuditor = auditor.role

  if (isVerifiedAuditor !== "AUDIT" && isVerifiedAuditor !== "ADMIN" ){
    throw new Error ("Access denied, you do not have permission to perform this task !!!")
  } else {


    if (requisition.items.length == 0){
      throw new Error("Requisition must contain at least one item")
    }

  const AllItemsAreCorrect = requisition.items.every(
  (item: RequisitionItem) => {
    const Calculated =
      Number(item.quantityIssued) * Number(item.unitCost);

    return (
      item.quantityIssued != null &&
      item.unitCost != null &&
      item.totalCost != null &&
      Number(item.quantityIssued) > 0 &&
      Number(item.unitCost) >= 0 &&
      Calculated === Number(item.totalCost)
    );
  }
);


    if (AllItemsAreCorrect){

return prisma.$transaction(async (tx)=>{

await tx.auditVerification.create({
  data:{
  requisitionId:requisitionId,
  auditorId:auditorId,
  decision:"CERTIFIED",
  comment:comment
  }   

})


await tx.requisition.update({
  where:{
    id:requisitionId
  },
  data:{
    status:"AUDIT_CERTIFIED"
  }
})


})

    } else {
      
return prisma.$transaction(async (tx)=>{

await tx.auditVerification.create({
  data:{
  requisitionId:requisitionId,
  auditorId:auditorId,
  decision:"REJECTED",
  comment:comment
  }   

})


await tx.requisition.update({
  where:{
    id:requisitionId
  },
  data:{
    status:"REJECTED"
  }
})


})

    }








  }

 



},



// Finance Approved
async FinanceApproval(requisitionId:string, approvedById:string,
  comment?:string
 ) {

const requisition = await prisma.requisition.findUnique({
  where:{
    id:requisitionId
  },

  include:{
    items:true
  }
})


if (!requisition){
  throw new Error ("This requisition does not exists for an approval")
}


const user = await prisma.user.findUnique({
  where:{
    id:approvedById
  }
})

if (!user){
  throw new Error ("This user does not exist")
}


if (user.role !== "FINANCE" && user.role !== "ADMIN"){
  throw new Error ("Access denied")
}


if (requisition.status !== "AUDIT_CERTIFIED"){
  throw new Error ("This requisition is not certified by audit")
}


const items = requisition.items

if (!items || items.length == 0 ){
  throw new Error ("Requisition must contain value")
}

const IsAuditCertified = items.every((item: RequisitionItem) => {
  return (
    item.description !== "" &&
    item.quantityIssued !== null &&
    item.unitCost !== null &&
    item.totalCost !== null &&
    item.totalCost.toNumber() ===
      item.quantityIssued * item.unitCost.toNumber()
  );
});


if (!IsAuditCertified){
throw new Error ("Invalid Configuration")
} else {


  return prisma.$transaction(async(tx)=>{


    const updatedRequisition = await tx.requisition.update({
      where:{
        id:requisitionId
      },

      data:{
        status:"FINANCE_APPROVED"
      }
    })


    const FinanceApproved = await tx.financeApproval.create({
data:{
  requisitionId:requisitionId,
  approvedById:approvedById,
  decision:"APPROVED",
  comment
}

    })

return {
  updatedRequisition,
  FinanceApproved
}

  })
}

},

async RecordIssuance(requisitionId:string, suppliedById:string){

  const requisitions = await prisma.requisition.findUnique({
    where:{
      id:requisitionId
    },
    include:{
      items:true
    }
  })


  if (!requisitions){
    throw new Error ("This does not exists")
  }


  const user = await prisma.user.findUnique({
where:{
  id:suppliedById
}
  })

if (!user){
throw new Error ("This user does not exist")
}


const userRole = user.role

if (userRole !== "ADMIN" && userRole !== "STORES") {
  throw new Error ("Access denied")
} 


if (requisitions.status !== "FINANCE_APPROVED"){
  throw new Error ("This requisition has not reached the final stage")
}


const items:any[] = requisitions.items

if (!Array.isArray(items) || items.length == 0){
throw new Error ("Must be an Array")
}

const isAllItemsValid = items.every((item: RequisitionItem) => {
  return (
    item.description &&
    item.quantityIssued != null &&
    item.quantityIssued > 0 &&
    item.unitCost != null &&
    item.unitCost.toNumber() >= 0
  );
});


if (!isAllItemsValid){
  throw new Error ("Requisition contains invalid items")
} else {



console.log("Requisition ID:", requisitionId);
console.log("Current status:", requisitions.status);


return prisma.$transaction(async (tx)=>{

const updatedRequisitions = await tx.requisition.update({
  where:{
    id:requisitionId
  },

  data:{
    status:"COMPLETED"
  }
})

const Issuances = await tx.requisitionIssuance.create({
data:{
  requisitionId:requisitionId,
  suppliedById
}
})


return {
  updatedRequisitions,
  Issuances
}

      })

}


      
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



