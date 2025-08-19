  import React, { useRef } from 'react';

  import Sidebar from '../components/Sidebar';
  import Stories from '../components/Stories';
  import Feeds from '../components/Feeds';
import SideComponent from '../components/SideComponent';
  
  function HomePage() {
    const containerRef = useRef({})
    return (
      <div className='d-flex'>
        <SideComponent />
      <div className="container-fluid bg-black">
        <div className="row">
          
          <div className="col-12 col-md-9 col-lg-10 " >
            <div className="d-flex justify-content-center">
              <div ref={containerRef} className="w-100 w-md-50 " style={{ overflowY: "auto",
                                             maxHeight: "100vh",
                                             scrollbarWidth: "none", 
                                             msOverflowStyle: "none" }}>
                <Stories />
                <div className='w-mad-80 mx-auto mt-4'>
                <Feeds scrollcontainerref={containerRef} />
                </div>
              </div>
          </div>

          </div>
        </div>
      </div>
      </div>
    );
  }

  export default HomePage;
