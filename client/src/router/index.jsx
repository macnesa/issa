import { createBrowserRouter, redirect } from 'react-router-dom';
import ParentLayout from '../layouts/ParentLayout';
import Home from '../pages/Home';
import Journey from '../pages/Journey';
import AttendancePage from '../pages/Attendance';
import TotalNilai from '../pages/TotalNilai';
import LessonsList from '../pages/LessonsList';
import LessonDetail from '../pages/LessonDetail';
import LoginPage from '../pages/Login';
import NotFound from '../pages/NotFound';
import { hasParentSession } from '../utils/session';

export const parentRoutes = [
  {
    path: '/',
    element: <ParentLayout />,
    loader: () => (hasParentSession() ? null : redirect('/login')),
    children: [
      { path: '', element: <Home /> },
      { path: 'journey', element: <Journey /> },
      { path: 'schedule', element: <LessonsList /> },
      { path: 'progress/:lessonId', element: <LessonDetail /> },
      { path: 'attendance', element: <AttendancePage /> },
      { path: 'progress', element: <TotalNilai /> },
      { path: 'activities', loader: () => redirect('/schedule') },
      { path: 'total', loader: () => redirect('/progress') },
      { path: 'lesson', loader: () => redirect('/schedule') },
      { path: 'lesson/:id', loader: ({ params }) => redirect(`/progress/${params.id}`) },
      { path: 'event', loader: () => redirect('/schedule') },
      { path: '*', element: <NotFound /> },
    ],
  },
  {
    path: '/login',
    element: <LoginPage />,
    loader: () => (hasParentSession() ? redirect('/') : null),
  },
];

const router = createBrowserRouter(parentRoutes);

export default router;
