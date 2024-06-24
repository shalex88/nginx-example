const express = require('express');
const bodyParser = require('body-parser');
const { exec } = require('child_process');

const app = express();
const port = 3000;

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
    const { id, action } = req.body;
    // TODO: Remove hardcoded path
    const command = `/home/user/project/video/start_stream.sh ${id} ${action}`;

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

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});
