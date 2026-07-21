import { useState, useEffect } from "react"
import { useDispatch } from "react-redux"
import { useNavigate } from "react-router-dom";
import { act_login } from '../store/actions/actionCreator';


import Toastify from 'toastify-js'
import "toastify-js/src/toastify.css"


export default function LoginPage() {
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

  const [descInput, setDescInput] = useState()

  return (

    <div className="w-full min-h-[100vh] h-auto border-red-600 flex">



      <form onSubmit={triggerLogin}
       className="font-satu grid gap-3 grid-rows-[0.5fr_0.2fr_0.5fr_0.3fr_0.3fr_0.3fr_1fr_0.3fr]  pt-16 pb-6 border rounded-xl bg-white border-gray-400 px-10  ">

{/* <iframe src="https://embed.lottiefiles.com/animation/101088"></iframe> */}
        <p className="  text-primary2-100 font-bold ">Profile</p>

        {/* mb-3  mt-3  */}
        <p className=" font-bold text-3xl text-black">Log In</p>


        <p className=" text-kecil2 " >Look, watch, And get insight of your children development <br/> on the time </p>



        {/* mt-20 */}
        <label
          onClick={() => setDescInput('nim')}
          for="UserEmail"
          class="relative block overflow-hidden  rounded-md border border-gray-400 px-3 pt-3 shadow-sm focus-within:border-black focus-within:ring-1 focus-within:ring-black"
        >
          <input
            onChange={updateForm}
            name="NIM"
            type="text"
            inputMode="numeric"
            id="UserEmail"
            placeholder="Email"
            class="peer h-8 w-full font-bold border-none bg-transparent p-0 placeholder-transparent focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
          />

          <span
            class="absolute left-3 top-3 -translate-y-1/2 text-xs text-gray-700 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-sm peer-focus:top-3 peer-focus:text-xs"
          >
            Nim
          </span>
        </label>


        {/*  mt-6 */}
        <label
          onClick={() => setDescInput('pw')}
          for="pw"
          class="relative block overflow-hidden rounded-md border border-gray-400 px-3 pt-3 shadow-sm focus-within:border-black focus-within:ring-1 focus-within:ring-black"
        >
          <input
            onChange={updateForm}
            type="password"
            name="password"
            id="pw"
            placeholder="password"
            class="peer h-8 w-full font-bold border-none bg-transparent p-0 placeholder-transparent focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
          />

          <span
            class="absolute left-3 top-3 -translate-y-1/2 text-xs text-gray-700 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-sm peer-focus:top-3 peer-focus:text-xs"
          >
            Password
          </span>
        </label>



        {/* {descInput == 'nim' &&
          <p className="mt-4 text-kecil sm:text-sm text-gray-400 font-bold " >
            Nim adalah Nomor Induk Siswa yang terbentuk unik dan menjadi kode pengenal
            akan indentitas anak anda
          </p>
        }

        {descInput == 'pw' &&
          <p className="mt-4 text-kecil sm:text-sm text-gray-400 font-bold " >Gunakan password yang pernah dikirimkan kepada anda melalui email </p>
        } */}






        {/*  mt-6  */}
        <div className="flex items-center pl-4 border border-gray-200 rounded dark:border-gray-700">
          <input
            id="bordered-radio-1"
            type="radio"
            defaultValue=""
            name="bordered-radio"
            required
            className="w-4 h-4 text-blue-600  focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 "
          />
          <label
            htmlFor="bordered-radio-1"
            className="w-full font-bold text-primary2-100 py-2 ml-2 text-sm   dark:text-gray-300"
          >
            I am a parent  
          </label>
        </div>

        <p className="text-center self-end text-kecil sm:text-sm " >By continuing, I agree to the <b>ISSA Platform Terms</b> <br />and <b>Privacy Policy</b> </p>

        {/* mt-5 */}
        <button
          disabled=""
          type="submit"
          className="py-2.5 self-end  px-5 w-full mr-2 text-sm font-bold  bg-black rounded-lg border focus:z-10 focus:ring-4 text-white  dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700 inline-flex items-center justify-center "
        >
          {/* <svg
          aria-hidden="true"
          role="status"
          className="inline w-4 h-4 mr-3 text-gray-200 animate-spin dark:text-gray-600"
          viewBox="0 0 100 101"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
            fill="currentColor"
          />
          <path
            d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
            fill="#1C64F2"
          /> 
        </svg> */}

          Continue
        </button>


      </form>

    </div>


  )
}
