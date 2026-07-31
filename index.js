'use strict';

const httpUtils = require('./utils/http');
const iobForumUtils = require('./utils/forum-iobroker');
const forumCommunitySmarthomeUtils = require('./utils/forum-communitysmarthome');
const iobrokerUtils = require('./utils/iobroker');
const gitHubUtils = require('./utils/github');
const templateUtils = require('./utils/template');

const forumUsernameIoBroker = 'haus-automatisierung';
const forumUsernameCommunitySmarthome = 'haus_automation';
const gitHubUsername = 'klein0r';

const adapters = [
    'awtrix-light',
    'awtrix-ng',
    'birthdays',
    'comfoairq',
    'ecoflow-iot',
    'gira-iot',
    'lametric',
    'luftdaten',
    'octoprint',
    'shelly-ng',
    'trashschedule',
    'youtube',
];

const adaptersContrib = [
    { gitHubUsername: 'ioBroker', adapterSlug: 'javascript' },
    { gitHubUsername: 'ioBroker', adapterSlug: 'node-red' },
    { gitHubUsername: 'iobroker-community-adapters', adapterSlug: 'pvforecast' },
    { gitHubUsername: 'iobroker-community-adapters', adapterSlug: 'shelly' },
    { gitHubUsername: 'iobroker-community-adapters', adapterSlug: 'statistics' },
];

async function updateReadme() {
    console.log('started...');

    const templateData = {
        generatedAt: new Date().toISOString(),
        adapters: [],
        adaptersContrib: [],
        npmPackages: [],
    };

    const ioBrokerForumData = await iobForumUtils.getUserData(forumUsernameIoBroker);
    const ioBrokerForumPosts = ioBrokerForumData.counts.posts;
    const ioBrokerForumPostsLastMonth = iobForumUtils.getPreviousMonthValue(1);
    const ioBrokerForumPosts2MonthAgo = iobForumUtils.getPreviousMonthValue(2);

    iobForumUtils.updateCurrentMonthValue(ioBrokerForumPosts);

    console.log(`ioBrokerForumPosts:          ${ioBrokerForumPosts}`);
    console.log(`ioBrokerForumPostsLastMonth: ${ioBrokerForumPostsLastMonth}`);
    console.log(`ioBrokerForumPosts2MonthAgo: ${ioBrokerForumPosts2MonthAgo}`);

    const communitySmarthomeForumData = await forumCommunitySmarthomeUtils.getUserData(forumUsernameCommunitySmarthome);
    const communitySmarthomeForumPosts = communitySmarthomeForumData.user_summary.post_count;
    const communitySmarthomeForumPostsLastMonth = forumCommunitySmarthomeUtils.getPreviousMonthValue(1);
    const communitySmarthomeForumPosts2MonthAgo = forumCommunitySmarthomeUtils.getPreviousMonthValue(2);

    console.log(`communitySmarthomeForumPosts:          ${communitySmarthomeForumPosts}`);
    console.log(`communitySmarthomeForumPostsLastMonth: ${communitySmarthomeForumPostsLastMonth}`);
    console.log(`communitySmarthomeForumPosts2MonthAgo: ${communitySmarthomeForumPosts2MonthAgo}`);

    forumCommunitySmarthomeUtils.updateCurrentMonthValue(communitySmarthomeForumPosts);

    templateData.forums = {
        ioBroker: {
            slug: ioBrokerForumData.userslug,
            posts: ioBrokerForumPosts,
            postsLastMonth: ioBrokerForumPosts2MonthAgo ? ioBrokerForumPostsLastMonth - ioBrokerForumPosts2MonthAgo : ioBrokerForumPostsLastMonth,
            postsThisMonth: ioBrokerForumPostsLastMonth ? ioBrokerForumPosts - ioBrokerForumPostsLastMonth : 0,
            topics: ioBrokerForumData.counts.topics,
        },
        communitySmarthome: {
            slug: forumUsernameCommunitySmarthome,
            posts: communitySmarthomeForumPosts,
            postsLastMonth: communitySmarthomeForumPosts2MonthAgo ? communitySmarthomeForumPostsLastMonth - communitySmarthomeForumPosts2MonthAgo : communitySmarthomeForumPostsLastMonth,
            postsThisMonth: communitySmarthomeForumPostsLastMonth ? communitySmarthomeForumPosts - communitySmarthomeForumPostsLastMonth : 0,
            topics: communitySmarthomeForumData.user_summary.topic_count,
        },
    };

    const betaRepos = await httpUtils.getData('https://download.iobroker.net/sources-dist-latest.json');

    for (const adapterSlug of adapters) {
        const adapterData = Object.prototype.hasOwnProperty.call(betaRepos, adapterSlug) ? betaRepos[adapterSlug] : null;

        templateData.adapters.push(
            await iobrokerUtils.collectAdapterInformation(adapterSlug, adapterData, gitHubUsername)
        );
    }

    for (const adapter of adaptersContrib) {
        const adapterData = Object.prototype.hasOwnProperty.call(betaRepos, adapter.adapterSlug) ? betaRepos[adapter.adapterSlug] : null;

        templateData.adaptersContrib.push(
            await iobrokerUtils.collectAdapterInformation(adapter.adapterSlug, adapterData, adapter.gitHubUsername)
        );
    }

    templateData.adapters.sort((a, b) => b.installations - a.installations);
    templateData.adaptersContrib.sort((a, b) => b.installations - a.installations);

    // Npm
    const npmPackages = [
        'axios',
        '@iobroker/adapter-core',
        '@iobroker/adapter-dev',
        '@iobroker/eslint-config',
        '@iobroker/testing',
    ];

    for (const npmPackage of npmPackages) {
        const npmData = await gitHubUtils.getLatestNpmInfo(npmPackage);

        if (npmData) {
            const latestVersion = npmData?.['dist-tags']?.latest;

            templateData.npmPackages.push({
                package: npmPackage,
                version: latestVersion,
                date: npmData?.time?.[latestVersion] ?? '-',
            });
        }
    }

    templateUtils.generateReadme(templateData);
    templateUtils.generateioBrokerAdapters(templateData);
}

if (process.argv.includes('--update-readme')) {
    console.log('Updating README.md');
    updateReadme().then(() => {
        console.log('done...');
    });
} else if (process.argv.includes('--init-forums')) {
    iobForumUtils.collectPosts(forumUsernameIoBroker);
    forumCommunitySmarthomeUtils.collectPosts(forumUsernameCommunitySmarthome);
} else if (process.argv.includes('--init-github')) {
    gitHubUtils.collectContributions(gitHubUsername);
}
