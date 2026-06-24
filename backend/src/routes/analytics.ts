import express, { Router, Request, Response } from 'express';
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

// Get analytics statistics
router.get('/stats', authMiddleware, caseworkerOnly, async (req: AuthRequest, res: Response) => {
  try {
    // Total schedules
    const totalResult = await pool.query('SELECT COUNT(*) as count FROM schedules');
    const total = parseInt(totalResult.rows[0].count);

    // Approved schedules
    const approvedResult = await pool.query(
      "SELECT COUNT(*) as count FROM schedules WHERE status = 'approved'"
    );
    const approved = parseInt(approvedResult.rows[0].count);

    // Rejected schedules
    const rejectedResult = await pool.query(
      "SELECT COUNT(*) as count FROM schedules WHERE status = 'rejected'"
    );
    const rejected = parseInt(rejectedResult.rows[0].count);

    // Pending schedules
    const pendingResult = await pool.query(
      "SELECT COUNT(*) as count FROM schedules WHERE status = 'pending'"
    );
    const pending = parseInt(pendingResult.rows[0].count);

    // Schedules by week
    const byWeekResult = await pool.query(`
      SELECT 
        DATE_TRUNC('week', week_start_date)::date as week,
        COUNT(*) as total,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending
      FROM schedules
      GROUP BY DATE_TRUNC('week', week_start_date)
      ORDER BY week DESC
      LIMIT 12
    `);

    // Approval rate
    const approvalRate = total > 0 ? ((approved / total) * 100).toFixed(1) : 0;

    res.json({
      summary: {
        total,
        approved,
        rejected,
        pending,
        approvalRate: parseFloat(String(approvalRate)),
      },
      byWeek: byWeekResult.rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get schedules by status
router.get('/by-status', authMiddleware, caseworkerOnly, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT status, COUNT(*) as count
      FROM schedules
      GROUP BY status
    `);

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get top users
router.get('/top-users', authMiddleware, caseworkerOnly, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT 
        u.id,
        u.email,
        COUNT(s.id) as schedule_count,
        SUM(CASE WHEN s.status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN s.status = 'rejected' THEN 1 ELSE 0 END) as rejected
      FROM users u
      LEFT JOIN schedules s ON u.id = s.user_id
      WHERE u.role = 'inmate'
      GROUP BY u.id, u.email
      ORDER BY schedule_count DESC
      LIMIT 10
    `);

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
