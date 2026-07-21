
import { Outlet } from "react-router"
import Header from "../components/Header"

import Footer from "../components/Footer"
import BottomNav from "../components/BottomNav" 
import { fetchStudentDetail } from "../store/actions/actionCreator"
import { useDispatch, useSelector } from "react-redux"
import { useEffect } from "react"

export default function Container() { 
  const dispatch = useDispatch()
  
  const {
    student: { studentDetail },
  } = useSelector((state) => state);
  
  
  useEffect(() => {  
    if(!Object.keys(studentDetail).length) {
      dispatch(fetchStudentDetail())
    } 
  }, []);
  
  return (
    <div className="pt-4"  style={{minHeight: "100vh", backgroundImage: "url(https://i.pinimg.com/736x/8c/98/99/8c98994518b575bfd8c949e91d20548b.jpg)"}}>
      <Header />
      <Outlet />
      <BottomNav/>
      {/* <Footer /> */}
    </div>
  )
}