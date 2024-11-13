import { APIProvider, Map, AdvancedMarker, Pin } from "@vis.gl/react-google-maps";

const locations = [
	{ key: "biology", location: { lat: 49.26481032188259, lng: -123.25129034700498 }}, // 49.26481032188259, -123.25129034700498
    { key: "buchanan", location: { lat: 49.268717947910126, lng: -123.25462962768056}}, // 49.268717947910126, -123.25462962768056
    { key: "forestry", location: { lat: 49.2606284047533, lng: -123.24759924515484}} // 49.2606284047533, -123.24759924515484
];

function MapWithMarkers() {
	const mapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
	const mapID = "eb2d36cf0095db5e";
	return (
		<>
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
		</>
	);
}

const PoiMarkers = (props) => {
	return (
		<>
			{props.pois.map((poi) => (
				<AdvancedMarker key={poi.key} position={poi.location}>
					<Pin background={"#FBBC04"} glyphColor={"#000"} borderColor={"#000"} />
				</AdvancedMarker>
			))}
		</>
	);
};
export default MapWithMarkers;
