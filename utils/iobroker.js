'use strict';

const httpUtils = require('./http');
const gitHubUtils = require('./github');

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
    if (!data) {
        return 'n/a';
    }

    const lines = data.split('\n');
    if (lines.length > 0) {
        const firstLine = lines[0];
        if (firstLine.startsWith('#')) {
            return firstLine.replace('#', '').trim();
        }
    }
    
    return '???';
}

async function getAdapterStats(name) {
    try {
        const stats = await httpUtils.getData(`https://www.iobroker.dev/api/adapter/${name}/stats/now`);

        return stats?.versions ?? {};
    } catch {
        return {};
    }
}

function daysSince(date) {
    return Math.ceil(Math.abs(Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
}

async function collectAdapterInformation(adapterSlug, adapterData, gitHubUsername = null) {
    let ioPackageUrl = adapterData?.meta;

    if (!ioPackageUrl && gitHubUsername) {
        const repositoryInformation = await gitHubUtils.getRepository(gitHubUsername, `ioBroker.${adapterSlug}`);
        ioPackageUrl = `https://raw.githubusercontent.com/${gitHubUsername}/ioBroker.${adapterSlug}/${repositoryInformation.default_branch}/io-package.json`;
    }

    const ioPackageData = await httpUtils.getData(ioPackageUrl);
    const npmData = await gitHubUtils.getLatestNpmInfo(`iobroker.${adapterSlug}`);

    const packageData = await httpUtils.getData(ioPackageUrl.replace('io-package.json', 'package.json'));
    const issueTemplate = await httpUtils.getText(ioPackageUrl.replace('io-package.json', '.github/ISSUE_TEMPLATE/bug_report.yml'));
    const issueWorkflow = await httpUtils.getText(ioPackageUrl.replace('io-package.json', '.github/workflows/new-issue.yml'));
    const issueLockWorkflow = await httpUtils.getText(ioPackageUrl.replace('io-package.json', '.github/workflows/lock-old-issues.yml'));
    const fundingFile = await httpUtils.getText(ioPackageUrl.replace('io-package.json', '.github/FUNDING.yml'));
    const newestStats = await getAdapterStats(ioPackageData?.common?.name);
    const betaVersion = ioPackageData?.common?.version;

    return {
        title: ioPackageData?.common?.titleLang?.en ?? ioPackageData?.common?.title,
        icon: ioPackageData?.common.extIcon,
        url: extractRepoUrl(ioPackageData?.common?.readme),
        installations: adapterData?.stat ?? '-',
        version: {
            beta: betaVersion,
            betaAge: npmData?.time?.[betaVersion] ? daysSince(npmData?.time?.[betaVersion]) : '??',
            betaInstallations: newestStats?.[betaVersion] ?? '-',
            stable: adapterData?.stable ?? '-',
            stableInstallations: adapterData?.stable && newestStats?.[adapterData.stable] ? newestStats?.[adapterData.stable] : '-',
            node: packageData?.engines?.node ?? '-',
        },
        issues: adapterData?.issues ?? '-',
        ioPackage: {
            license: ioPackageData?.common?.licenseInformation?.license ?? ioPackageData.license,
            dependencies: ioPackageData?.common?.dependencies.map(d => Object.keys(d).map(dep => `*iob* ${dep}: ${d[dep]}`).join('<br/>')).join('<br/>'),
            globalDependencies: ioPackageData?.common?.globalDependencies.map(d => Object.keys(d).map(dep => `*global* ${dep}: ${d[dep]}`).join('<br/>')).join('<br/>'),
        },
        package: {
            dependencies: Object.keys(packageData.dependencies).map(dep => `${dep}: ${packageData.dependencies[dep]}`).join('<br/>'),
            devDependencies: Object.keys(packageData.devDependencies).filter(dep => dep.startsWith('@iobroker/')).map(dep => `*dev* ${dep}: ${packageData.devDependencies[dep]}`).join('<br/>'),
            keywords: packageData.keywords.map(k => `- ${k}`).join('<br/>'),
        },
        files: {
            issueTemplateVersion: getFirstLineVersion(issueTemplate),
            issueWorkflowVersion: getFirstLineVersion(issueWorkflow),
            issueLockWorkflowVersion: getFirstLineVersion(issueLockWorkflow),
            hasFunding: fundingFile && fundingFile.includes('patreon') && fundingFile.includes('/kurse/') ? 'yes' : 'no'
        }
    };
}

module.exports = {
    collectAdapterInformation,
};
