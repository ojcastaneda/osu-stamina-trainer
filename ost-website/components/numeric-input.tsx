import { ChangeEvent, useState } from 'react';

interface NumericInputProps {
	size?: number;
	setValue: (value: number) => void;
	placeholder: string;
}

export default function NumericInput({ size = 6, setValue, placeholder }: NumericInputProps) {
	const [inputValue, setInputValue] = useState('');

	function onChange({ target }: ChangeEvent<HTMLInputElement>) {
		let stringValue = target.value;
		const value = Number(stringValue);
		if (isNaN(value)) return setInputValue(inputValue);
		if (/^0+/.test(stringValue)) stringValue = stringValue.replace(/^0+(?!\.|$)/, '');
		setValue(value);
		setInputValue(stringValue);
	}

	return (
		<input
			maxLength={10}
			onChange={onChange}
			placeholder={placeholder}
			size={size}
			value={inputValue}
		/>
	);
}
