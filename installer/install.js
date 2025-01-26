const { execSync } = require('child_process');
const fs = require('fs/promises');
const { createWriteStream } = require('fs');
const path = require('path');
const https = require('https');
const { get } = require('http');
const readline = require('readline');

const colors = {
    reset: "\x1b[0m",
    fgGreen: "\x1b[32m",
    fgRed: "\x1b[31m",
    fgYellow: "\x1b[33m",
    fgCyan: "\x1b[36m",
    fgBlue: "\x1b[34m",
    fgWhite: "\x1b[37m",
    bgBlue: "\x1b[44m"
};

function logStep(message) {
    console.log(`${colors.fgCyan}➤ ${colors.reset}${message}`);
}

function logSuccess(message) {
    console.log(`${colors.fgGreen}✓ ${colors.reset}${message}`);
}

function logError(message) {
    console.log(`${colors.fgRed}✗ ${colors.reset}${message}`);
}

function logHeader(message) {
    console.log(`\n${colors.bgBlue}${colors.fgWhite} ${message} ${colors.reset}\n`);
}

async function checkAdmin() {
    try {
        const result = execSync(
            `powershell -Command "(New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)"`,
            { encoding: 'utf-8' }
        );
        return result.trim() === 'True';
    } catch {
        return false;
    }
}

async function downloadFile(fileUrl, outputPath) {
    return new Promise((resolve, reject) => {
        const fileStream = createWriteStream(outputPath);
        const client = fileUrl.startsWith('https') ? https : get;

        client.get(fileUrl, {
            headers: {
                'User-Agent': 'KanyeLang/Installer'
            }
        }, (response) => {
            if ([301, 302].includes(response.statusCode)) {
                return downloadFile(response.headers.location, outputPath)
                    .then(resolve)
                    .catch(reject);
            }

            if (response.statusCode !== 200) {
                return reject(new Error(`HTTP error: ${response.statusCode}`));
            }

            const totalSize = parseInt(response.headers['content-length'], 10);
            let downloaded = 0;
            
            response.on('data', (chunk) => {
                downloaded += chunk.length;
                const progress = (downloaded / totalSize * 100).toFixed(1);
                process.stdout.write(`\r${colors.fgCyan}Downloading: ${progress}%${colors.reset}`);
            });

            response.pipe(fileStream);

            fileStream.on('finish', () => {
                fileStream.close();
                console.log('\n');
                resolve();
            });

        }).on('error', async (error) => {
            await fs.unlink(outputPath).catch(() => {});
            reject(new Error(`Download failed: ${error.message}`));
        });
    });
}

async function addToPath(installPath) {
    try {
        const currentPath = execSync(
            'reg query "HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Environment" /v Path',
            { encoding: 'utf-8', stdio: 'pipe' }
        );

        if (!currentPath.includes(installPath)) {
            execSync(
                `reg add "HKLM\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Environment" /v Path /t REG_EXPAND_SZ /d "%PATH%;${installPath}" /f`,
                { stdio: 'ignore' }
            );
        }
    } catch (error) {
        throw new Error(`Failed to update PATH: ${error.message}`);
    }
}

async function waitForEnter() {
    return new Promise((resolve) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        rl.question('\nPress Enter to exit...', () => {
            rl.close();
            resolve();
        });
    });
}

async function main() {
    try {
        const config = {
            url: 'https://github.com/pip64/kanyelang/raw/refs/heads/main/dist/kanyelang.exe',
            installDir: path.join('C:', 'Program Files', 'KanyeLang'),
            binName: 'kanye.exe'
        };

        logHeader('=== KanyeLang Installation ===');

        logStep('Checking administrator privileges...');
        if (!await checkAdmin()) {
            logError('Please restart as Administrator!');
            await waitForEnter();
            process.exit(1);
        }
        logSuccess('Administrator privileges confirmed');

        logStep('Creating installation directory...');
        await fs.mkdir(config.installDir, { recursive: true });
        logSuccess(`Directory created: ${config.installDir}`);

        logStep('Downloading KanyeLang...');
        const binPath = path.join(config.installDir, config.binName);
        await downloadFile(config.url, binPath);
        logSuccess('Download completed');

        logStep('Verifying installation...');
        const stats = await fs.stat(binPath);
        if (stats.size === 0) throw new Error('Empty file downloaded');
        logSuccess(`File verified (${(stats.size / 1024 / 1024).toFixed(1)} MB)`);

        logStep('Updating system PATH...');
        await addToPath(config.installDir);
        logSuccess('System PATH updated');

        logHeader('=== Installation Successful ===');
        console.log(`${colors.fgGreen}KanyeLang installed successfully!${colors.reset}`);
        console.log(`Location: ${binPath}`);
        console.log('You can now use "kanye" command from anywhere');

        await waitForEnter();
    } catch (error) {
        logHeader('=== Installation Failed ===');
        logError(error.message);
        await waitForEnter();
        process.exit(1);
    }
}

main();