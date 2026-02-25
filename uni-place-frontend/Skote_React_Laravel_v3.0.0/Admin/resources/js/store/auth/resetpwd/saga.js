import { takeEvery, fork, put, all, call } from "redux-saga/effects"

// Login Redux States
import { RESET_PASSWORD } from "./actionTypes"
import { userResetPasswordError } from "./actions"

//Toast
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
;;

//If user is send successfully send mail link then dispatch redux action's are directly from here.
function* resetUser({ payload: { user, token, history } }) {
  try {
    const response = yield call(axios.post, '/api/reset-password', {
      email: user.email,
      token: token,
      password: user.password,
      password_confirmation: user.password_confirmation
    });

    const data = response.data;

    if (data.success === true && data.message === 'success') {
      history('/login');
      toast.success('Your password has been reset.');
    } else {
      if (data.data === 400) {
        toast.error(data.message, {
          autoClose: 3000,
        });
      }
    }
  } catch (error) {
    yield put(userResetPasswordError(error));
  }
}

export function* watchUserPasswordReset() {
  yield takeEvery(RESET_PASSWORD, resetUser)
}

function* resetPasswordSaga() {
  yield all([fork(watchUserPasswordReset)])
}

export default resetPasswordSaga
