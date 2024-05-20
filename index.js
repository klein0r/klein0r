'use strict';

const httpUtils = require('./utils/http');
const iobForumUtils = require('./utils/iob-forum');
const gitHubUtils = require('./utils/github');
const templateUtils = require('./utils/template');

const iobForumUsername = 'haus-automatisierung';
const gitHubUsername = 'klein0r';

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

function extractRepoUrl(readmeUrl) {
    // "https://github.com/iobroker-community-adapters/ioBroker.accuweather/blob/master/README.md"
    let times = 0, index = null;

    while (times < 5 && index !== -1) {
        index = readmeUrl.indexOf('/', index + 1);
        times++;
    }

    return readmeUrl.substring(0, index);
}

function getFirstLineVersion(data) {
    const lines = data.split('\n');
    if (lines.length > 0) {
        const firstLine = lines[0];
        if (firstLine.startsWith('#')) {
            return firstLine.replace('#', '').trim();
        }
    }
    
    return '???';
}

async function getNewsestStats(name) {
    const stats = await httpUtils.getData(`https://www.iobroker.dev/api/adapter/${name}/stats`);
    const statDates = Object.keys(stats.counts).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    return stats.counts[statDates[0]]?.versions ?? {};
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
    const ioBrokerForumPosts2MonthAgo = iobForumUtils.getPreviousMonthValue(2);

    iobForumUtils.updateCurrentMonthValue(ioBrokerForumPosts);

    console.log(`ioBrokerForumPosts:          ${ioBrokerForumPosts}`);
    console.log(`ioBrokerForumPostsLastMonth: ${ioBrokerForumPostsLastMonth}`);
    console.log(`ioBrokerForumPosts2MonthAgo: ${ioBrokerForumPosts2MonthAgo}`);

    templateData.forums = {
        ioBroker: {
            slug: ioBrokerForumData.userslug,
            posts: ioBrokerForumPosts,
            postsLastMonth: ioBrokerForumPosts2MonthAgo ? ioBrokerForumPostsLastMonth - ioBrokerForumPosts2MonthAgo : 0,
            postsThisMonth: ioBrokerForumPostsLastMonth ? ioBrokerForumPosts - ioBrokerForumPostsLastMonth : 0,
            topics: ioBrokerForumData.counts.topics,
        }
    }

    const betaRepos = await httpUtils.getData('http://download.iobroker.net/sources-dist-latest.json');

    for (const adapter of adapters) {
        if (betaRepos[adapter]) {
            const adapterData = betaRepos[adapter];
            const ioPackageData = await httpUtils.getData(adapterData.meta);
            const packageData = await httpUtils.getData(adapterData.meta.replace('io-package.json', 'package.json'));
            const issueTemplate = await httpUtils.getText(adapterData.meta.replace('io-package.json', '.github/ISSUE_TEMPLATE/bug_report.yml'));
            const issueWorkflow = await httpUtils.getText(adapterData.meta.replace('io-package.json', '.github/workflows/new-issue.yml'));
            const fundingFile = await httpUtils.getText(adapterData.meta.replace('io-package.json', '.github/FUNDING.yml'));
            const newestStats = await getNewsestStats(ioPackageData?.common?.name);

            console.log(`    found stats of ${ioPackageData?.common?.name}: ${JSON.stringify(newestStats)}`);

            templateData.adapters.push({
                title: adapterData?.titleLang?.en ?? adapterData.title,
                icon: adapterData.extIcon,
                url: extractRepoUrl(adapterData.readme),
                installations: adapterData.stat,
                weekDownloads: adapterData.weekDownloads,
                version: {
                    beta: adapterData.version,
                    betaAge: Math.ceil(Math.abs(Date.now() - new Date(adapterData.versionDate).getTime()) / (1000 * 60 * 60 * 24)),
                    betaInstallations: newestStats?.[adapterData.version] ? newestStats?.[adapterData.version] : '-',
                    stable: adapterData.stable ?? '-',
                    stableInstallations: adapterData?.stable && newestStats?.[adapterData.stable] ? newestStats?.[adapterData.stable] : '-',
                    node: packageData?.engines?.node ?? adapterData.node,
                },
                issues: adapterData.issues,
                ioPackage: {
                    license: ioPackageData?.common?.licenseInformation?.license ?? ioPackageData.license,
                },
                package: {
                    dependencies: Object.keys(packageData.dependencies).map(dep => `${dep}: ${packageData.dependencies[dep]}`).join('<br/>'),
                    keywords: packageData.keywords.map(k => `- ${k}`).join('<br/>'),
                },
                files: {
                    issueTemplateVersion: getFirstLineVersion(issueTemplate),
                    issueWorkflowVersion: getFirstLineVersion(issueWorkflow),
                    hasFunding: fundingFile && fundingFile.includes('patreon') && fundingFile.includes('/kurse/') ? 'yes' : 'no'
                }
            });
        }
    }

    for (const adapter of adaptersContrib) {
        if (betaRepos[adapter]) {
            const adapterData = betaRepos[adapter];
            const ioPackageData = await httpUtils.getData(adapterData.meta);
            const packageData = await httpUtils.getData(adapterData.meta.replace('io-package.json', 'package.json'));
            const newestStats = await getNewsestStats(ioPackageData?.common?.name);

            console.log(`    found stats of ${ioPackageData?.common?.name}: ${JSON.stringify(newestStats)}`);

            templateData.adaptersContrib.push({
                title: adapterData?.titleLang?.en ?? adapterData.title,
                icon: adapterData.extIcon,
                url: extractRepoUrl(adapterData.readme),
                installations: adapterData.stat,
                weekDownloads: adapterData.weekDownloads,
                version: {
                    beta: adapterData.version,
                    betaAge: Math.ceil(Math.abs(Date.now() - new Date(adapterData.versionDate).getTime()) / (1000 * 60 * 60 * 24)),
                    betaInstallations: newestStats?.[adapterData.version] ? newestStats?.[adapterData.version] : '-',
                    stable: adapterData.stable ?? '-',
                    stableInstallations: adapterData?.stable && newestStats?.[adapterData.stable] ? newestStats?.[adapterData.stable] : '-',
                    node: packageData?.engines?.node ?? adapterData.node,
                },
                issues: adapterData.issues,
                ioPackage: {
                    license: ioPackageData?.common?.licenseInformation?.license ?? ioPackageData.license,
                },
            });
        }
    }

    templateData.adapters.sort((a, b) => b.installations - a.installations);
    templateData.adaptersContrib.sort((a, b) => b.installations - a.installations);

    templateUtils.generateReadme(templateData);
    templateUtils.generateioBrokerAdapters(templateData);
}

if (process.argv.includes('--update-readme')) {
    console.log('Updating README.md');
    updateReadme().then(() => {
        console.log('done...');
    });
} else if (process.argv.includes('--init-forum')) {
    iobForumUtils.collectPosts(iobForumUsername);
} else if (process.argv.includes('--init-github')) {
    gitHubUtils.collectContributions(gitHubUsername);
}
