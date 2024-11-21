const getRoomQuery = (order, filter) => {
    const orderOptions = {
      "": "rooms_shortname",
      asc: { dir: "UP", keys: ["rooms_seats"] },
      dsc: { dir: "DOWN", keys: ["rooms_seats"] },
    };

	const wrappedFilter = Object.keys(filter)[0] == "rooms_type" || Object.keys(filter)[0] == "rooms_furniture"?
		{IS: {...filter}} : filter;

	return {
      query: {
        WHERE: {
			...wrappedFilter,
		},
        OPTIONS: {
          COLUMNS: [
            "rooms_shortname",
            "rooms_fullname",
            "rooms_lat",
            "rooms_lon",
            "rooms_number",
            "rooms_address",
            "rooms_seats",
            "rooms_type",
            "rooms_furniture",
          ],
          ORDER: orderOptions[order],
        },
        TRANSFORMATIONS: {
          GROUP: [
            "rooms_shortname",
            "rooms_fullname",
            "rooms_lat",
            "rooms_lon",
            "rooms_number",
            "rooms_address",
            "rooms_seats",
            "rooms_type",
            "rooms_furniture",
          ],
          APPLY: [],
        },
      },
    };
  };

  export default getRoomQuery;
