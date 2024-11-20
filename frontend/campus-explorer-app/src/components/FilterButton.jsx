import React, { useEffect, useState } from "react";
import { FormControl, InputLabel, Select, MenuItem, ListSubheader } from "@mui/material";
import getFilterOptions from "../query/getFilterOptions";

const FilterButton = ({ filter, setFilter }) => {
	// State for storing the options
	const [options, setOptions] = useState([]);

	useEffect(() => {
		const columnToGet = ["type", "furniture"];

		// wait for all fetch requests
		Promise.all(
			columnToGet.map((type) => {
				const allTypesQuery = getFilterOptions(type);
				return fetch("http://localhost:4321/query", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(allTypesQuery),
				})
					.then((response) => response.json())
					.then((data) => {
						if (data.result) {
							const distinctEntriesPerColumn = data.result.map((item) => Object.values(item)).flat();
							return distinctEntriesPerColumn;
						}
						return [];
					})
					.catch((err) => {
						console.log("error:", err.message);
						return [];
					});
			})
		).then((results) => {
			const allOptions = results.flat();
			setOptions(allOptions);
			console.log("ALL TYPES: ", allOptions);
		});
	}, []);

	const handleChange = (event) => {
		const value = event.target.value;
		setFilter(value);
	};

	return (
		<FormControl sx={{ width: 150 }}>
			<InputLabel id="Filter">Filters</InputLabel>
			<Select value={filter} label="Filter" onChange={handleChange}>
				<MenuItem value={""}>{"Choose Filter"}</MenuItem>
                {options.map((option) => (
					<MenuItem key={option} value={option}>
						{option}
					</MenuItem>
				))}
                <ListSubheader>Seating Capacity</ListSubheader>
                <MenuItem value={"Min Seats"}>{"Min Seats"}</MenuItem>
                <MenuItem value={"Max Seats"}>{"Max Seats"}</MenuItem>
			</Select>
		</FormControl>
	);
};

export default FilterButton;
