/**
 * Interface that represents the sorting order used in the prepared statements queries.
 */
interface Sort {
	/**
	 * The sort's dynamic property to sort by in the prepared statements.
	 */
	sortProperty: string;

	/**
	 * The sort's dynamic order to sort by in the prepared statements.
	 */
	order: string;
}

/**
 * Generates a prepared statement order clause and values to dynamically order rows for any table.
 *
 * @param property - The property to sort by in the prepared statement query.
 * @param order - The order to sort by in the prepared statement query.
 * @param allowedProperties - The array of allowed properties to sort by.
 * @returns A string in prepared statement order format if the property matches the allowed properties.
 */
const generateOrderQuery = (property: string, order: string, allowedProperties: string[]): string => {
	const upperCaseOrder = order.toUpperCase();
	if (!(upperCaseOrder === 'DESC' || upperCaseOrder === 'ASC') || !allowedProperties.includes(property)) return '';
	return `ORDER BY ${property} ${order.toUpperCase()}`;
};

export default Sort;
export { generateOrderQuery };
