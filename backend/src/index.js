import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import authRouter     from './routes/auth.js';
import leaveRouter    from './routes/leave.js';
import otRouter       from './routes/ot.js';
import approvalRouter from './routes/approval.js';
import webhookRouter  from './routes/webhook.js';
import adminRouter    from './routes/admin.js';
import requestsRouter      from './routes/requests.js';
import announcementsRouter from './routes/announcements.js';

import { errorHandler } from './middleware/errorHandler.js';

// Start reminder cron jobs (runs every 30 min)
import './jobs/reminderJob.js';

const app = express();

app.use(helmet());
const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.LIFF_URL,
].filter(Boolean);

app.use(cors({
  origin: allowedOrigins.length ? allowedOrigins : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(morgan('dev'));

// LINE webhook must receive the raw body for X-Line-Signature verification
app.use('/webhook/line', express.raw({ type: 'application/json' }));

// All other routes use parsed JSON
app.use(express.json());

// Health check (used by Render + UptimeRobot)
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/auth',     authRouter);
app.use('/leave',    leaveRouter);
app.use('/ot',       otRouter);
app.use('/approval', approvalRouter);
app.use('/webhook',  webhookRouter);
app.use('/admin',    adminRouter);
app.use('/requests',      requestsRouter);
app.use('/announcements', announcementsRouter);

app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`HR System backend running on port ${PORT}`);
});
