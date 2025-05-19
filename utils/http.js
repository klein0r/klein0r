'use strict';

const axios = require('axios').default;

async function getText(url) {
    console.log(`downloading text: ${url}`);
    const response = await axios.get(url, { responseType: 'text', timeout: 5000 });

    const rateLimitRemaining = response?.headers?.['x-ratelimit-remaining'];
    if (rateLimitRemaining) {
        console.log(`  x-ratelimit-remaining: ${rateLimitRemaining}`);
    }

    if (response.status === 200) {
        return response.data;
    }

    return null;
}

async function getData(url) {
    console.log(`downloading data: ${url}`);
    const response = await axios.get(url, { responseType: 'json', timeout: 5000 });

    const rateLimitRemaining = response?.headers?.['x-ratelimit-remaining'];
    if (rateLimitRemaining) {
        console.log(`  x-ratelimit-remaining: ${rateLimitRemaining}`);
    }

    if (response.status === 200) {
        return response.data;
    }

    return null;
}

module.exports = {
    getText,
    getData,
};
