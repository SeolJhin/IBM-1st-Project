import { takeEvery, fork, put, all } from "redux-saga/effects"

// Login Redux States
import { FORGET_PASSWORD } from "./actionTypes"
import { userForgetPasswordError } from "./actions"

//Toast
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

//If user is send successfully send mail link then dispatch redux action's are directly from here.
function* forgetUser({ payload: { user } }) {
  try {
    const response = yield axios.post('/api/forget-password', user);
    const data = response.data;
    if (data.success === true && data.message === 'success') {
      toast.success('Password reset link send in your email.');
    } else {
      if (data.data === 400) {
        toast.error(data.message, {
          position: "top-right",
          autoClose: 3000,
        });
      }
    }
  } catch (error) {
    yield put(userForgetPasswordError(error))
  }
}

export function* watchUserPasswordForget() {
  yield takeEvery(FORGET_PASSWORD, forgetUser)
}

function* forgetPasswordSaga() {
  yield all([fork(watchUserPasswordForget)])
}

export default forgetPasswordSaga
