import { parseLanguage } from '../src/commands/updateLanguage';
import { Languages } from '../src/i18n';

const languages: Languages[] = ['en', 'es'];

test('Update language parsing', () => {
	for (const language of languages) {
		expect(parseLanguage('1', language)).toStrictEqual([1, language]);
	}
});

test('Update language guessing', () => {
	for (const language of languages) {
		expect(parseLanguage('error', language)[1]).toStrictEqual(`!language 6484647 ${language}`);
		expect(parseLanguage('1', 'error')[1]).toStrictEqual(`!language 1 en`);
		expect(parseLanguage('error', 'error')[1]).toStrictEqual(`!language 6484647 en`);
	}
});
