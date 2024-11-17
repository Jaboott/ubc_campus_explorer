import React from "react";
import { FormControl, InputLabel, Select, MenuItem } from "@mui/material";

// reference https://mui.com/material-ui/react-select/
function SortButton({ order, setOrder }) {
  const handleChange = (event) => {
    const value = event.target.value;
    setOrder(value);
  };

  return (
    <FormControl sx={{ width: 180 }}>
      <InputLabel id="Sort">Order</InputLabel>
      <Select
        labelId="Sort"
        id="Sort-Capacity"
        value={order}
        label="Order"
        onChange={handleChange}
      >
        <MenuItem value="">Choose Order</MenuItem>
        <MenuItem value="asc">Ascending</MenuItem>
        <MenuItem value="dsc">Descending</MenuItem>
      </Select>
    </FormControl>
  );
}

export default SortButton;
