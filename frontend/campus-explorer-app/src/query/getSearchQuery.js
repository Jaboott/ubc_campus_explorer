export const getSearchQuery = (searchQuery) => {
  return {
    query: {
      WHERE: {
        IS: {
          "rooms_shortname": searchQuery
        }
      },
      OPTIONS: {
        COLUMNS: [
          "rooms_shortname",
          "rooms_fullname",
          "rooms_lat",
          "rooms_lon",
          "rooms_address"
        ]
      },
      TRANSFORMATIONS: {
        GROUP: [
          "rooms_shortname",
          "rooms_fullname",
          "rooms_lat",
          "rooms_lon",
          "rooms_address"
        ],
        APPLY: []
      }
    }
  };
};
