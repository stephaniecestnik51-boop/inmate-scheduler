import React, { useState, useEffect } from 'react';
import { scheduleAPI, approvalAPI } from '../api/client';
import './AdminDashboard.css';

interface Schedule {
  id: string;
  user_id: string;
  email: string;
  week_start_date: string;
  status: string;
  created_at: string;
  files?: any[];
}

const AdminDashboard: React.FC = () => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const response = await scheduleAPI.getAll({ status: 'pending' });
      setSchedules(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch schedules');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (scheduleId: string) => {
    try {
      setActionLoading(true);
      await approvalAPI.approve(scheduleId, approvalNotes);
      setSchedules((prev) => prev.filter((s) => s.id !== scheduleId));
      setSelectedSchedule(null);
      setApprovalNotes('');
    } catch (err) {
      setError('Failed to approve schedule');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (scheduleId: string) => {
    try {
      setActionLoading(true);
      await approvalAPI.reject(scheduleId, approvalNotes);
      setSchedules((prev) => prev.filter((s) => s.id !== scheduleId));
      setSelectedSchedule(null);
      setApprovalNotes('');
    } catch (err) {
      setError('Failed to reject schedule');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="admin-dashboard">Loading schedules...</div>;

  return (
    <div className="admin-dashboard">
      <h1>📋 Pending Schedules Review</h1>

      {error && <div className="error-message">{error}</div>}

      <div className="admin-container">
        <div className="schedules-panel">
          {schedules.length === 0 ? (
            <div className="empty-state">
              <p>No pending schedules</p>
            </div>
          ) : (
            <div className="schedules-list">
              {schedules.map((schedule) => (
                <div
                  key={schedule.id}
                  className={`schedule-item ${selectedSchedule?.id === schedule.id ? 'selected' : ''}`}
                  onClick={() => setSelectedSchedule(schedule)}
                >
                  <div className="schedule-info">
                    <h4>{schedule.email}</h4>
                    <p>Week of {new Date(schedule.week_start_date).toLocaleDateString()}</p>
                    <small>{new Date(schedule.created_at).toLocaleString()}</small>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedSchedule && (
          <div className="review-panel">
            <h2>Review Schedule</h2>
            <div className="schedule-details">
              <div className="detail-row">
                <label>Submitted by:</label>
                <span>{selectedSchedule.email}</span>
              </div>
              <div className="detail-row">
                <label>Week:</label>
                <span>{new Date(selectedSchedule.week_start_date).toLocaleDateString()}</span>
              </div>
              <div className="detail-row">
                <label>Status:</label>
                <span className={`status-badge status-${selectedSchedule.status}`}>
                  {selectedSchedule.status}
                </span>
              </div>

              {selectedSchedule.files && selectedSchedule.files.length > 0 && (
                <div className="detail-row">
                  <label>Files:</label>
                  <div className="files-list">
                    {selectedSchedule.files.map((file) => (
                      <a
                        key={file.id}
                        href={`/uploads/${file.file_path}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="file-link"
                      >
                        📎 {file.file_name}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div className="form-group">
                <label htmlFor="notes">Approval Notes</label>
                <textarea
                  id="notes"
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  placeholder="Add notes for the inmate..."
                  rows={4}
                />
              </div>

              <div className="action-buttons">
                <button
                  className="btn-approve"
                  onClick={() => handleApprove(selectedSchedule.id)}
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Processing...' : '✓ Approve'}
                </button>
                <button
                  className="btn-reject"
                  onClick={() => handleReject(selectedSchedule.id)}
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Processing...' : '✕ Reject'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
