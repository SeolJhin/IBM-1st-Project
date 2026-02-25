import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { changeLayoutMode } from '../store/actions';
import { createSelector } from 'reselect';

const NonAuthLayout = (props) => {
  const dispatch = useDispatch();

  const layoutSelector = createSelector(
    state => state.Layout,
    layout => ({
      layoutModeType: layout.layoutModeType,
    })
  );

  const { layoutModeType } = useSelector(layoutSelector);

  useEffect(() => {
    if (layoutModeType) {
      dispatch(changeLayoutMode(layoutModeType)); // Use dispatch directly, not useDispatch()
    }
  }, [layoutModeType, dispatch]);

  return <React.Fragment>{props.children}</React.Fragment>;
};

NonAuthLayout.propTypes = {
  children: PropTypes.any,
};

export default NonAuthLayout;
