import { Router } from 'express';

import { login } from '../controllers/auth.controller.js';
import { validate } from '../middleware/validation.middleware.js';
import { loginValidationSchema } from '../validations/auth.validation.js';

const router = Router();

router.post('/login', validate(loginValidationSchema), login);

export default router;
