const fetch = require('node-fetch');

const requestServer = async (body, url) => {
	const response = await fetch(process.env.SERVER_API + url, {
		method: 'POST',
		headers: global.serverRequestHeaders,
		contentType: 'application/json',
		body: JSON.stringify(body)
	});
	if (response.ok) return await response.json();
	else return response.status;
};

module.exports = {requestServer};