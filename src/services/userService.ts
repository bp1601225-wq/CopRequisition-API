import { DEFAULT_MAX_VERSION } from 'node:tls';
import { prisma } from '../config/database.js';
import argon2 from "argon2"


export const UserService  = {


async GetAllUsers(){

    return prisma.user.findMany({
        
select:{

    id:true,
    firstname:true,
    middlename:true,
    lastname:true,
    email:true,
    role:true,
    phone:true,
    
    department:{
        select:{
            name:true,
            createdAt:true,
            updatedAt:true
        }
    },
    
}       
    })
},


async CreateUsers(data: any) {
  const isFoundEmail = await prisma.user.findUnique({
    where: {
      email: data.email
    }
  });

  if (isFoundEmail) {
    throw new Error("Email already taken");
  }

  const isFoundPhone = await prisma.user.findUnique({
    where: {
      phone: data.phone
    }
  });

  if (isFoundPhone) {
    throw new Error("Phone number already exists");
  }

  const hashedPassword = await argon2.hash(data.password);

  return prisma.user.create({
    data: {
      ...data,
      password: hashedPassword
    }
  });
},



async UpdateUser(data:any){


const {id, firstname, middlename, lastname, phone, email, role} = data

    const user = await prisma.user.findUnique({
        where:{
            id
        }
    })

       if (!user){
        throw new Error ("The user you are trying to update does not exists")
    }


       const isFoundEmail = await prisma.user.findUnique({
        where:{
            email:user.email
        }
    })


    const isFoundPhone = await prisma.user.findUnique({
       
        where:{
            phone:user.phone
        }
    })
        if (isFoundEmail){
            throw new Error ("Email alreaady taken")
        }

        if (isFoundPhone){
            throw new Error ("Phone number already exists")
        }


return prisma.user.update({
    where:{
        id
    }, 

     data:{
        firstname,
        middlename,
        lastname,
        phone,
        email,
        role
     }
})

        }, 

async DeleteUser(id:string){

    return prisma.user.delete({
        where:{
            id
        }
    })

    
}


}