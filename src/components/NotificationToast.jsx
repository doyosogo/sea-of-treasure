import { useNotifications } from "../context/NotificationContext.jsx";

const toastMeta = {
  success: { accent: "success", mark: "✓" },
  info: { accent: "info", mark: "i" },
  warning: { accent: "warning", mark: "!" },
  error: { accent: "error", mark: "!" }
};

function NotificationToast() {
  const { notifications, dismissNotification } = useNotifications();

  if (notifications.length <= 0) {
    return null;
  }

  return (
    <div className="notification-center" aria-live="polite" aria-relevant="additions removals">
      {notifications.map((notification) => {
        const meta = toastMeta[notification.type] ?? toastMeta.info;

        return (
          <button
            className={`notification-toast ${notification.type}`}
            key={notification.id}
            onClick={() => dismissNotification(notification.id)}
            type="button"
          >
            <span className={`notification-accent ${meta.accent}`} aria-hidden="true">
              {meta.mark}
            </span>
            <span className="notification-copy">
              <strong>{notification.title}</strong>
              {notification.message ? <span>{notification.message}</span> : null}
              {notification.detail ? <small>{notification.detail}</small> : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default NotificationToast;
