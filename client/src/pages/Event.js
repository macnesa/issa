import { useEffect, useState } from 'react'

import { useSelector, useDispatch } from "react-redux";


import {
  fetchActivity
} from "../store/actions/actionCreator";



export default function About() {
  const dispatch = useDispatch()
  const {
    student: { activiy },
  } = useSelector((state) => state);
  
  console.log(activiy, "tov tov chaverim");
  
  
  useEffect(() => {
    dispatch(fetchActivity())
  }, [])
  // fetchActivity
  
  if(activiy?.length) {
    
    
    return (
      <div className=" pl-6 pt-10  border-black mb-20 ">
        <h5 class="text-xl mb-6 font-semibold tracking-tight text-gray-900 dark:text-white">
          {" "}
          Jadwal{" "}
        </h5>

        <ol class="relative border-l   border-gray-200 dark:border-gray-700">
          
          {activiy.map((each, index) => {
            return (
              <li   class="mb-10 ml-6">
                <span class="absolute flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full -left-3 ring-8 ring-white dark:ring-gray-900 dark:bg-blue-900">
                  <svg
                    aria-hidden="true"
                    class="w-3 h-3 text-blue-800 dark:text-blue-300"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                </span>
                <h3 class="flex items-center mb-1 text-lg font-semibold text-gray-900 dark:text-white">
                  {each.name}
                  <span class="bg-blue-100 text-blue-800 text-sm font-medium mr-2 px-2.5 py-0.5 rounded dark:bg-blue-900 dark:text-blue-300 ml-3">
                    Latest
                  </span>
                </h3>
                <time class="block mb-2 text-sm font-normal leading-none text-gray-400 dark:text-gray-500">
                { new Date(each.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })  }
                </time>
                <p class="mb-4 text-base font-normal text-gray-500 dark:text-gray-400"></p>
              </li>
            );
          })} 
        </ol>
      </div>
    );
    
    
    
  }
  
  
}
