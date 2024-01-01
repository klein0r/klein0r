'use strict';

const axios = require('axios').default;

async function getData(url) {
    console.log(`downloading: ${url}`);
    const response = await axios.get(url, { responseType: 'json', timeout: 5000 });
    if (response.status === 200) {
        return response.data;
    }

    return null;
}

module.exports = {
    getData,
};
