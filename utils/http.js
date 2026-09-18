'use strict';

const axios = require('axios').default;
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const https = require('node:https');

const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.6.2 Safari/605.1.15';

function sleep (time) {
    return new Promise((resolve) => setTimeout(resolve, time));
}

function hashForCache(url) {
    // console.log(`hashing url (${typeof url}): ${url}`);
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
            console.log(`loaded data (${typeof cachedFile}) from cache for: ${url} [${hashForCache(url)}]`);
            return cachedFile;
        }

        console.log(`downloading text: ${url} [cache miss]`);
        const response = await axios.get(url, {
            responseType: 'json',
            timeout: 60000,
            httpsAgent: new https.Agent({ family: 4 }),
            headers: {
                'User-Agent': USER_AGENT,
            }
        });

        const rateLimitRemaining = response?.headers?.['x-ratelimit-remaining'];
        if (rateLimitRemaining) {
            console.log(`  x-ratelimit-remaining: ${rateLimitRemaining}`);

            if (rateLimitRemaining <= 1) {
                await sleep(60000);
            }
        }

        if (response.status === 200) {
            saveCached(url, response.data);
            return response.data;
        } else {
            console.log(`downloading text of ${url} failed: ${response.status}`);
        }

        return null;
    } catch (err) {
        console.log(`  http error: ${err}`);
        return null;
    }
}

async function getData(url) {
    try {
        const cachedFile = getCached(url);
        if (cachedFile !== null) {
            console.log(`loaded data (${typeof cachedFile}) from cache for: ${url} [${hashForCache(url)}]`);
            return JSON.parse(cachedFile);
        }

        console.log(`downloading data: ${url} [cache miss]`);
        const response = await axios.get(url, {
            responseType: 'json',
            timeout: 60000,
            httpsAgent: new https.Agent({ family: 4 }),
            headers: {
                'User-Agent': USER_AGENT,
            }
        });

        const rateLimitRemaining = response?.headers?.['x-ratelimit-remaining'];
        if (rateLimitRemaining) {
            console.log(`  x-ratelimit-remaining: ${rateLimitRemaining}`);

            if (rateLimitRemaining <= 1) {
                await sleep(60000);
            }
        }

        if (response.status === 200) {
            saveCached(url, JSON.stringify(response.data, null, 2));
            return response.data;
        } else {
            console.log(`downloading data of ${url} failed: ${response.status}`);
        }

        return null;
    } catch (err) {
        console.log(`  http error: ${err}`);
        return null;
    }
}

module.exports = {
    getText,
    getData,
};
