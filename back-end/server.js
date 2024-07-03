const express = require('express');
const bodyParser = require('body-parser');
const { exec } = require('child_process');
const os = require('os');

const app = express();
const port = 3000;

const userHomeDir = os.homedir();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Endpoint to handle input data
app.post('/sendData', (req, res) => {
    const inputData = req.body.data;

    exec(inputData, (error, stdout, stderr) => {
        if (error) {
            return res.status(500).send(`Error: ${stderr}`);
        }
        res.send(stdout);
    });
});

app.post('/handleStream', (req, res) => {
    const { id, action, preprocessing, postprocessing } = req.body;
    // TODO: Remove hardcoded path
    const command = `${userHomeDir}/project/video/start_stream.sh ${id} ${action} ${preprocessing} ${postprocessing}`;

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            return res.status(500).send(`Error: ${error.message}`);
        }
        if (stderr) {
            console.error(`stderr: ${stderr}`);
            return res.status(500).send(`Stderr: ${stderr}`);
        }
        console.log(`BE: ${stdout}`);
        res.send(`BE: ${stdout}`);
    });
});

app.get('/getTopOutput', (req, res) => {
    exec('sudo tegrastats | head -n 1', (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            return res.status(500).send(`Error: ${error.message}`);
        }
        if (stderr) {
            console.error(`stderr: ${stderr}`);
            return res.status(500).send(`Stderr: ${stderr}`);
        }

        const output = stdout.trim();

        // Parse the output
        const timestamp = output.match(/\d{2}-\d{2}-\d{4} \d{2}:\d{2}:\d{2}/)[0];
        const memoryUsage = output.match(/RAM .*?MB/)[0];
        const swapUsage = output.match(/SWAP .*?MB/)[0];
        const cpuUsage = output.match(/CPU \[.*?\]/)[0].replace(/CPU \[|\]/g, '').split(',').map((cpu, index) => `${index + 1} - ${cpu.trim().replace("%@", "% ")}MHz`).join('\n');

        emcFreqMatch = "N/A";
        try {
            emcFreqMatch = output.match(/EMC_FREQ \d+%@\d+/)[0].replace("%@", "% ")+"MHz";
        } catch (e) {
        }

        gr3dFreq = "N/A";
        try {
            gr3dFreq = output.match(/GR3D_FREQ \d+%@\[\d+/)[0].replace("%@[", "% ")+"MHz";
        } catch (e) {
        }

        videoEncoding = "N/A";
        try {
            videoEncoding = output.match(/NVENC .*? NVDEC off NVJPG off NVJPG1 off VIC .*? OFA off NVDLA0 off NVDLA1 off PVA0_FREQ off APE \d+/)[0]
                .replace("%@", "% ")
                .replace(/ NVDEC/g, '\nNVDEC')
                .replace(/ NVJPG/g, '\nNVJPG')
                .replace(/ NVJPG1/g, '\nNVJPG1')
                .replace(/ VIC/g, '\nVIC')
                .replace("%@", "% ")
                .replace(/ OFA/g, '\nOFA')
                .replace(/ NVDLA0/g, '\nNVDLA0')
                .replace(/ NVDLA1/g, '\nNVDLA1')
                .replace(/ PVA0_FREQ/g, '\nPVA0_FREQ')
                .replace(/ APE/g, '\nAPE') + "MHz";
        } catch (e) {
        }

        temperatures = "N/A";
        try {
            temperatures = output.match(/cpu@.*?C tboard@.*?C soc2@.*?C tdiode@.*?C soc0@.*?C tj@.*?C soc1@.*?C/)[0]
                .replace("@", " ")
                .replace("@", " ")
                .replace("@", " ")
                .replace("@", " ")
                .replace("@", " ")
                .replace("@", " ")
                .replace("@", " ")
                .replace("@", " ");
        } catch (e) {
        }

        const powerConsumption = output.match(/VDD_GPU_SOC .*? VDD_CPU_CV .*? VIN_SYS_5V0 .*? VDDQ_VDD2_1V8AO .*?mW.*?mW/)[0]
            .replace(/ VDD_CPU_CV/g, '\nVDD_CPU_CV')
            .replace(/ VIN_SYS_5V0/g, '\nVIN_SYS_5V0')
            .replace(/ VDDQ_VDD2_1V8AO/g, '\nVDDQ_VDD2_1V8AO');

        // Construct structured output
        const structuredOutput = `
${timestamp}
---EMC------------------
${emcFreqMatch}
${memoryUsage}
${swapUsage}
---CPU------------------
${cpuUsage}
---GPU------------------
${gr3dFreq}
---Engine---------------
${videoEncoding}
---Temperature----------
${temperatures}
---Power Monitor--------
${powerConsumption}
        `;

        res.send(structuredOutput.trim());
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});
