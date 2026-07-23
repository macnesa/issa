import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { teacherAdd } from "../store/action/ActionCreator";

export default function NewAdmin(props) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [form, setForm] = useState({
    NIP: "",
    password: "",
    name: "",
    imgUrl: "",
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
    dispatch(teacherAdd(form)).then(() => {
      navigate("/teacher");
    });
    setForm({
      NIP: "",
      password: "",
      name: "",
      imgUrl: "",
    });
  };

  return (
    <div className="relative overflow-x-auto shadow-md sm:rounded-lg ml-6 mt-[4rem] w-full md:w-full sm:[50%]">
      <div className="mb-6">
        <p className="font-raleway italic font-semibold text-[1.3rem] ">Form New Teacher</p>
      </div>
      <form onSubmit={submitForm}>
        <div className="relative z-0 w-full mb-6 group">
          <input
            onChange={changeInputHandler}
            type="number"
            name="NIP"
            id="floating_email"
            className="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer"
            placeholder=" "
            required
          />
          <label
            htmlFor="floating_email"
            className="peer-focus:font-medium absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
          >
            NIP
          </label>
        </div>
        <div className="relative z-0 w-full mb-6 group">
          <input
            onChange={changeInputHandler}
            type="password"
            name="password"
            id="floating_password"
            className="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer"
            placeholder=" "
            required
          />
          <label
            htmlFor="floating_password"
            className="peer-focus:font-medium absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
          >
            Password
          </label>
        </div>
        <div className="relative z-0 w-full mb-6 group">
          <input
            onChange={changeInputHandler}
            type="text"
            name="name"
            id="floating_first_name"
            className="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer"
            placeholder=" "
            required
          />
          <label
            htmlFor="floating_first_name"
            className="peer-focus:font-medium absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
          >
            Full Name
          </label>
        </div>
        <div className="relative z-0 w-full mb-6 group">
          <input
            onChange={changeInputHandler}
            type="text"
            name="imgUrl"
            id="floating_first_name"
            className="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer"
            placeholder=" "
            required
          />
          <label
            htmlFor="floating_first_name"
            className="peer-focus:font-medium absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
          >
            Image Url
          </label>
        </div>

        <button
          className="inline-flex items-center text-gray-500 bg-white border border-gray-900 focus:outline-none hover:bg-gray-900 hover:text-white focus:ring-4 focus:ring-gray-200 font-medium rounded-lg text-sm px-3 py-1.5 dark:bg-gray-800 dark:text-gray-400"
          type="submit"
        >
          Submit
        </button>
      </form>
    </div>
  );
}
