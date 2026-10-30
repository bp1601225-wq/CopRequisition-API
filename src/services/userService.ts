import { DEFAULT_MAX_VERSION } from 'node:tls';
import { prisma } from '../config/database.js';
import argon2 from "argon2"
import { Prisma, User } from '@prisma/client';
import { valid } from 'joi';


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
    password:true,
    
    department:{
        select:{
            name:true,
            createdAt:true,
            updatedAt:true
        }
    },


    
},

orderBy:{
    createdAt:"desc"
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




async UpdateUser(data: any) {
  const {
    id,
    firstname,
    middlename,
    lastname,
    phone,
    email,
    role,
  } = data;

  // 1. Check whether the user exists
  const user = await prisma.user.findUnique({
    where: {
      id,
    },
  });

  if (!user) {
    throw new Error("The user you are trying to update does not exist");
  }

  // 2. Check whether another user already uses this email
  const isFoundEmail = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (isFoundEmail && isFoundEmail.id !== id) {
    throw new Error("Email already taken");
  }

  // 3. Check whether another user already uses this phone number
  const isFoundPhone = await prisma.user.findUnique({
    where: {
      phone,
    },
  });

  if (isFoundPhone && isFoundPhone.id !== id) {
    throw new Error("Phone number already exists");
  }

  // 4. Update the user
  return prisma.user.update({
    where: {
      id,
    },
    data: {
      firstname,
      middlename,
      lastname,
      phone,
      email,
      role,
    },
  });
},

async DeleteUser(id:string){

    return prisma.user.delete({
        where:{
            id
        }
    })

    
},


//  Create Multiple users

async UploadUsers(data: any[]) {

  if (!Array.isArray(data) || data.length === 0 ){
    throw new Error ("Cannot be an empty array")
  }

 const Users = await Promise.all(
    data.map(async (user: any) => ({
      ...user,
      password: await argon2.hash(user.password),
    }))
  );


  return prisma.user.createMany({
  data: Users.map((user: any) => ({
    ...user,
    EmployeeCode: user.EmployeeCode?.trim(),
  })),
  skipDuplicates: true,
});




}
    }