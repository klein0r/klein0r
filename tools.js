'use strict';

const fs = require('node:fs');
const axios = require('axios').default;

async function getData(url) {
    console.log(`downloading: ${url}`);
    const response = await axios.get(url, { responseType: 'json', timeout: 5000 });
    if (response.status === 200) {
        return response.data;
    }

    return null;
}

function getYearMonthKey(date) {
    const month = date.getUTCMonth() + 1;

    return `${date.getUTCFullYear()}-${month < 10 ? '0' + month : month}`;
}

function getPreviousMonthValue() {
    const d = new Date();
    d.setUTCMonth(d.getUTCMonth() - 1); // Previous month
    d.setUTCDate(1);

    const prevKey = getYearMonthKey(d.getTime());
    const ioBrokerForumPosts = JSON.parse(fs.readFileSync('ioBrokerForum.json'));

    if (Object.prototype.hasOwnProperty.call(ioBrokerForumPosts, prevKey)) {
        return ioBrokerForumPosts[prevKey];
    } else {
        return undefined;
    }
}

function updateCurrentMonthValue(postCount) {
    const key = getYearMonthKey(new Date());
    const postsByMonth = JSON.parse(fs.readFileSync('ioBrokerForum.json'));

    postsByMonth[key] = posts;

    fs.writeFileSync('ioBrokerForum.json', JSON.stringify(postsByMonth, null, 2));
}

module.exports = {
    getData,
    getYearMonthKey,
    getPreviousMonthValue,
    updateCurrentMonthValue,
};
