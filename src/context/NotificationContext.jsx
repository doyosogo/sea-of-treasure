import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

const NotificationContext = createContext(null);
let nextNotificationId = 1;

function normalizeNotificationInput(message, options = {}) {
  if (message && typeof message === "object") {
    return {
      title: message.title ?? null,
      message: message.message ?? "",
      detail: message.detail ?? null
    };
  }

  return {
    title: options.title ?? null,
    message: message ?? "",
    detail: options.detail ?? null
  };
}

function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const timersRef = useRef(new Map());

  const dismissNotification = useCallback((notificationId) => {
    setNotifications((current) => current.filter((notification) => notification.id !== notificationId));

    const timerId = timersRef.current.get(notificationId);
    if (timerId) {
      window.clearTimeout(timerId);
      timersRef.current.delete(notificationId);
    }
  }, []);

  const pushNotification = useCallback((type, message, options = {}) => {
    const normalized = normalizeNotificationInput(message, options);
    const id = nextNotificationId++;
    const notification = {
      id,
      type,
      title: normalized.title ?? normalized.message,
      message: normalized.title ? normalized.message : null,
      detail: normalized.detail ?? null
    };

    setNotifications((current) => [...current, notification]);

    const duration = Math.max(1000, options.duration ?? 4000);
    const timerId = window.setTimeout(() => {
      dismissNotification(id);
    }, duration);

    timersRef.current.set(id, timerId);

    return id;
  }, [dismissNotification]);

  const showSuccess = useCallback((message, options) => pushNotification("success", message, options), [pushNotification]);
  const showInfo = useCallback((message, options) => pushNotification("info", message, options), [pushNotification]);
  const showWarning = useCallback((message, options) => pushNotification("warning", message, options), [pushNotification]);
  const showError = useCallback((message, options) => pushNotification("error", message, options), [pushNotification]);

  const value = useMemo(() => ({
    notifications,
    dismissNotification,
    showSuccess,
    showInfo,
    showWarning,
    showError
  }), [dismissNotification, notifications, showError, showInfo, showSuccess, showWarning]);

  useEffect(() => () => {
    timersRef.current.forEach((timerId) => window.clearTimeout(timerId));
    timersRef.current.clear();
  }, []);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

function useNotifications() {
  const value = useContext(NotificationContext);

  if (!value) {
    throw new Error("useNotifications must be used inside NotificationProvider.");
  }

  return value;
}

export { NotificationProvider, useNotifications };
