import { Requisition, RequisitionItem, RequisitionStatus, UserRole } from '@prisma/client';
import { prisma } from '../config/database.js';
import dayjs from 'dayjs';

export const RequisitionService = {

async GetAllRequisition(id?: string, status?:RequisitionStatus[]) {
  const user = await prisma.user.findUnique({
    where: {
      id,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const userRole = user.role;



const statuses = Array.isArray(status)
  ? status : status ? [status] : undefined;


  return prisma.requisition.findMany({

where: {
  ...(status && { status:{
    in:statuses
  }}),

  ...(userRole === "STORES"
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



       : userRole === "ADMIN"
    
    ? {
        
      }
    
      : {
        createdById: user.id,
      }
    
    ),
},

    select: {
      id: true,
      requisitionNo: true,
      date: true,
      status: true,
      reason: true,
      createdAt: true,

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

    },

    orderBy:{

    createdAt:"desc"
    }
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

  if (!hod || hod.role !== "HOD" && hod.role !== "ADMIN") {
    throw new Error("Access Denied");
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
  if (requisition.status !== "HOD_APPROVED") {
    throw new Error(
      "Only HOD-approved requisitions can be costed"
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



