import React, { useState, useEffect } from 'react';
import { notificationAPI } from '../api/client';
import './Notifications.css';

interface Notification {
  id: string;
  message: string;
  notification_type: string;
  read: boolean;
  created_at: string;
  schedule_id?: string;
}

interface NotificationsProps {
  onClose: () => void;
  isOpen: boolean;
}

const Notifications: React.FC<NotificationsProps> = ({ onClose, isOpen }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationAPI.getAll();
      setNotifications(response.data);
      setUnreadCount(response.data.filter((n: any) => !n.read).length);
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationAPI.markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, read: true } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read', error);
    }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      await notificationAPI.delete(notificationId);
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    } catch (error) {
      console.error('Failed to delete notification', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="notifications-modal-overlay" onClick={onClose}>
      <div className="notifications-modal" onClick={(e) => e.stopPropagation()}>
        <div className="notifications-header">
          <h2>Notifications {unreadCount > 0 && <span className="badge">{unreadCount}</span>}</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {unreadCount > 0 && (
          <button className="mark-all-read" onClick={handleMarkAllAsRead}>
            Mark all as read
          </button>
        )}

        {loading ? (
          <div className="loading">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="empty-notifications">
            <p>No notifications yet</p>
          </div>
        ) : (
          <div className="notifications-list">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`notification-item ${notification.read ? 'read' : 'unread'}`}
              >
                <div className="notification-content">
                  <p className="notification-message">{notification.message}</p>
                  <small className="notification-time">
                    {new Date(notification.created_at).toLocaleString()}
                  </small>
                </div>
                <div className="notification-actions">
                  {!notification.read && (
                    <button
                      className="btn-read"
                      onClick={() => handleMarkAsRead(notification.id)}
                    >
                      Mark read
                    </button>
                  )}
                  <button
                    className="btn-delete"
                    onClick={() => handleDelete(notification.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
