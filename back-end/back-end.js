const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const net = require('net');

const app = express();
const port = 4000;

function connectToTcpServer(message, id, logCallback) {
    const client = new net.Socket();
    client.connect(`1234${id}`, '127.0.1.1', () => {
        client.write(message);
    });

    client.on('data', (data) => {
        logCallback(data);
        client.destroy(); // kill client after server's response
    });

    client.on('error', (err) => {
        logCallback(`TCP Client Error: ${err.message}`);
    });
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const currentDir = path.dirname(__filename);
app.post('/executeCommand', (req, res) => {
    const { command } = req.body;

    exec(command, (error, stdout, stderr) => {
        if (error) {
            return res.status(500).send(`Error: ${stderr}`);
        }
        res.send(stdout);
    });
});

app.post('/handleStream', (req, res) => {
    const { action, type, id, preprocessing, atr, overlay } = req.body;
    const command = `${currentDir}/../../../video/video-stream ${action} ${type} ${id} ${preprocessing} ${atr} ${overlay}`;

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error: ${error.message}`);
            return res.status(500).send(`Error: ${error.message}`);
        }
        if (stderr) {
            console.error(`Stderr: ${stderr}`);
            return res.status(500).send(`Stderr: ${stderr}`);
        }
        console.log(`BE: ${stdout}`);
        res.send(`BE: ${stdout}`);
    });
});

app.post('/handleStreamElement', (req, res) => {
    const { command, type, id } = req.body;

    console.log(`BE: ${type}${id} ${command}`);

    connectToTcpServer(command, id, (message) => {
        console.log(`BE: received ${message}`);
        res.send(`BE: ${message}`);
    });
});

app.get('/getTopOutput', (req, res) => {
    exec('sudo tegrastats | head -n 1', (error, stdout, stderr) => {
        if (error) {
            return res.status(500).send(`Error: ${error.message}`);
        }
        if (stderr) {
            return res.status(500).send(`Stderr: ${stderr}`);
        }

        const output = stdout.trim();
        // Parse the output
        const timestamp = output.match(/\d{2}-\d{2}-\d{4} \d{2}:\d{2}:\d{2}/)[0];
        const memoryUsage = output.match(/RAM .*?MB/)[0];
        const swapUsage = output.match(/SWAP .*?MB/)[0];
        const cpuUsage = output.match(/CPU \[.*?\]/)[0].replace(/CPU \[|\]/g, '').split(',').map((cpu, index) => `${index + 1} - ${cpu.trim().replace("%@", "% ")}MHz`).join('\n');

        let emcFreqMatch = "N/A";
        try {
            emcFreqMatch = output.match(/EMC_FREQ \d+%@\d+/)[0].replace("%@", "% ")+"MHz";
        } catch (e) {}

        let gr3dFreq = "N/A";
        try {
            gr3dFreq = output.match(/GR3D_FREQ \d+%@\[\d+/)[0].replace("%@[", "% ")+"MHz";
        } catch (e) {}

        let videoEncoding = "N/A";
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
        } catch (e) {}

        let temperatures = "N/A";
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
        } catch (e) {}

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
    console.log(`Backend server running at http://localhost:${port}/`);
});