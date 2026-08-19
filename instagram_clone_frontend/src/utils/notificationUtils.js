/**
 * Utility for requesting and displaying native browser device notifications
 */

export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.log('This browser does not support desktop notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};

export const showDeviceNotification = (title, options = {}) => {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }

  try {
    const notification = new Notification(title, {
      icon: options.icon || '/favicon.ico',
      badge: '/favicon.ico',
      body: options.body || '',
      silent: false,
      tag: options.tag || 'insta-clone-notification',
      renotify: true,
      ...options
    });

    notification.onclick = (event) => {
      event.preventDefault();
      window.focus();
      if (options.onClickUrl) {
        window.location.href = options.onClickUrl;
      }
      notification.close();
    };
  } catch (err) {
    console.error('Failed to trigger notification:', err);
  }
};
