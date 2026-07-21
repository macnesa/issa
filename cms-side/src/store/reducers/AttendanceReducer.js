const initialState = {};

function attendances(state = initialState, action) {
  switch (action.type) {
    // case FETCH_CLASS:
    //   return {
    //     ...state,
    //     classes: action.payload,
    //   };
    // case FETCH_CLASS_BYID:
    //   return {
    //     ...state,
    //     class: action.payload,
    //   };

    default:
      return state;
  }
}

export default attendances;
