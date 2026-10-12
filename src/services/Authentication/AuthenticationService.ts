import argon2 from "argon2";
import { prisma } from '../../config/database.js';
import jwt from "jsonwebtoken";


export const AuthenticationService = {

async Login(data:any){

    const isFoundUser = await prisma.user.findUnique({
        where:{
            email:data.email
        },
    })

if (!isFoundUser){
    throw new Error ("This email does not exist")
}


const isPasswordCorrect = await argon2.verify(
    isFoundUser.password, data.password
)

if (!isPasswordCorrect){
    throw new Error ("The password you typed is not correct")
}

//  create jwt
const token = jwt.sign({
    id:isFoundUser.id,
    email:isFoundUser.email,
    firstname:isFoundUser.firstname,
    middlename:isFoundUser.middlename,
    lastname:isFoundUser.lastname,
    role:isFoundUser.role,
},

process.env.JWT_SECRET!,

{
expiresIn: "1d"
}




)



return {
    token,
    sucess:true,

    user:{
    id:isFoundUser.id,
    email:isFoundUser.email,
    firstname:isFoundUser.firstname,
    middlename:isFoundUser.middlename,
    lastname:isFoundUser.lastname,
    role:isFoundUser.role,
    }
    
}



},

async Logout(){

}


}