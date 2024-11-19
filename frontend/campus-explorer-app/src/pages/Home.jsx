import React, { useState, useEffect } from "react";
import MapWithMarkers from "../components/MapWithMarkers";
import SearchBar from "../components/SearchBar";
import { getAllBuildingsQuery } from "../query/getAllBuildingsQuery";
import getBuildings from "../hooks/getBuildings";

function Home() {
  const [buildings, setbuildings] = useState([]);

  // fetch all buildings once when the page renders
  useEffect(() => {
    const fetchBuildings = async () => {
      try {
        const buildings = await getBuildings(getAllBuildingsQuery());
        setbuildings(buildings);
      } catch (err) {
        console.error("Error fetching buildings:", err);
      }
    };
    fetchBuildings();
  }, []);

  return (
    <div className="d-flex flex-column gap-2">
      <SearchBar setResults={setbuildings} />
      <MapWithMarkers locations={buildings} />
    </div>
  );
}

export default Home;
