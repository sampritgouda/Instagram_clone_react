import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Notification from './Notification'; // You'll create this
import Search from './Search';

const SideComponent = () => {
  const [isNotification, setIsNotification] = useState(false);
  const [isSearch, setisSearch] = useState(false)

  return (
    <div className='side-component' style={{zIndex:9999}}>
      <Sidebar onNotificationClick={() => setIsNotification(true)} onSearchClick ={()=>setisSearch(true)} />
     {isNotification && <Notification onBack={() => setIsNotification(false)} />}
      { isSearch &&<Search onclose = {()=>setisSearch(false)}/>}
    </div>
  );
};

export default SideComponent;
