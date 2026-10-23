import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';

import { UserRouter } from './routes/userRoutes.js';
import { authMiddleware } from './middleware/auth.middleware.js';
import { AuthRoutes } from './controllers/AuthenticationRoutes.js';
import { RequisitionRouter } from './routes/requisitionRoutes.js';

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);
app.use(morgan('dev'));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));


// app.use('/api', routes);


// apply all middleware for protectedRoutes

app.use(AuthRoutes)

app.use(authMiddleware)

app.use(UserRouter)
app.use(RequisitionRouter)




export default app;
