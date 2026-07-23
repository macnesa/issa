import { createBrowserRouter, redirect } from "react-router-dom"
import AttendancePage from "../pages/Attendance"

import ParentLayout from "../layouts/ParentLayout" 
import Home from "../pages/Home"  
import LessonDetail from "../pages/LessonDetail"
import LessonsList from "../pages/LessonsList"
import LoginPage from "../pages/Login"
import TotalNilai from "../pages/TotalNilai"
import EventPage from "../pages/Event"
import NotFound from "../pages/NotFound"
import { hasParentSession } from '../utils/session';

  
const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <ParentLayout />,
      loader: () => {
        if(!hasParentSession()) {
          return redirect('/login')
        }
        return null
      },
      children: [
        {
          path: "",
          element: <Home />,
        }, 
        {
          path: "attendance",
          element: <AttendancePage />,
        },
        {
          path: "progress",
          element: <TotalNilai />,
        }, 
        {
          path: "schedule",
          element: <LessonsList />,
        },
        {
          path: "progress/:lessonId",
          element: <LessonDetail />
        },
        {
          path: "activities",
          element: <EventPage />
        },
        {
          path: "total",
          loader: () => redirect('/progress'),
        },
        {
          path: "lesson",
          loader: () => redirect('/schedule'),
        },
        {
          path: "lesson/:id",
          loader: ({ params }) => redirect(`/progress/${params.id}`),
        },
        {
          path: "event",
          loader: () => redirect('/activities'),
        }
      ]
    },
    {
      path: "/login",
      element: <LoginPage />,
      loader: () => hasParentSession() ? redirect('/') : null,
    },
    {
      path: "*",
      element: <NotFound />,
    },
  ]
)

export default router
