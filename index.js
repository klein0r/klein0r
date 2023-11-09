'use strict';

const fs = require('node:fs');
const axios = require('axios').default;
const Mustache = require('mustache');

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
    'pvforecast',
    'statistics',
    'proxmox',
]

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

async function getData(url) {
    const response = await axios.get('http://download.iobroker.net/sources-dist-latest.json', { responseType: 'json', timeout: 5000 });
    if (response.status === 200) {
        return response.data;
    }

    return null;
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

(async () => {
    console.log('started...');

    let templateData = {
        generatedAt: new Date().toISOString(),
        adapters: [],
        adaptersContrib: [],
    };

    const betaRepos = await getData('http://download.iobroker.net/sources-dist-latest.json');

    for (const adapter of adapters) {
        if (betaRepos[adapter]) {
            const adapterData = betaRepos[adapter];

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
                },
                issues: adapterData.issues,
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
                },
                issues: adapterData.issues,
            });
        }
    }
    
    templateData.adapters.sort((a, b) => b.installations - a.installations);
    templateData.adaptersContrib.sort((a, b) => b.installations - a.installations);

    generateReadme(templateData);

    console.log('done...');
})();