import {Entity, Tables} from './database';

/**
 * Class that represents the filters used in the prepared statements queries.
 */
class Filter<Type extends Entity> {
	/**
	 * The filter's property to filter by in the prepared statements.
	 */
	public property: (keyof Type);

	/**
	 * The filter's conditional operators to filter by in the prepared statements.
	 */
	public operator: Operator;

	/**
	 * The filter's value to filter by in the prepared statements.
	 */
	public value: any;

	/**
	 * Creates an instance of a filter.
	 *
	 * @param filterProperty - The target property.
	 * @param operator - The operator for filtering.
	 * @param value - The value for filtering using the operator.
	 */
	constructor(property: (keyof Type), operator: Operator, value: any) {
		this.property = property;
		this.operator = operator;
		this.value = value;
	}
}

enum Operator {
	minimum = 'minimum', maximum = 'maximum', exact = 'exact', like = 'like', different = 'different'
}

/**
 * Generates a prepared statement where clause and values to dynamically filter rows for any table
 *
 * @param filters - The dynamic filters with a variable property, value and conditional operator
 * @param numericFilters - The array of the allowed properties to filter by using numeric conditional operators
 * @param stringFilters - The array of the allowed properties to filter by using string and boolean conditional operators
 * @returns An array with the where clause of the prepared statement in the first position and the values in the second position
 */
const generateSelectConditionQuery = <Type extends Entity>(filters: Filter<Type>[],
	allowedFilters: (keyof Type)[]): [conditionQuery: string, values: any[]] => {
	const values: any[] = [];
	let filterQueries: string[] = [];
	filters.forEach((filter, index) => {
		const {property, value, operator} = filter;
		if (!allowedFilters.includes(property)) return;
		const filterQuery = generateFilterQuery(property, operator, index + 1);
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
const generateUpdateQuery = <Type extends Entity>(table: Tables, instance: Type): [query: string | undefined, values: any[]] => {
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
 * for filters.
 *
 * @param property - The property to filter by in the prepared statement query.
 * @param operator - The conditional operator to filter by in the prepared statement query.
 * @param index - The index for the prepared statement condition in the prepared statement query.
 * @returns A string in prepared statement conditional format if the property matches the allowed operators.
 */
const generateFilterQuery = <Type extends Entity>(property: (keyof Type), operator: Operator, index: number): string | undefined => {
	switch (operator) {
		case Operator.minimum:
			return `${property} >= $${index}`;
		case Operator.maximum:
			return `${property} <= $${index}`;
		case Operator.exact:
			return `${property} = $${index}`;
		case Operator.like:
			return `${property} ILIKE CONCAT('%', $${index}, '%')`;
		case Operator.different:
			return `${property} != $${index}`;
		default:
			return;
	}
};

export default Filter;
export {Operator, generateUpdateQuery, generateSelectConditionQuery};
