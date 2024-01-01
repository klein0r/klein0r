'use strict';

const fs = require('node:fs');
const path = require('node:path');
const httpUtils = require('./http');

const JSON_FILE_NAME = path.join(__dirname, '../ioBrokerForum.json');

function readStats() {
    return JSON.parse(fs.readFileSync(JSON_FILE_NAME));
}

function writeStats(data) {
    fs.writeFileSync(JSON_FILE_NAME, JSON.stringify(data, null, 2));
}

function getYearMonthKey(date) {
    const month = date.getUTCMonth() + 1;

    return `${date.getUTCFullYear()}-${month < 10 ? '0' + month : month}`;
}

async function getUserData(username) {
    const data = await httpUtils.getData(`https://forum.iobroker.net/api/user/${username}/`);
    return data;
}

function getPreviousMonthValue(diffMonth) {
    const d = new Date();
    d.setUTCMonth(d.getUTCMonth() - diffMonth); // Previous month
    d.setUTCDate(1);

    const prevKey = getYearMonthKey(d);
    const ioBrokerForumPosts = readStats();

    if (Object.prototype.hasOwnProperty.call(ioBrokerForumPosts, prevKey)) {
        return ioBrokerForumPosts[prevKey];
    } else {
        return undefined;
    }
}

function updateCurrentMonthValue(postCount) {
    const key = getYearMonthKey(new Date());
    const postsByMonth = readStats();

    postsByMonth[key] = postCount;

    writeStats(postsByMonth);
}

async function getPosts(username, page) {
    console.log(`Getting posts of page ${page}`);
    const data = await httpUtils.getData(`https://forum.iobroker.net/api/user/${username}/posts?page=${page}`);

    if (data.posts.length > 0) {
        return data.posts;
    } else {
        return [];
    }
}

async function collectForumPosts(username) {
    let page = 0;
    let hasPosts = false;
    let allPosts = [];

    do {
        const posts = await getPosts(username, ++page);
        hasPosts = posts.length > 0;

        if (hasPosts) {
            allPosts = allPosts.concat(posts);
        }
    } while (hasPosts);

    allPosts.sort((a, b) => a.timestamp - b.timestamp);

    let totalSoFar = 0;
    const postsByMonth = allPosts.reduce(
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

    writeStats(postsByMonth);
}

module.exports = {
    getUserData,
    getPreviousMonthValue,
    updateCurrentMonthValue,
    collectForumPosts,
};
