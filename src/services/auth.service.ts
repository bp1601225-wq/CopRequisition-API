import { prisma } from '../config/database.js';
import { AppError } from '../utils/app-error.js';
import { generateToken } from '../utils/jwt.js';
import { comparePassword } from '../utils/password.js';

interface LoginRequest {
  email: string;
  password: string;
}

export const authService = {
  async login({ email, password }: LoginRequest) {
    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { department: true },
    });

    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      throw new AppError('Invalid credentials', 401);
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        departmentId: user.departmentId,
        department: user.department
          ? {
              id: user.department.id,
              name: user.department.name,
            }
          : null,
      },
      token,
    };
  },
};
