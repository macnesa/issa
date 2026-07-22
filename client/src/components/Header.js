import { useState, Fragment, useEffect, useRef } from "react"

import { Link, useNavigate, useLocation } from 'react-router-dom';

import { useSelector, useDispatch } from "react-redux"


import ScrollReveal from 'scrollreveal';






export default function Header(props) {

  const [arrColor, setArrColor] = useState({})
 
  const {
    student: { studentDetail },
  } = useSelector((state) => state);
  
  const { imgUrl, name, NIM } = studentDetail

  // console.log(productById, "mardua holong");

  const navigate = useNavigate()
  const dispatch = useDispatch()


  const bottom = [
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null)
  ]

  function reveal(ref, origin = "bottom") {
    return ScrollReveal().reveal(ref.current,
      {
        distance: '20px',
        origin: origin,
        opacity: 0,
        duration: 2000
      }
    );
  }
  
  function triggerSignOut() {
    localStorage.removeItem('access_token')
    navigate('/login')
  }

  useEffect(() => { 

  }, []);

 

  return (
    <>
      <nav
        style={{ boxShadow: "", backgroundColor: "" }}
        class="bg-white w-[90%]  mx-auto  z-[10000]  border-red-800  sm:block  px-2 sm:px-4 py-2.5 rounded-xl dark:bg-gray-900"
      >
        <div class="container flex flex-wrap items-center  border-white justify-between mx-auto">
          <a
            href="#"
            style={{}}
            class=" items-center  border-black ml-2 flex justify-center "
          >
            {/* <img src="https://flowbite.com/docs/images/logo.svg" class="h-6 mr-3 sm:h-9" alt="Flowbite Logo" /> */}
            <img
              src="https://live.staticflickr.com/65535/52735891608_e4bb396871_w.jpg"
              class="h-7  sm:h-9"
              alt="Flowbite Logo"
            />
            {/* <span class="self-center text-xl font-semibold whitespace-nowrap dark:text-white">Flowbite</span> */}
            {/* <span class="flex w-3 h-3 bg-green-400 rounded-full"></span> */}
          </a>
          <div class="flex items-center md:order-2">
            {imgUrl ? (
              <div
                id="user-menu-button"
                data-dropdown-toggle="user-dropdown"
                data-dropdown-placement="bottom"
                className="flex-shrink-0 w-8 h-8 overflow-hidden rounded-full "
              >
                <img className="w-full" src={imgUrl} />
              </div>
            ) : (
              <div class="relative w-8 h-8 overflow-hidden bg-gray-100 rounded-full dark:bg-gray-600">
                <svg
                  class="absolute w-10 h-10 text-gray-400 -left-1"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fill-rule="evenodd"
                    d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                    clip-rule="evenodd"
                  ></path>
                </svg>
              </div>
            )}

            {/* <img id="user-menu-button" aria-expanded="false" data-dropdown-toggle="user-dropdown" data-dropdown-placement="bottom" class="w-8 h-8 p-1 rounded-full ring-2 ring-gray-300 dark:ring-gray-500" src={imgUrl} alt="Bordered avatar" /> */}

            <div
              class="z-50 hidden my-4 text-base list-none bg-white divide-y divide-gray-100 rounded-lg shadow dark:bg-gray-700 dark:divide-gray-600"
              id="user-dropdown"
            >
              <div class="px-4 py-3">
                <span class="block text-sm text-gray-900 dark:text-white">
                  {" "}
                  {name}{" "}
                </span>
                <span class="block text-sm font-medium text-gray-500 truncate dark:text-gray-400">
                  {" "}
                  {NIM}{" "}
                </span>
              </div>
              <ul class="py-2" aria-labelledby="user-menu-button">
                <li>
                  {/* <a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-200 dark:hover:text-white">Dashboard</a> */}
                </li>
                <li>
                  {/* <a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-200 dark:hover:text-white">Settings</a> */}
                </li>
                <li>
                  {/* <a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-200 dark:hover:text-white">Earnings</a> */}
                </li>
                <li>
                  <a
                    href="#"
                    onClick={() => triggerSignOut()}
                    class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-200 dark:hover:text-white"
                  >
                    Sign out
                  </a>
                </li>
              </ul>
            </div>
            <button
              data-collapse-toggle="mobile-menu-2"
              type="button"
              class="inline-flex items-center p-2 ml-1 text-sm text-gray-500 rounded-lg md:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600"
              aria-controls="mobile-menu-2"
              aria-expanded="false"
            >
              <span class="sr-only">Open main menu</span>
              <svg
                class="w-6 h-6"
                aria-hidden="true"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fill-rule="evenodd"
                  d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                  clipRule="evenodd"
                ></path>
              </svg>
            </button>
          </div>
          <div
            class="items-center justify-between hidden w-full md:flex md:w-auto md:order-1"
            id="mobile-menu-2"
          >
            <ul class="flex flex-col p-4 mt-4 border border-gray-100 rounded-lg bg-gray-50 md:flex-row md:space-x-8 md:mt-0 md:text-sm md:font-medium md:border-0 md:bg-white dark:bg-gray-800 md:dark:bg-gray-900 dark:border-gray-700">
              <li>
                <a
                  href="#"
                  class="block py-2 pl-3 pr-4 text-gray-700 bg-blue-700 rounded md:bg-transparent md:p-0 dark:text-white"
                  aria-current="page"
                >
                  Home
                </a>
              </li>
              <li>
                <a
                  href="#"
                  class="block py-2 pl-3 pr-4 text-gray-700 rounded hover:bg-gray-100 md:hover:bg-transparent md:hover:text-blue-700 md:p-0 dark:text-gray-400 md:dark:hover:text-white dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent dark:border-gray-700"
                >
                  Lesson
                </a>
              </li>
              <li>
                <a
                  href="#"
                  class="block py-2 pl-3 pr-4 text-gray-700 rounded hover:bg-gray-100 md:hover:bg-transparent md:hover:text-blue-700 md:p-0 dark:text-gray-400 md:dark:hover:text-white dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent dark:border-gray-700"
                >
                  My Score
                </a>
              </li>
              <li>
                <a
                  href="#"
                  class="block py-2 pl-3 pr-4 text-gray-700 rounded hover:bg-gray-100 md:hover:bg-transparent md:hover:text-blue-700 md:p-0 dark:text-gray-400 md:dark:hover:text-white dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent dark:border-gray-700"
                ></a>
              </li>
              <li>
                <a
                  href="#"
                  class="block py-2 pl-3 pr-4 text-gray-700 rounded hover:bg-gray-100 md:hover:bg-transparent md:hover:text-blue-700 md:p-0 dark:text-gray-400 md:dark:hover:text-white dark:hover:bg-gray-700 dark:hover:text-white md:dark:hover:bg-transparent dark:border-gray-700"
                ></a>
              </li>
            </ul>
          </div>
        </div>
      </nav>
    </>
  );
}
