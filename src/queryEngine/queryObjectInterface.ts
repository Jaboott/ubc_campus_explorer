export interface OPTIONS {
	COLUMNS: string[];
	ORDER?: string | { dir: string; keys: string[] };
}

export interface FILTER {
	LT?: Record<string, number>;
	GT?: Record<string, number>;
	EQ?: Record<string, number>;
	IS?: Record<string, string>;
	AND?: FILTER[];
	OR?: FILTER[];
	NOT?: FILTER;
}

export interface Content {
	WHERE: FILTER;
	OPTIONS: OPTIONS;
	TRANSFORMATIONS?: TRANSFORMATIONS;
}

export interface TRANSFORMATIONS {
	GROUP: string[];
	APPLY: Record<string, Record<string, string>>[];
}
