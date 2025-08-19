import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Notification from './Notification'; // You'll create this

const SideComponent = () => {
  const [isNotification, setIsNotification] = useState(false);

  return (
    <>
      {isNotification 
        ? <Notification onBack={() => setIsNotification(false)} />
        : <Sidebar onNotificationClick={() => setIsNotification(true)} />
      }
    </>
  );
};

export default SideComponent;
