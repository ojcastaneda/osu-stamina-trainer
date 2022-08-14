import { ChangeEvent, useState } from 'react';

interface NumericInputProps {
	initialValue: number;
	size?: number;
	setValue: (value: number) => void;
	placeholder: string;
}

export default function NumericInput({
	initialValue,
	size = 6,
	setValue,
	placeholder
}: NumericInputProps) {
	const [inputValue, setInputValue] = useState(`${initialValue}`);

	function onChange({ target }: ChangeEvent<HTMLInputElement>) {
		const stringValue = target.value;
		const value = Number(stringValue);
		if (isNaN(value)) return setInputValue(inputValue);
		setValue(value);
		setInputValue(stringValue);
	}

	return (
		<input
			maxLength={10}
			onChange={onChange}
			placeholder={placeholder}
			size={size}
			value={inputValue === '0' ? '' : inputValue}
		/>
	);
}
