import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

export default function BottomNav(props) {
  function go(where) {
    return navigate(where);
  }

  const navigate = useNavigate();

  const {
    student: { studentDetail },
  } = useSelector((state) => state);

  if (Object.keys(studentDetail).length) {
    return (
      <>
        <div class="fixed z-50 w-[90%] h-14 max-w-lg -translate-x-1/2 bg-white border border-gray-200 rounded-full bottom-4 left-1/2 dark:bg-gray-700 dark:border-gray-600">
          <div class="grid h-full max-w-lg grid-cols-3 mx-auto">
            <button onClick={() => go('/')} data-tooltip-target="tooltip-home" type="button" class="inline-flex flex-col items-center justify-center px-5 rounded-l-full hover:bg-gray-50 dark:hover:bg-gray-800 group">
              <svg class="w-6 h-6 mb-1 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path>
              </svg>
              <span class="sr-only">Home</span>
            </button>

            <div id="tooltip-home" role="tooltip" class="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white transition-opacity duration-300 bg-gray-900 rounded-lg shadow-sm opacity-0 tooltip dark:bg-gray-700">
              Home
              <div class="tooltip-arrow" data-popper-arrow></div>
            </div>

            <button data-tooltip-target="tooltip-settings" type="button" class="inline-flex flex-col items-center justify-center px-5 hover:bg-gray-50 dark:hover:bg-gray-800 group">
              <svg class="w-6 h-6 mb-1 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z"></path>
              </svg>
              <span class="sr-only">Settings</span>
            </button>
            <div id="tooltip-settings" role="tooltip" class="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white transition-opacity duration-300 bg-gray-900 rounded-lg shadow-sm opacity-0 tooltip dark:bg-gray-700">
              Settings
              <div class="tooltip-arrow" data-popper-arrow></div>
            </div>

            <button
              aria-controls="readProductDrawer"
              data-drawer-show="readProductDrawer"
              data-drawer-target="readProductDrawer"
              id="readProductButton"
              data-tooltip-target="tooltip-profile"
              type="button"
              class="inline-flex flex-col items-center justify-center px-5 rounded-r-full hover:bg-gray-50 dark:hover:bg-gray-800 group"
            >
              <svg class="w-6 h-6 mb-1 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path clip-rule="evenodd" fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z"></path>
              </svg>
              <span class="sr-only">Profile</span>
            </button>

            <div id="tooltip-profile" role="tooltip" class="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white transition-opacity duration-300 bg-gray-900 rounded-lg shadow-sm opacity-0 tooltip dark:bg-gray-700">
              Profile
              <div class="tooltip-arrow" data-popper-arrow></div>
            </div>
          </div>
        </div>

        {/* drawer component */}
        <div
          id="readProductDrawer"
          className="overflow-y-auto z-[100001] fixed top-0 left-0 p-4 w-full max-w-xs h-screen bg-white transition-transform -translate-x-full dark:bg-gray-800"
          tabIndex={-1}
          aria-labelledby="drawer-label"
          aria-hidden="true"
        >
          <div class="w-full max-w-sm bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700">
            <div class="flex justify-end px-4 pt-4">
              <button
                id="dropdownButton"
                data-dropdown-toggle="dropdown"
                class="inline-block text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:ring-4 focus:outline-none focus:ring-gray-200 dark:focus:ring-gray-700 rounded-lg text-sm p-1.5"
                type="button"
              >
                <span class="sr-only">Open dropdown</span>
                <svg class="w-6 h-6" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z"></path>
                </svg>
              </button>
              <div id="dropdown" class="z-10 hidden text-base list-none bg-white divide-y divide-gray-100 rounded-lg shadow w-44 dark:bg-gray-700">
                <ul class="py-2" aria-labelledby="dropdownButton">
                  <li>
                    <a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-200 dark:hover:text-white">
                      Edit
                    </a>
                  </li>
                  <li>
                    <a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-200 dark:hover:text-white">
                      Export Data
                    </a>
                  </li>
                  <li>
                    <a href="#" class="block px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-200 dark:hover:text-white">
                      Delete
                    </a>
                  </li>
                </ul>
              </div>
            </div>
            <div class="flex flex-col items-center pb-10">
              <img class="w-24 h-24 mb-3 rounded-full shadow-lg" src={studentDetail.imgUrl} alt="Bonnie image" />
              {/* <h5 class="mb-1 text-xl font-medium text-gray-900 dark:text-white"> {studentDetail.name} </h5> */}
              <span class="text-sm text-gray-500 dark:text-gray-400"> {studentDetail.NIM} </span>
              <div class="flex mt-4 space-x-3 md:mt-6">
                <a
                  href="#"
                  class="inline-flex items-center px-4 py-2 text-sm font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                >
                  Lihat Nilai
                </a>
                {/* <a href="#" class="inline-flex items-center px-4 py-2 text-sm font-medium text-center text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-gray-200 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-700 dark:focus:ring-gray-700">Message</a> */}
              </div>
            </div>
          </div>

          <div>
            {/* <h4
        id="drawer-label"
        className="mb-1.5 leading-none text-xl font-semibold text-gray-900 dark:text-white"
      >
        Apple iMac 25"
      </h4>
      <p className="mb-5 text-xl font-bold text-gray-900 dark:text-white">
        $2999
      </p> */}
          </div>
          <button
            type="button"
            data-drawer-dismiss="readProductDrawer"
            aria-controls="readProductDrawer"
            className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 absolute top-2.5 right-2.5 inline-flex items-center dark:hover:bg-gray-600 dark:hover:text-white"
          >
            <svg aria-hidden="true" className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
            <span className="sr-only">Close menu</span>
          </button>
          <dl>
            <dt className="mb-2 font-semibold leading-none text-gray-900 dark:text-white">Birth Date</dt>
            <dd className="mb-4 font-light text-gray-500 sm:mb-5 dark:text-gray-400">{studentDetail.birthDate}</dd>
            <dt className="mb-2 font-semibold leading-none text-gray-900 dark:text-white">Kelas</dt>
            <dd className="mb-4 font-light text-gray-500 sm:mb-5 dark:text-gray-400">{studentDetail.Class.name}</dd>
            <dt className="mb-2 font-semibold leading-none text-gray-900 dark:text-white">Wali Kelas</dt>
            <dd className="mb-4 font-light text-gray-500 sm:mb-5 dark:text-gray-400">{studentDetail.Class.Teacher.name}</dd>
            <dt className="mb-2 font-semibold leading-none text-gray-900 dark:text-white">Feedback</dt>
            <dd className="mb-4 font-light text-gray-500 sm:mb-5 dark:text-gray-400">{studentDetail.feedback}</dd>
          </dl>
        </div>
      </>
    );
  }
}
