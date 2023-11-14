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

async function getData(url) {
    console.log(`downloading: ${url}`);
    const response = await axios.get(url, { responseType: 'json', timeout: 5000 });
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
            const ioPackageData = await getData(adapterData.meta);
            const packageData = await getData(adapterData.meta.replace('io-package.json', 'package.json'));

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

    console.log('done...');
})();