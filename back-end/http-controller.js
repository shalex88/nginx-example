const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
const port = 3000;
const backendUrl = 'http://localhost:4000'; // URL of the backend server

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

app.post('/sendData', (req, res) => {
    const inputData = req.body.data;

    axios.post(`${backendUrl}/executeCommand`, { command: inputData })
        .then(response => res.send(response.data))
        .catch(error => res.status(500).send(`Error: ${error}`));
});

app.post('/handleStream', (req, res) => {
    const { id, action, preprocessing, postprocessing } = req.body;

    axios.post(`${backendUrl}/handleStream`, { id, action, preprocessing, postprocessing })
        .then(response => res.send(response.data))
        .catch(error => res.status(500).send(`Error: ${error}`));
});

app.get('/getTopOutput', (req, res) => {
    axios.get(`${backendUrl}/getTopOutput`)
        .then(response => res.send(response.data))
        .catch(error => res.status(500).send(`Error: ${error}`));
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});
