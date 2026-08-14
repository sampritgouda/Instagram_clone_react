import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Search from './Search';

const SideComponent = () => {
  const [isSearch, setisSearch] = useState(false)

  return (
    <>
      <div className='side-component-bar' style={{ zIndex: 9999 }}>
        <Sidebar onSearchClick={() => setisSearch(true)} />
      </div>
      {isSearch && <Search onclose={() => setisSearch(false)} />}
    </>
  );
};

export default SideComponent;
