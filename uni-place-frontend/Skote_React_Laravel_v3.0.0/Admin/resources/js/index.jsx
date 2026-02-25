import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './setup'
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import "./i18n";

import store from "./store";

if (document.getElementById('react-app')) {
    const root = ReactDOM.createRoot(document.getElementById("react-app"));
    root.render(
        <Provider store={store}>
            <React.Fragment>
                <BrowserRouter>
                    <App />
                </BrowserRouter>
            </React.Fragment>
        </Provider>
    );
}
