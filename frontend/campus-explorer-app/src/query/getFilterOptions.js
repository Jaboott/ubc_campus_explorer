const getFilterOptions = (type) => {
	const base_filter = "rooms_" + type;

	return {
		query: {
			WHERE: {},
			OPTIONS: {
				COLUMNS: [base_filter],
			},
			TRANSFORMATIONS: {
				GROUP: [base_filter],
				APPLY: [],
			},
		},
	};
};

export default getFilterOptions;
