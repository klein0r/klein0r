'use strict';

const fs = require('node:fs');
const path = require('node:path');
const Mustache = require('mustache');

const templateDir = path.join(__dirname, '../templates/');
const targetDir = path.join(__dirname, '..');

function generateReadme(templateData) {
    const MUSTACHE_TEMPLATE = path.join(templateDir, 'README.mustache');

    try {
        const template = fs.readFileSync(MUSTACHE_TEMPLATE);
        const output = Mustache.render(template.toString(), templateData);
        fs.writeFileSync(path.join(targetDir, 'README.md'), output);

        console.log('generated README...');
    } catch (err) {
        console.error(`Unable to render mustache file "${MUSTACHE_TEMPLATE}": ${err}`);
    }
}

function generateioBrokerAdapters(templateData) {
    const MUSTACHE_TEMPLATE = path.join(templateDir, 'iobroker-adapters.mustache');

    try {
        const template = fs.readFileSync(MUSTACHE_TEMPLATE);
        const output = Mustache.render(template.toString(), templateData);
        fs.writeFileSync(path.join(targetDir, 'iobroker-adapters.md'), output);

        console.log('generated iobroker-adapters...');
    } catch (err) {
        console.error(`Unable to render mustache file "${MUSTACHE_TEMPLATE}": ${err}`);
    }
}
module.exports = {
    generateReadme,
    generateioBrokerAdapters,
};
