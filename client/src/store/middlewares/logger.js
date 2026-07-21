const logger = store => next => action => {
  console.log('dispatching', action);
  console.log('previous state', store.getState());
  // next untuk melanjutkan action ke middleware selanjutnya, kalau memang ada lebih dari 1 middleware. jika tidak, dilanjutkan ke reducer
  let result = next(action)
  console.log('next state', store.getState());
  return result
}

export default logger