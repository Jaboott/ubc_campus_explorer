import React from "react";
import { APIProvider, Map, AdvancedMarker, Pin } from "@vis.gl/react-google-maps";

// https://visgl.github.io/react-google-maps/docs/get-started
function MapWithMarkers({ locations }) {
	const mapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
	const mapID = "eb2d36cf0095db5e";

	return (
		<div className="d-flex justify-content-center">
			<APIProvider apiKey={mapsApiKey}>
				<Map
					style={{ width: "70vw", height: "70vh" }}
					defaultCenter={{ lat: 49.26115791687482, lng: -123.24602244318108 }} // UBC: 49.26115791687482, -123.24602244318108
					defaultZoom={14}
					gestureHandling={"greedy"}
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
		{pois.map((poi, index) => (
			<AdvancedMarker key={index} position={poi.location}>
				<Pin background={"#FBBC04"} glyphColor={"#000"} borderColor={"#000"} />
			</AdvancedMarker>
		))}
	</>
);

export default MapWithMarkers;