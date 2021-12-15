/**
 * Class that represents the filters used in the prepared statements queries.
 */
class Filter {
	/**
	 * The filter's property to filter by in the prepared statements.
	 */
	public filterProperty: string;

	/**
	 * The filter's value to filter by in the prepared statements.
	 */
	public value: any;

	/**
	 * The filter's conditional operators to filter by in the prepared statements.
	 */
	public operator: string;

	/**
	 * Creates an instance of a filter.
	 *
	 * @param filterProperty - The target property.
	 * @param operator - The operator for filtering.
	 * @param value - The value for filtering using the operator.
	 */
	constructor(filterProperty: string, operator: string, value: any) {
		this.filterProperty = filterProperty;
		this.operator = operator;
		this.value = value;
	}
}

/**
 * Generates a prepared statement where clause and values to dynamically filter rows for any table
 *
 * @param filters - The dynamic filters with a variable property, value and conditional operator
 * @param numericFilters - The array of the allowed properties to filter by using numeric conditional operators
 * @param stringFilters - The array of the allowed properties to filter by using string and boolean conditional operators
 * @param rawFilters - The raw filters that are directly provided in the query
 * @returns An array with the where clause of the prepared statement in the first position and the values in the second position
 */
const generateSelectConditionQuery = (
	filters: Filter[],
	numericFilters: string[],
	stringFilters: string[],
	rawFilters: string[]
): [conditionQuery: string, values: any[]] => {
	const values: any[] = [];
	let filterQueries: string[] = rawFilters;
	filters.forEach((filter, index) => {
		const { filterProperty, value, operator } = filter;
		let filterQuery: string | undefined;
		if (numericFilters.includes(filterProperty)) filterQuery = generateNumericFilterQuery(filterProperty, operator, index + 1);
		else if (stringFilters.includes(filterProperty)) filterQuery = generateStringFilterQuery(filterProperty, operator, index + 1);
		if (filterQuery === undefined) throw 'Incorrect filters';
		values.push(value);
		filterQueries.push(filterQuery);
	});
	if (filterQueries.length === 0) return ['', []];
	return [`WHERE ${filterQueries.join(' AND ')}`, values];
};

/**
 * Generates a complete prepared statement query and values for dynamically update in the provided table only the provided properties
 *
 * @param table - The table where the prepared statement update query will be executed
 * @param instance - The instance of a persistence class containing the properties and the id of the row to update
 * @returns An array with the prepared statement query in the first position and the values in the second position
 */
const generateUpdateQuery = (table: string, instance: any): [query: string | undefined, values: any[]] => {
	const properties: string[] = [];
	const values: any[] = [];
	let index = 1;
	for (const property in instance) {
		if (instance[property] === undefined || instance[property] === null || property === 'id') continue;
		values.push(instance[property]);
		properties.push(`${property} = $${index}`);
		index++;
	}
	if (properties.length === 0) return [undefined, []];
	values.push(instance.id);
	return [`UPDATE ${table} SET ${properties.join(', ')} WHERE id = $${values.length}`, values];
};

/**
 * Generates a prepared statement condition based on a property, an operator and the index of the condition in the prepared statement query
 * for numeric filters
 *
 * @param property - The property to filter by in the prepared statement query
 * @param operator - The conditional operator to filter by in the prepared statement query
 * @param index - The index for the prepared statement condition in the prepared statement query
 * @returns A string in prepared statement conditional format if the property matches the allowed operators
 */
const generateNumericFilterQuery = (property: string, operator: string, index: number): string | undefined => {
	switch (operator) {
		case 'minimum':
			return `${property} >= $${index}`;
		case 'maximum':
			return `${property} <= $${index}`;
		case 'exact':
			return `${property} = $${index}`;
	}
};

/**
 * Generates a prepared statement condition based on a property, an operator and the index of the condition in the prepared statement query
 * for string and boolean filters
 *
 * @param property - The property to filter by in the prepared statement query
 * @param operator - The conditional operator to filter by in the prepared statement query
 * @param index - The index for the prepared statement condition in the prepared statement query
 * @returns A string in prepared statement conditional format if the property matches the allowed operators
 */
const generateStringFilterQuery = (property: string, operator: string, index: number): string | undefined => {
	switch (operator) {
		case 'like':
			return `${property} ILIKE CONCAT('%', $${index}, '%')`;
		case 'exact':
			return `${property} = $${index}`;
		case 'different':
			return `${property} != $${index}`;
	}
};

export default Filter;
export { generateUpdateQuery, generateSelectConditionQuery };
