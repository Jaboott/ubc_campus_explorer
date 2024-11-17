const getRoomQuery = (order) => {
    const orderOptions = {
      "": "rooms_shortname",
      asc: { dir: "UP", keys: ["rooms_seats"] },
      dsc: { dir: "DOWN", keys: ["rooms_seats"] },
    };
  
    return {
      query: {
        WHERE: {},
        OPTIONS: {
          COLUMNS: [
            "rooms_shortname",
            "rooms_fullname",
            "rooms_lat",
            "rooms_lon",
            "rooms_number",
            "rooms_address",
            "rooms_seats",
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
          ],
          APPLY: [],
        },
      },
    };
  };

  export default getRoomQuery;