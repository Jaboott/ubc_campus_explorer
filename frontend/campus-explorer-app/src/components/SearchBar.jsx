import * as React from "react";
import Paper from "@mui/material/Paper";
import InputBase from "@mui/material/InputBase";
import IconButton from "@mui/material/IconButton";
import SearchIcon from "@mui/icons-material/Search";
import { getSearchQuery } from "../query/getSearchQuery";
import { getAllBuildingsQuery } from "../query/getAllBuildingsQuery";
import getBuildings from "../hooks/getBuildings";

// type in shortname > press enter key to search
function SearchBar({ setResults }) {
	const fetchData = async (value) => {
		try {
			let buildingQuery;
			if (!value.trim()) {
				buildingQuery = getAllBuildingsQuery();
			} else {
				buildingQuery = getSearchQuery(value);
			}

			const buildings = await getBuildings(buildingQuery);
			setResults(buildings);
		} catch (err) {
			console.error("Error fetching data:", err);
			setResults([]);
		}
	};

	const handleKeyDown = (e) => {
		if (e.key === "Enter") {
			e.preventDefault(); // prevent the page from refreshing
			fetchData(e.target.value.toUpperCase());
		}
	};

	return (
		<div>
			<Paper
				elevation={3}
				component="form"
				sx={{
					display: "flex",
					alignItems: "center",
					width: 500,
					margin: "0 auto",
					borderRadius: "8px",
				}}
			>
				<InputBase sx={{ ml: 1, flex: 1 }} placeholder="Find a building..." onKeyDown={handleKeyDown} />
				<IconButton type="button" sx={{ p: "10px" }}>
					<SearchIcon />
				</IconButton>
			</Paper>
		</div>
	);
}

export default SearchBar;
