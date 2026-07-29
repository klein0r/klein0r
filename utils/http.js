'use strict';

const axios = require('axios').default;
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

function sleep (time) {
    return new Promise((resolve) => setTimeout(resolve, time));
}

function hashForCache(url) {
    console.log(`hashing url (${typeof url}): ${url}`);
    return crypto.createHash('md5').update(url).digest('hex');
}

function getCached(url) {
    const filePath = path.join(__dirname, '../.cache/', hashForCache(url));
    return fs.existsSync(filePath) ? fs.readFileSync(filePath, { encoding: 'utf8' }) : null;
}

function saveCached(url, content) {
    const cachePath = path.join(__dirname, '../.cache/');
    if (!fs.existsSync(cachePath)) {
        fs.mkdirSync(cachePath);
    }

    if (typeof content === 'string') {
        const filePath = path.join(cachePath, hashForCache(url));
        fs.writeFileSync(filePath, content, { encoding: 'utf8' });
    }
}

async function getText(url) {
    try {
        const cachedFile = getCached(url);
        if (cachedFile !== null) {
            console.log(`loaded data (${typeof cachedFile}) from cache for: ${url}`);
            return cachedFile;
        }

        console.log(`downloading text: ${url}`);
        const response = await axios.get(url, { responseType: 'text', timeout: 5000 });

        const rateLimitRemaining = response?.headers?.['x-ratelimit-remaining'];
        if (rateLimitRemaining) {
            console.log(`  x-ratelimit-remaining: ${rateLimitRemaining}`);
        }

        if (response.status === 200) {
            saveCached(url, response.data);
            return response.data;
        }

        return null;
    } catch (err) {
        console.log(`  http error: ${err}`);
        return null;
    }
}

async function getData(url) {
    const cachedFile = getCached(url);
    if (cachedFile !== null) {
        console.log(`loaded data (${typeof cachedFile}) from cache for: ${url}`);
        return JSON.parse(cachedFile);
    }

    console.log(`downloading data: ${url}`);
    const response = await axios.get(url, { responseType: 'json', timeout: 5000 });

    const rateLimitRemaining = response?.headers?.['x-ratelimit-remaining'];
    if (rateLimitRemaining) {
        console.log(`  x-ratelimit-remaining: ${rateLimitRemaining}`);

        if (rateLimitRemaining == 1) {
            await sleep(60000);
        }
    }

    if (response.status === 200) {
        saveCached(url, JSON.stringify(response.data, null, 2));
        return response.data;
    }

    return null;
}

module.exports = {
    getText,
    getData,
};
