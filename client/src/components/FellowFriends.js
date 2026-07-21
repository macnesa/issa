import ScrollReveal from "scrollreveal";

import { useEffect, useState, useRef, Suspense } from "react";



export default function FellowFriend(props) {
    
  // console.log(document.querySelector('.reveal'), "lepzi");
  useEffect(() => {
    
    if (props?.data?.length) {
      
      ScrollReveal().reveal(document.querySelectorAll('.reveal'), { 
        distance: "20px",
        origin: "left",
        opacity: 0,
        duration: 2000,
      });
      
    }
    
  }, [])

  
  if (props?.data?.length) {
    
    
    
    return (

        <ul  className="  max-w-md mt-10 px-6 divide-y divide-gray-200 dark:divide-gray-700">
          <h5 class="text-xl mb-6 font-semibold tracking-tight text-gray-900">
            {" "}
            Teman Sekelas{" "}
          </h5>

          {props.data.map((each, index) => { 
            return (
              <li  key={index} className="reveal pb-3 sm:pb-4">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 overflow-hidden rounded-full ">
                    <img
                      className="w-full"
                      src={each.imgUrl}
                      alt={each.name}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate dark:text-white">
                    {each.name}
                    </p>
                    <p className="text-[12px] text-gray-500 truncate dark:text-gray-400">
                    { new Date(each.birthDate ).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })   }
                    </p>
                  </div>
                  <div className="inline-flex items-center text-base font-semibold text-gray-900 dark:text-white">
                    <span class="flex text-green-400 items-center text-sm font-medium  ">
                      <span class="flex w-2.5 h-2.5 bg-green-400 rounded-full mr-1.5 flex-shrink-0"></span>{" "}
                    </span>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
  
    );
  }
}
