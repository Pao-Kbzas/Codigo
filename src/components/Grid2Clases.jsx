import React from 'react';
import { Grid as MuiGrid } from '@mui/material';

const Grid2Clases = (props) => {
  return <MuiGrid {...props}>{props.children}</MuiGrid>;
};

export default Grid2Clases;
