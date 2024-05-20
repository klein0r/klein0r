'use strict';

const fs = require('node:fs');
const path = require('node:path');
const httpUtils = require('./http');

const JSON_FILE_NAME = path.join(__dirname, '../gitHubContributions.json');

async function getContributions(username, page) {
    console.log(`Getting posts of page ${page}`);
    const data = await httpUtils.getData(`https://api.github.com/users/${username}/events?page=${page}`);

    if (Array.isArray(data) && data.length > 0) {
        return data;
    } else {
        return [];
    }
}

async function collectContributions(username) {
    let page = 1;
    let hasContributions = false;
    let allContributions = [];

    do {
        const posts = await getContributions(username, ++page);
        hasContributions = posts.length > 0;

        if (hasContributions) {
            allContributions = allContributions.concat(posts);
        }
    } while (hasContributions);

    allContributions.sort((a, b) => a.created_at - b.created_at);

    let totalSoFar = 0;
    const stats = allPosts.reduce(
        (acc, post) => {
            totalSoFar++;

            const key = getYearMonthKey(new Date(post.timestamp));
            if (!Object.prototype.hasOwnProperty.call(acc, key)) {
                acc[key] = totalSoFar;
            } else {
                acc[key]++;
            }

            return acc;
        },
        {},
    );

    writeStats(stats);
}

module.exports = {
    collectContributions,
};
