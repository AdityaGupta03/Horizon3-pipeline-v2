const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

// Helper function for running shell commands
function runCommand(command, options = {}) {
    return new Promise((resolve, reject) => {
        const process = exec(command, options, (error, stdout, stderr) => {
            if (error) {
                reject({ error, stderr });
                return;
            }
            resolve(stdout);
        });
        process.stdout.pipe(process.stdout);
        process.stderr.pipe(process.stderr);
    });
}

// Function to clone a GitHub repository
async function cloneRepository(repoUrl, destDir) {
    try {
        await runCommand(`git clone ${repoUrl} ${destDir}`);
        console.log("Repository cloned successfully!");
    } catch (error) {
        console.error("Error cloning repository:", error.stderr);
    }
}

// Function to detect and build a C project
async function detectAndBuildCProject(projectDir) {
    const makefilePath = path.join(projectDir, "Makefile");
    const cmakeFilePath = path.join(projectDir, 'CMakeLists.txt');
    const configureFilePath = path.join(projectDir, 'configure');

    try {
        if (fs.existsSync(makefilePath)) {
            console.log("Makefile found! Building...");
            await runCommand(`make`, { cwd: projectDir });
        } else if (fs.existsSync(cmakeFilePath)) {
            console.log("CMakeLists.txt found! Building...");
            await runCommand(`mkdir -p build && cd build && cmake .. && make`, { cwd: projectDir });
        } else if (fs.existsSync(configureFilePath)) {
            console.log("configure script found! Building...");
            await runCommand(`./configure && make`, { cwd: projectDir });
        } else {
            console.error("No Makefile, CMakeLists.txtx, or configure script found!");
        }
    } catch (error) {
        console.error("Error building project:", error.stderr);
    }
}

// Function to search for binary files in common directories
async function findBinaryFiles(projectDir) {
    const searchPaths = [
        path.join(projectDir, "bin"),
        path.join(projectDir, "build"),
        projectDir
    ];
    const binaryExtensions = [".exe", ".dll", ".out", ".bin"];
    const binaries = [];

    //Helper function to check if a file is a binary (executable) without an extension
    function isExecutable(filePath) {
        const stats = fs.statSync(filePath);
        return stats.isFile() && (stats.mode & fs.constants.S_IXUSR)
    }

    // Search for binary files
    for (const dir of searchPaths) {
        if (fs.existsSync(dir)) {
            const files = fs.readdirSync(dir);
            for (const file of files) {
                const filePath = path.join(dir, file);
                const ext = path.extname(file);
                if (binaryExtensions.includes(ext) && isExecutable(filePath)) {
                    binaries.push(filePath);
                }
            }
        }
    }
    return binaries;
}

// Main function
async function cloneBuildAndFindBinary(reopUrl) {
    const projectDir = './cloned_project';
    console.log(`Cloning repository: ${reopUrl}`);
    await cloneRepository(repoUrl, projectDir);
    console.log(`Building project...`);
    await detectAndBuildCProject(projectDir);
    console.log(`Searching for binary files...`);
    const binaries = await findBinaryFiles(projectDir);
    if (binaries.length > 0) {
        console.log("Binaries found:");
        binaries.forEach((binary) => console.log(binary));
    } else {
        console.log("No binary files found.");
    }
    console.log("Process finished!");
}

const repoUrl = 'https://github.com/pantuza/c-project-template.git';

cloneBuildAndFindBinary(repoUrl);