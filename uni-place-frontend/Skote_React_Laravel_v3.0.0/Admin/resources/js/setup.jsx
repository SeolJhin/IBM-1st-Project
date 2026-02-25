import React from "react";
import { useSelector } from "react-redux";
import { Routes, Route } from "react-router-dom";
import { layoutTypes } from "./constants/layout";

import {publicRoutes, authProtectedRoutes} from "./routes/allRoutes";

import VerticalLayout from "./components/VerticalLayout/";
import HorizontalLayout from "./components/HorizontalLayout/";
import NonAuthLayout from "./components/NonAuthLayout";

import fakeBackend from "./helpers/AuthType/fakeBackend";
import AuthProtected from './routes/AuthProtected';
import { createSelector } from "reselect";

// Activating fake backend
fakeBackend();

const getLayout = (layoutType) => {
    let Layout = VerticalLayout;
    switch (layoutType) {
      case layoutTypes.VERTICAL:
        Layout = VerticalLayout;
        break;
      case layoutTypes.HORIZONTAL:
        Layout = HorizontalLayout;
        break;
      default:
        break;
    }
    return Layout;
  };

const Index = () => {
    const selectLayoutData = createSelector(
        (state) => state.Layout,
        (layoutType) => layoutType
    );
    const { layoutType } = useSelector(selectLayoutData);
    const Layout = getLayout(layoutType);
    return (
        <React.Fragment>
        <Routes>
            <Route>
                {publicRoutes.map((route, idx) => (
                    <Route
                        path={route.path}
                        element={
                            <NonAuthLayout>
                                {route.component}
                            </NonAuthLayout>
                        }
                        key={idx}
                        exact={true}
                    />
                ))}
            </Route>

            <Route>
                {authProtectedRoutes.map((route, idx) => (
                    <Route
                        path={route.path}
                        element={
                            <AuthProtected>
                                <Layout>{route.component}</Layout>
                            </AuthProtected>
                        }
                        key={idx}
                        exact={true}
                    />
                ))}
            </Route>
        </Routes>
    </React.Fragment>
    );
  };
  
  export default Index;