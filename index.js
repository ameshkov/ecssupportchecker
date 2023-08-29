const fs = require('fs');
const { execSync } = require('child_process');

const subnets = [
    '98.246.112.0/24', // Comcast
    '42.99.18.0/24',   // China Telecom
    '139.47.240.0/24', // Vodafone
    '47.29.100.0/24', // JIO
];

/**
 * Executes the dig command for a given domain and subnet.
 *
 * @param {string} domainName - The domain name to query.
 * @param {string} subnet - The subnet to use for the query.
 * @returns {Object} - An object containing IPs and ECS support indicator.
 */
async function digForDomain(domainName, subnet) {
    const command = `dig -t a ${domainName}. @8.8.8.8 +subnet=${subnet}`;
    const output = execSync(command).toString();

    const ipAddresses = [];
    let ecs = false;

    const lines = output.split('\n');
    for (const line of lines) {
        if (line.includes('IN\tA')) {
            const match = line.match(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/);
            if (match) ipAddresses.push(match[0]);
        }
        if (line.includes('CLIENT-SUBNET') && !line.trim().endsWith('/0')) {
            ecs = true;
        }
    }

    return {
        ip: ipAddresses.sort(),
        ecs,
        lines
    };
}

/**
 * Main function to read domain names, run the dig command, and print results.
 */
async function main() {
    const inputPath = process.argv[2];
    const outputPath = process.argv[3];

    if (!inputPath) {
        console.error('Please provide an input path as the first argument.');
        process.exit(1);
    }

    if (!outputPath) {
        console.error('Please provide an output path as the first argument.');
        process.exit(1);
    }

    const rawDomainNames = fs.readFileSync(inputPath, 'utf-8').trim().split('\n');
    const domainNames = rawDomainNames.map(domain => domain.endsWith('.') ? domain.slice(0, -1) : domain);

    let output = 'Domain;ECS support;Same across different subnets\n';
    let supportECS = 0;
    let sameAcrossSubnets = 0;

    for (const domainName of domainNames) {
        let previousResult = null;
        let isSameAcrossSubnets = true;

        for (const subnet of subnets) {
            const result = await digForDomain(domainName, subnet);

            if (result.ecs) {
                if (previousResult) {
                    if (JSON.stringify(previousResult.ip) !== JSON.stringify(result.ip)) {
                        isSameAcrossSubnets = false;
                        break;
                    }
                } else {
                    previousResult = result;
                }
            } else {
                previousResult = result;
            }
        }

        if (previousResult.ecs) {
            supportECS++;
            if (isSameAcrossSubnets) {
                sameAcrossSubnets++;
            }
        }

        output += `${domainName};${previousResult.ecs};${isSameAcrossSubnets}\n`;
    }

    fs.writeFileSync(outputPath, output);

    console.log(`Output has been written to ${outputPath}.`);

    console.log(`Overall domains analyzed: ${domainNames.length}`);
    console.log(`Domains that support ECS: ${supportECS}`);
    console.log(`Domains that support ECS, but results are the same across subnets: ${sameAcrossSubnets}`);
}

main();
