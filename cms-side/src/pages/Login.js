import { Link } from "react-router-dom";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import baseUrl from "../config/api";


export default function Login(props) {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    NIP: "",
    password: "",
  });

  const changeInputHandler = (event) => {
    const { name, value } = event.target;

    const newForm = {
      ...form,
    };
    newForm[name] = value;

    setForm(newForm);
  };
  const submitForm = (e) => {
    e.preventDefault();
    fetch(`${baseUrl}/teachers/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(form),
    })
      .then(async (response) => {
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message);
        }
        return response.json();
      })
      .then((data) => {
        // console.log("Success:", data);
        // Swal.fire({
        //   position: "top-end",
        //   icon: "success",
        //   title: "Login Success",
        //   showConfirmButton: false,
        //   timer: 1500,
        // });
        localStorage.setItem("access_token", data.access_token);
        navigate(`/`);
      })
      .catch(() => {
        // Swal.fire({
        //   icon: "error",
        //   title: "Oops...",
        //   text: error.message,
        // });
      });
  };
  return (
    <section className="h-screen bg-gray-900">
      <div className="px-6 h-full text-gray-800">
        <div className="flex xl:justify-center lg:justify-between justify-center items-center flex-wrap h-full g-6">
          <div className="grow-0 shrink-1 md:shrink-0 basis-auto xl:w-6/12 lg:w-6/12 md:w-9/12 mb-12 md:mb-[5rem]">
            <img className="m-auto w-[500px]" src="https://res.cloudinary.com/dslzpyibe/image/upload/v1677853124/logo-removebg-preview_rh8mxy.png" />
          </div>
          <div className="xl:ml-20 xl:w-5/12 lg:w-5/12 md:w-8/12 mb-12 md:mb-0">
            <form onSubmit={submitForm}>
              <p className="text-4xl text-white font-bold">SIGN IN</p>
              <div className="flex flex-row items-center justify-center lg:justify-start"></div>

              <div className="flex items-center my-4 before:flex-1 before:border-t before:border-gray-300 before:mt-0.5 after:flex-1 after:border-t after:border-gray-300 after:mt-0.5">
                <p className="text-center text-white font-semibold mx-4 mb-0">With</p>
              </div>

              {/* <!-- Email input --> */}
              <div className="mb-6">
                <input
                  type="text"
                  name="NIP"
                  onChange={changeInputHandler}
                  className="form-control block w-full px-4 py-2 text-xl font-normal text-gray-700 bg-white bg-clip-padding border border-solid border-gray-300 rounded transition ease-in-out m-0 focus:text-gray-700 focus:bg-white focus:border-[#242222] focus:outline-none"
                  placeholder="NIP"
                />
              </div>

              {/* <!-- Password input --> */}
              <div className="mb-6">
                <input
                  type="password"
                  name="password"
                  onChange={changeInputHandler}
                  className="form-control block w-full px-4 py-2 text-xl font-normal text-gray-700 bg-white bg-clip-padding border border-solid border-gray-300 rounded transition ease-in-out m-0 focus:text-gray-700 focus:bg-white focus:border-[#242222] focus:outline-none"
                  placeholder="Password"
                />
              </div>

              <div className="flex justify-between items-center mb-6">
                <div className="form-group form-check">
                  <input
                    type="checkbox"
                    className="form-check-input appearance-none h-4 w-4 border border-gray-300 rounded-sm bg-white checked:bg-[#242222] checked:border-[#242222] focus:outline-none transition duration-200 mt-1 align-top bg-no-repeat bg-center bg-contain float-left mr-2 cursor-pointer"
                  />
                  <label className="form-check-label inline-block text-white" htmlFor="exampleCheck2">
                    Remember me
                  </label>
                </div>
              </div>

              <div className="text-center lg:text-left">
                <button
                  className="inline-flex items-center   border-bg-gray-900 focus:outline-none bg-white text-black focus:ring-4 focus:ring-gray-200 font-medium rounded-lg text-sm px-3 py-1.5 dark:bg-gray-800 dark:text-gray-400 h-10 "
                  type="submit"
                >
                  <p className="text-center ">SIGN IN</p>
                </button>
                {/* <p className="text-sm font-semibold mt-2 pt-1 mb-0">
                  Don't have an account?
                  <Link to="/register">
                    <a href="#!" className="text-red-600 hover:text-red-700 focus:text-red-700 transition duration-200 ease-in-out">
                      Register
                    </a>
                  </Link>
                </p> */}
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
