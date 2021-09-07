const fetch = require('node-fetch');

const serverTokenRequest = async () => {
	const response = await fetch(`${process.env.SERVER_API}requestToken`, {
		method: 'post',
		headers: {
			'Accept': 'application/json',
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			"username": process.env.SERVER_USERNAME,
			"password": process.env.SERVER_PASSWORD
		})
	});
	global.serverRequestHeaders = {
		'Accept': 'application/json',
		'Content-Type': 'application/json',
		'Authorization': `Bearer ${(await response.json()).token}`
	};
};

module.exports = {serverTokenRequest};