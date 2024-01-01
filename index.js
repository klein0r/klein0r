'use strict';

const fs = require('node:fs');
const Mustache = require('mustache');
const httpUtils = require('./utils/http');
const iobForumUtils = require('./utils/iob-forum');

const iobForumUsername = 'haus-automatisierung';

const adapters = [
    'trashschedule',
    'birthdays',
    'luftdaten',
    'octoprint',
    'youtube',
    'lametric',
    'gira-iot',
    'awtrix-light',
    'comfoairq',
];

const adaptersContrib = [
    'shelly',
    'javascript',
    'node-red',
    'pvforecast',
    'statistics',
];

function generateReadme(templateData) {
    const MUSTACHE_TEMPLATE = './README.mustache';

    try {
        const template = fs.readFileSync(MUSTACHE_TEMPLATE);
        const output = Mustache.render(template.toString(), templateData);
        fs.writeFileSync('README.md', output);

        console.log('generated README...');
    } catch (err) {
        console.error(`Unable to render mustache file "${MUSTACHE_TEMPLATE}": ${err}`);
    }
}

function generateioBrokerAdapters(templateData) {
    const MUSTACHE_TEMPLATE = './iobroker-adapters.mustache';

    try {
        const template = fs.readFileSync(MUSTACHE_TEMPLATE);
        const output = Mustache.render(template.toString(), templateData);
        fs.writeFileSync('iobroker-adapters.md', output);

        console.log('generated iobroker-adapters...');
    } catch (err) {
        console.error(`Unable to render mustache file "${MUSTACHE_TEMPLATE}": ${err}`);
    }
}

function extractRepoUrl(readmeUrl) {
    // "https://github.com/iobroker-community-adapters/ioBroker.accuweather/blob/master/README.md"
    let times = 0, index = null;

    while (times < 5 && index !== -1) {
        index = readmeUrl.indexOf('/', index + 1);
        times++;
    }

    return readmeUrl.substring(0, index);
}

async function updateReadme() {
    console.log('started...');

    const templateData = {
        generatedAt: new Date().toISOString(),
        adapters: [],
        adaptersContrib: [],
    };

    const ioBrokerForumData = await iobForumUtils.getUserData(iobForumUsername);
    const ioBrokerForumPosts = ioBrokerForumData.counts.posts;
    const ioBrokerForumPostsLastMonth = iobForumUtils.getPreviousMonthValue(1);

    iobForumUtils.updateCurrentMonthValue(ioBrokerForumPosts);

    templateData.forums = {
        ioBroker: {
            slug: ioBrokerForumData.userslug,
            posts: ioBrokerForumPosts,
            postsLastMonth: ioBrokerForumPostsLastMonth,
            postsThisMonth: ioBrokerForumPosts - ioBrokerForumPostsLastMonth,
            topics: ioBrokerForumData.counts.topics,
        }
    }

    const betaRepos = await httpUtils.getData('http://download.iobroker.net/sources-dist-latest.json');

    for (const adapter of adapters) {
        if (betaRepos[adapter]) {
            const adapterData = betaRepos[adapter];
            const ioPackageData = await httpUtils.getData(adapterData.meta);
            const packageData = await httpUtils.getData(adapterData.meta.replace('io-package.json', 'package.json'));

            templateData.adapters.push({
                title: adapterData?.titleLang?.en ?? adapterData.title,
                icon: adapterData.extIcon,
                url: extractRepoUrl(adapterData.readme),
                installations: adapterData.stat,
                weekDownloads: adapterData.weekDownloads,
                version: {
                    beta: adapterData.version,
                    betaAge: Math.ceil(Math.abs(Date.now() - new Date(adapterData.versionDate).getTime()) / (1000 * 60 * 60 * 24)),
                    stable: adapterData.stable ?? '-',
                    node: adapterData.node,
                },
                issues: adapterData.issues,
                ioPackage: {
                    license: ioPackageData.license,
                },
                package: {
                    dependencies: Object.keys(packageData.dependencies).map(dep => `${dep}: ${packageData.dependencies[dep]}`).join('<br/>'),
                    keywords: packageData.keywords.join('<br/>'),
                }
            });
        }
    }

    for (const adapter of adaptersContrib) {
        if (betaRepos[adapter]) {
            const adapterData = betaRepos[adapter];

            templateData.adaptersContrib.push({
                title: adapterData?.titleLang?.en ?? adapterData.title,
                icon: adapterData.extIcon,
                url: extractRepoUrl(adapterData.readme),
                installations: adapterData.stat,
                weekDownloads: adapterData.weekDownloads,
                version: {
                    beta: adapterData.version,
                    betaAge: Math.ceil(Math.abs(Date.now() - new Date(adapterData.versionDate).getTime()) / (1000 * 60 * 60 * 24)),
                    stable: adapterData.stable ?? '-',
                    node: adapterData.node,
                },
                issues: adapterData.issues,
            });
        }
    }

    templateData.adapters.sort((a, b) => b.installations - a.installations);
    templateData.adaptersContrib.sort((a, b) => b.installations - a.installations);

    generateReadme(templateData);
    generateioBrokerAdapters(templateData);
}

if (process.argv.includes('--update-readme')) {
    console.log('Updating README.md');
    updateReadme().then(() => {
        console.log('done...');
    });
} else if (process.argv.includes('--init-forum')) {
    iobForumUtils.collectForumPosts(iobForumUsername);
}
