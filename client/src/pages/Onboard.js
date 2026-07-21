import { useState, useEffect } from "react"
import { useDispatch } from "react-redux"
import { useNavigate } from "react-router-dom";
import { act_login } from '../store/actions/actionCreator';


import Toastify from 'toastify-js'
import "toastify-js/src/toastify.css"


export default function Onboard() {
  const dispatch = useDispatch()
  const navigate = useNavigate()


  const [loginData, setLoginData] = useState(
    {
      NIM: '',
      password: ''
    }
  )

  function updateForm(event) {
    const { name, value } = event.target;
    setLoginData({ ...loginData, [name]: value });
  }



  function triggerLogin(event) {
    event.preventDefault()
    console.log(loginData);
    dispatch(act_login(loginData))
      .then((_) => {
        navigate('/')
      })
      .catch(({ msg }) => {
        Toastify({
          text: msg,
          duration: 3000,
          close: true,
        }).showToast();
      })


  }



  return (

    <section class="relative font-satu flex flex-wrap lg:h-screen lg:items-center">
      <div class="w-full px-4 py-12 sm:px-6 sm:py-16 lg:w-1/2 lg:px-8 lg:py-24">
        <div class="mx-auto max-w-lg text-center">



          <h1 class="text-2xl font-bold sm:text-3xl">Get started</h1>

          <p class="mt-4 text-gray-500">
            Stay Connected, Stay Informed: ISSA - The Ultimate School Companion for Parents and Kids
          </p>
        </div>

        <form onSubmit={triggerLogin} action="" class="mx-auto mt-8 mb-0 max-w-md space-y-4">
          <div>
            <label for="email" class="sr-only">Email</label>

            <div class="relative">
              <input
                type="number"
                class="w-full rounded-lg border-gray-200 p-4 pr-12 text-sm shadow-sm"
                placeholder="Enter NIK"
                name="NIM"
                onChange={updateForm}
              />

              <span
                class="absolute inset-y-0 right-0 grid place-content-center px-4"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-4 w-4 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                  />
                </svg>
              </span>
            </div>
          </div>

          <div>
            <label for="password" class="sr-only">Password</label>

            <div class="relative">
              <input
                type="password"
                name="password"
                class="w-full rounded-lg border-gray-200 p-4 pr-12 text-sm shadow-sm"
                placeholder="Enter password"
                onChange={updateForm}
              />

              <span
                class="absolute inset-y-0 right-0 grid place-content-center px-4"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-4 w-4 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              </span>
            </div>
          </div>

          <div class="flex items-center justify-between">
            <p class="text-sm text-gray-500">
              {/* No account? */}
              {/* <a class="underline" href="">Sign up</a> */}
            </p>

            <button
              type="submit"
              class="inline-block rounded-lg bg-blue-500 px-5 py-3 text-sm font-medium text-white"
            >
              Log In
            </button>
          </div>
        </form>
      </div>

      <div class="relative h-64 w-full sm:h-96 lg:h-full lg:w-1/2">
        <img
          alt="Welcome"
          src="https://cdn.discordapp.com/attachments/1078622980864749640/1080476091799568394/Web_capture_1-3-2023_20518_looka.com.jpeg"
          class="absolute inset-0 h-full w-full object-cover"
        />
      </div>
    </section>


  )
}