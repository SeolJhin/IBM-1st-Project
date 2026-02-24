import {
  RESET_PASSWORD,
  RESET_PASSWORD_SUCCESS,
  RESET_PASSWORD_ERROR,
} from "./actionTypes"

const initialState = {
  resetSuccessMsg: null,
  resetError: null,
}

const resetPassword = (state = initialState, action) => {
  switch (action.type) {
    case RESET_PASSWORD:
      state = {
        ...state,
        resetSuccessMsg: null,
        resetError: null,
      }
      break
    case RESET_PASSWORD_SUCCESS:
      state = {
        ...state,
        resetSuccessMsg: action.payload,
      }
      break
    case RESET_PASSWORD_ERROR:
      state = { ...state, resetError: action.payload }
      break
    default:
      state = { ...state }
      break
  }
  return state
}

export default resetPassword
