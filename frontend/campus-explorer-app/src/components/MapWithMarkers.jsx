import React, { useEffect, useState } from "react";
import { APIProvider, Map, AdvancedMarker, Pin } from "@vis.gl/react-google-maps";

// https://visgl.github.io/react-google-maps/docs/get-started
function MapWithMarkers() {
    const mapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    const mapID = "eb2d36cf0095db5e";
    const [locations, setLocations] = useState([]);

    // NOTE: Add the dataset using a PUT request before proceeding
	// Fetch all building information once when the page renders
	useEffect(() => {
        const allBuildingsQuery = {
			"query": {
				"WHERE": {},
				"OPTIONS": {
					"COLUMNS": ["rooms_shortname", "rooms_fullname", "rooms_lat", "rooms_lon"],
					"ORDER": "rooms_shortname"
				},
				"TRANSFORMATIONS": {
					"GROUP": ["rooms_shortname", "rooms_fullname", "rooms_lat", "rooms_lon"],
					"APPLY": []
				}
			}
		};		
		
		// I'm using my IP address here because for some reason localhost wouldn't work for me...
		// Otherwise we could just use /query in fetch
		const apiUrl = "http://localhost:4321/query";

		fetch(apiUrl, {
        // fetch("/query", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(allBuildingsQuery)
        })
            .then(response => {
                if (response.ok) {
                    return response.json();
                }
            })
            .then(data => {
                if (data.result) {
                    const buildingLocations = data.result.map(item => ({
                        shortname: item.rooms_shortname,
						fullname: item.rooms_fullname,
                        location: { lat: item.rooms_lat, lng: item.rooms_lon }
                    }));
                    setLocations(buildingLocations);
                }
            })
            .catch(err => {
                console.log("error:", err.message);
            });
    }, []);

    return (
        <div className="d-flex justify-content-center">
            <APIProvider apiKey={mapsApiKey}>
                <Map
                    style={{ width: "50vw", height: "50vh" }}
                    defaultCenter={{ lat: 49.26115791687482, lng: -123.24602244318108 }} // UBC: 49.26115791687482, -123.24602244318108
                    defaultZoom={14}
                    gestureHandling={"greedy"}
					// disableDefaultUI={true}
                    mapId={mapID}
                >
                    <PoiMarkers pois={locations} />
                </Map>
            </APIProvider>
        </div>
    );
}

// https://developers.google.com/codelabs/maps-platform/maps-platform-101-react-js#0
const PoiMarkers = ({ pois }) => (
    <>
        {pois.map(poi => (
            <AdvancedMarker key={poi.key} position={poi.location}>
                <Pin background={"#FBBC04"} glyphColor={"#000"} borderColor={"#000"} />
            </AdvancedMarker>
        ))}
    </>
);

export default MapWithMarkers;