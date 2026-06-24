import express, { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import pool from '../config/database';
import { authMiddleware, caseworkerOnly } from '../middleware/auth';

const router: Router = express.Router();

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

// Approve schedule
router.post('/:scheduleId/approve', authMiddleware, caseworkerOnly, async (req: AuthRequest, res: Response) => {
  try {
    const { scheduleId } = req.params;
    const { notes } = req.body;
    const caseworkerId = req.user?.id;

    // Check if schedule exists
    const scheduleResult = await pool.query('SELECT * FROM schedules WHERE id = $1', [scheduleId]);
    if (scheduleResult.rows.length === 0) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    // Record approval
    const approvalId = uuidv4();
    await pool.query(
      'INSERT INTO schedule_approvals (id, schedule_id, caseworker_id, action, notes) VALUES ($1, $2, $3, $4, $5)',
      [approvalId, scheduleId, caseworkerId, 'approved', notes || null]
    );

    // Update schedule status
    await pool.query('UPDATE schedules SET status = $1, updated_at = NOW() WHERE id = $2', ['approved', scheduleId]);

    // Create notification for inmate
    const schedule = scheduleResult.rows[0];
    const notifId = uuidv4();
    await pool.query(
      'INSERT INTO notifications (id, user_id, schedule_id, notification_type, message) VALUES ($1, $2, $3, $4, $5)',
      [notifId, schedule.user_id, scheduleId, 'schedule_approved', 'Your schedule has been approved']
    );

    res.json({ message: 'Schedule approved successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Reject schedule
router.post('/:scheduleId/reject', authMiddleware, caseworkerOnly, async (req: AuthRequest, res: Response) => {
  try {
    const { scheduleId } = req.params;
    const { notes } = req.body;
    const caseworkerId = req.user?.id;

    // Check if schedule exists
    const scheduleResult = await pool.query('SELECT * FROM schedules WHERE id = $1', [scheduleId]);
    if (scheduleResult.rows.length === 0) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    // Record rejection
    const approvalId = uuidv4();
    await pool.query(
      'INSERT INTO schedule_approvals (id, schedule_id, caseworker_id, action, notes) VALUES ($1, $2, $3, $4, $5)',
      [approvalId, scheduleId, caseworkerId, 'rejected', notes || null]
    );

    // Update schedule status
    await pool.query('UPDATE schedules SET status = $1, updated_at = NOW() WHERE id = $2', ['rejected', scheduleId]);

    // Create notification for inmate
    const schedule = scheduleResult.rows[0];
    const notifId = uuidv4();
    await pool.query(
      'INSERT INTO notifications (id, user_id, schedule_id, notification_type, message) VALUES ($1, $2, $3, $4, $5)',
      [notifId, schedule.user_id, scheduleId, 'schedule_rejected', `Schedule rejected: ${notes || 'No reason provided'}`]
    );

    res.json({ message: 'Schedule rejected successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
