const fetch = require('cross-fetch');

const requestServer = async (body, url) => {
    let response = await fetch(process.env.SERVER_API + url, {
        method: 'POST',
        headers: global.serverRequestHeaders,
        body: JSON.stringify(body)
    })
    if (response.ok) {
        response = await response.json();
        return response;
    }

}

module.exports = {requestServer};