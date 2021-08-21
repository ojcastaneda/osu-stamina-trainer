const fetch = require('node-fetch');

const serverTokenRequest = async () => {

	const csrfRequest = await fetch(`${process.env.SERVER_API}authentication/signIn`, {
		method: 'GET',
		credentials: 'include',
		headers: {
			'Accept': 'application/json',
			'Content-Type': 'application/json'
		}
	});
	const csrfToken = await csrfRequest.text();
	const headers = {
		'Accept': 'application/json',
		'Content-Type': 'application/json',
		'csrf-token': csrfToken,
		'cookie': [csrfRequest.headers.get('set-cookie')]
	};
	await fetch(`${process.env.SERVER_API}authentication/signIn`, {
		headers,
		method: 'POST',
		credentials: 'include',
		body: JSON.stringify({
			'username': process.env.SERVER_USERNAME,
			'password': process.env.SERVER_PASSWORD
		})
	});
	global.headers = headers;
};

module.exports = {serverTokenRequest};