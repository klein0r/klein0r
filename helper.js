'use strict';

const fs = require('node:fs');
const tools = require('./tools');

async function getPosts(page) {
    console.log(`Getting posts of page ${page}`);
    const data = await tools.getData(`https://forum.iobroker.net/api/user/haus-automatisierung/posts?page=${page}`);

    if (data.posts.length > 0) {
        return data.posts;
    } else {
        return [];
    }
}

async function collectForumPosts() {
    let page = 0;
    let hasPosts = false;
    let allPosts = [];

    do {
        const posts = await getPosts(++page);
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

            const key = tools.getYearMonthKey(new Date(post.timestamp));
            if (!Object.prototype.hasOwnProperty.call(acc, key)) {
                acc[key] = totalSoFar;
            } else {
                acc[key]++;
            }

            return acc;
        },
        {},
    );

    fs.writeFileSync('ioBrokerForum.json', JSON.stringify(postsByMonth, null, 2));
}

collectForumPosts();
