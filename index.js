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
    'shelly',
    'pvforecast',
    'statistics',
    'proxmox'
];

function generateReadme(templateData) {
    const MUSTACHE_TEMPLATE = './README.mustache';

    try {
        const template = fs.readFileSync(MUSTACHE_TEMPLATE);
        const output = Mustache.render(template.toString(), data);
        fs.writeFileSync('README.md', output);
    } catch (err) {
        console.error(`Unable to render mustache file "${MUSTACHE_TEMPLATE}": ${err}`);
    }
}

(async () => {
    let templateData = {
        generatedAt: new Date().toISOString()
    };

    const lastRepoResponse = await axios.get('http://download.iobroker.net/sources-dist-latest.json', { responseType: 'json', timeout: 5000 });
    if (lastRepoResponse.status === 200) {


        generateReadme(templateData);
    }
})();