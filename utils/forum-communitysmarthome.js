'use strict';

const fs = require('node:fs');
const path = require('node:path');
const httpUtils = require('./http');

const JSON_FILE_NAME = path.join(__dirname, '../forum-communitySmarthome.json');

function readStats() {
    return JSON.parse(fs.readFileSync(JSON_FILE_NAME));
}

function writeStats(data) {
    fs.writeFileSync(JSON_FILE_NAME, JSON.stringify(data, null, 2));
}

function getYearMonthKey(date) {
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');

    return `${date.getUTCFullYear()}-${month}`;
}

async function getUserData(username) {
    const data = await httpUtils.getData(`https://community-smarthome.com/u/${username}/summary.json`);
    return data;
}

function getPreviousMonthValue(diffMonth) {
    const d = new Date();
    d.setUTCDate(1);
    d.setUTCMonth(d.getUTCMonth() - diffMonth); // Previous months

    const prevKey = getYearMonthKey(d);
    const stats = readStats();

    if (Object.prototype.hasOwnProperty.call(stats, prevKey)) {
        //console.log(`[getPreviousMonthValue] -${diffMonth} month (${d.toISOString()}): ${stats[prevKey]}`);
        return stats[prevKey];
    } else {
        return undefined;
    }
}

function updateCurrentMonthValue(postCount) {
    const key = getYearMonthKey(new Date());
    const stats = readStats();

    stats[key] = postCount;

    writeStats(stats);
}

async function getPosts(username, offset) {
    console.log(`Getting posts with offset ${offset}`);
    const data = await httpUtils.getData(`https://community-smarthome.com/user_actions.json?offset=${offset}&username=${username}&filter=5`);

    if (data.user_actions.length > 0) {
        return data.user_actions;
    } else {
        return [];
    }
}

async function collectPosts(username) {
    let offset = 0;
    let hasPosts = false;
    let allPosts = [];

    do {
        const posts = await getPosts(username, offset);
        hasPosts = posts.length > 0;

        if (hasPosts) {
            allPosts = allPosts.concat(posts);
            offset += posts.length;
        }
    } while (hasPosts);

    allPosts.sort((a, b) => a.created_at - b.created_at);

    let totalSoFar = 0;
    const stats = allPosts.reduce(
        (acc, post) => {
            totalSoFar++;

            const key = getYearMonthKey(new Date(post.created_at));
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
    getUserData,
    getPreviousMonthValue,
    updateCurrentMonthValue,
    collectPosts,
};
