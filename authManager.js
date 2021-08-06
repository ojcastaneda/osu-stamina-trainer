const fetch = require('node-fetch');

const serverTokenRequest = async () => {
    const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'withCredentials': true,
        cookie: null
    };

    const request = await fetch(`${process.env.SERVER_API}auth/signIn`, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'withCredentials': true
        },
        body: JSON.stringify({
            'username': process.env.SERVER_USERNAME,
            'password': process.env.SERVER_PASSWORD
        })
    });
    headers.cookie = [request.headers.get('set-cookie')];
    global.headers = headers;
}

module.exports = {serverTokenRequest};