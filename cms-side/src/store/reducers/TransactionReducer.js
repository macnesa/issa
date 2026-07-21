import { FETCH_TRANSACTION } from "../action/ActionTypes";

const initialState = {
  transactions: [],
};

function transactionReducer(state = initialState, action) {
  switch (action.type) {
    case FETCH_TRANSACTION:
      return {
        ...state,
        transactions: action.payload,
      };

    default:
      return state;
  }
}

export default transactionReducer;
