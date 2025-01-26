const os = require('os');
const https = require('https');
const fs = require('fs');
const path = require('path');
const config = require('./config');

const flags = {
    showTokens: false,
    showAST: false,
    strictMode: false,
    evalCode: null
};

async function updateKanyeLang() {
    const updateUrl = 'https://github.com/pip64/kanyelang/raw/refs/heads/main/dist/kanyelang.exe';
    const installDir = path.join('C:', 'Program Files', 'KanyeLang');
    const installPath = path.join(installDir, 'kanye.exe');
    
    console.log('Updating KanyeLang...\n');
    
    try {
        // Проверка прав администратора
        if (!await checkAdmin()) {
            throw new Error('Please run as administrator to update');
        }

        // Создание директории если её нет
        if (!fs.existsSync(installDir)) {
            fs.mkdirSync(installDir, { recursive: true });
        }

        // Скачивание с индикатором прогресса
        await downloadFileWithProgress(updateUrl, installPath);
        
        // Проверка размера файла
        const stats = fs.statSync(installPath);
        if (stats.size === 0) {
            throw new Error('Downloaded file is empty');
        }
        
        console.log('\n✓ Update completed successfully');
        console.log(`New version installed at: ${installPath}`);
    } catch (error) {
        console.error('\n✗ Update failed:', error.message);
        process.exit(1);
    }
}

async function checkAdmin() {
    try {
        const result = require('child_process').execSync(
            `powershell -Command "(New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)"`,
            { encoding: 'utf-8' }
        );
        return result.trim() === 'True';
    } catch {
        return false;
    }
}

function downloadFileWithProgress(url, outputPath) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(outputPath);
        let receivedBytes = 0;
        let totalBytes = 0;
        let lastProgress = -1;

        file.on('error', error => {
            fs.unlinkSync(outputPath); // Удаляем файл в случае ошибки
            reject(new Error(`File write error: ${error.message}`));
        });

        https.get(url, response => {
            if (response.statusCode === 302 || response.statusCode === 301) {
                return downloadFileWithProgress(response.headers.location, outputPath)
                    .then(resolve)
                    .catch(reject);
            }

            if (response.statusCode !== 200) {
                return reject(new Error(`HTTP error: ${response.statusCode}`));
            }

            totalBytes = parseInt(response.headers['content-length'], 10);
            
            response.on('data', chunk => {
                receivedBytes += chunk.length;
                const progress = Math.round((receivedBytes / totalBytes) * 100);
                
                if (progress !== lastProgress) {
                    lastProgress = progress;
                    updateProgressBar(progress);
                }
            });

            response.pipe(file);

            file.on('finish', () => {
                file.close(resolve);
            });

        }).on('error', error => {
            fs.unlinkSync(outputPath); // Удаляем файл в случае ошибки
            reject(new Error(`Download failed: ${error.message}`));
        });
    });
}

function updateProgressBar(percentage) {
    const barLength = 20;
    const filled = Math.round(barLength * (percentage / 100));
    const empty = barLength - filled;
    
    const progressBar = `[${'='.repeat(filled)}${' '.repeat(empty)}]`;
    process.stdout.write(`\r${progressBar} ${percentage.toFixed(1)}%`);
}

const argHandlers = {
    '--info': () => {
        console.log(`${config.name} Runtime Information:
- Version:      ${config.version}
- Node.js:      ${process.version}
- Platform:     ${os.platform()} ${os.arch()}`);
        process.exit(0);
    },

    '--version': () => {
        console.log(`v${config.version}`);
        process.exit(0);
    },

    '--help': () => {
        console.log(`Usage: kanye [options] [file.kl]
    
Options:
  --info       Show runtime information
  --version    Display version
  --tokens     Show lexer tokens
  --ast        Show parsed AST
  --strict     Enable strict mode
  --eval <code> Run code directly
  --update     Update KanyeLang to latest version
  --help       Show this help`);
        process.exit(0);
    },

    '--tokens': () => flags.showTokens = true,
    '--ast': () => flags.showAST = true,
    '--strict': () => flags.strictMode = true,
    '--eval': (code) => flags.evalCode = code,
    '--update': async () => {
        await updateKanyeLang();
        process.exit(0);
    }
};

function parseArgs(args) {
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg in argHandlers) {
            if (arg === '--eval') {
                if (i + 1 >= args.length) throw new Error('Missing code for --eval');
                const code = args[++i]
                    .replace(/\\"/g, '"')
                    .replace(/^'(.*)'$/, '$1');
                argHandlers[arg](code);
            } else {
                argHandlers[arg]();
            }
        }
    }
}

module.exports = {
    flags,
    parseArgs
};