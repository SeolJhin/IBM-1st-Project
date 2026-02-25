import { call, put, takeEvery, all, fork } from "redux-saga/effects";

// Crypto Redux States
import {
    //  GET_CHARTS_DATA 
    GET_DASHBOARD_EMAILCHART
} from "./actionTypes";
import { apiSuccess, apiFail } from "./actions";

//Include Both Helper File with needed methods
import {
    // getWeeklyData,
    // getYearlyData,
    // getMonthlyData
    getDashboardEmailChart as getDashboardEmailChartApi
}
    from "../../helpers/fakebackend_helper";

function* getChartsData({ payload: periodType }) {
    try {
        var response = yield call(getDashboardEmailChartApi, periodType);
        // var response;
        // if (periodType == "monthly") {
        //     response = yield call(getWeeklyData, periodType);
        // }
        // if (periodType == "yearly") {
        //     response = yield call(getYearlyData, periodType);
        // }
        // if (periodType == "weekly") {
        //     response = yield call(getMonthlyData, periodType);
        // }

        yield put(apiSuccess(GET_DASHBOARD_EMAILCHART, response));
    } catch (error) {
        yield put(apiFail(GET_DASHBOARD_EMAILCHART, error));
    }
}

export function* watchGetChartsData() {
    yield takeEvery(GET_DASHBOARD_EMAILCHART, getChartsData);
}

function* dashboardSaga() {
    yield all([fork(watchGetChartsData)]);
}

export default dashboardSaga;
