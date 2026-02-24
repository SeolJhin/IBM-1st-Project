import { takeEvery, fork, put, all, call } from "redux-saga/effects"

//Account Redux states
import { REGISTER_USER } from "./actionTypes"
import { registerUserSuccessful, registerUserFailed } from "./actions"

//Toast
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Is user register successfull then direct plot user in redux.
function* registerUser({ payload: { user, history } }) {
  try {
    const response = yield axios.post('/api/register', user);
    const data = response.data;
    if (data.success === true && data.message === 'success') {
      const logged_user = {
        login: true,
        user_id: data.data.id,
        name: data.data.name,
        email: data.data.email,
      };
      yield put(registerUserSuccessful(logged_user))
      yield new Promise((resolve) => {
        toast.success("User Registered Successfully", {
          position: "top-right",
          autoClose: 3000,
          onClose: resolve, // Resolve the Promise when the toast is closed
        });
      });

      history('/login');
    } else {
      if (data.data === 400) {
        toast.error(data.message, {
          position: "top-right",
          autoClose: 3000,
        });
      }
    }
  
  } catch (error) {
    yield put(registerUserFailed(error));
  }
}

export function* watchUserRegister() {
  yield takeEvery(REGISTER_USER, registerUser)
}

function* accountSaga() {
  yield all([fork(watchUserRegister)])
}

export default accountSaga
