import { useEffect, useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';

// function ScrollToTop() {
//   const { pathname } = useLocation();

//   useLayoutEffect(() => {
//     window.scrollTo(0, 0);
//   }, [pathname]);

//   useEffect(() => {
//     window.scrollTo(0, 0);
//   }, []);

//   return null;
// }

// export default ScrollToTop;

export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}