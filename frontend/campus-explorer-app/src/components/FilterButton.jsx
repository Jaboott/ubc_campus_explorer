// import Select from 'react-select'
import React from "react";
import { FormControl, InputLabel, Select, MenuItem } from "@mui/material";

// reference: https://mui.com/material-ui/react-select/
const FilterButton = ({ filter, setFilter }) => {
	// Options for the Select component
	const options = [
		{ value: "", label: "Choose Room Type" },
		{ value: "Studio Lab", label: "Studio Lab" },
		{ value: "Active Learning", label: "Active Learning" },
		{ value: "Case Style", label: "Case Style" },
		{ value: "Small Group", label: "Small Group" },
		{ value: "Open Design General Purpose", label: "Open Design General Purpose" },
		{ value: "Tiered Large Group", label: "Tiered Large Group" },
	];

	// Handle the change when an option is selected
	const handleChange = (event) => {
		const value = event.target.value;
		setFilter(value); // Update the state with the selected value
	};

	return (
		<FormControl sx={{ width: 150 }}>
			<InputLabel id="Filter">Filters</InputLabel>
			<Select value={filter} label="Filter" onChange={handleChange}>
				{options.map((option) => (
					<MenuItem key={option.value} value={option.value}>
						{option.label}
					</MenuItem>
				))}
			</Select>
		</FormControl>
	);
};

export default FilterButton;
