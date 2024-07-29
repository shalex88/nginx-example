const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const multer = require('multer');
const path = require('path');

const app = express();
const port = 3000;
const backendUrl = 'http://localhost:4000'; // URL of the backend server

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

const upload = multer({ storage: storage });

app.use(bodyParser.json({ limit: '300mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '300mb' }));
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

app.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }
    res.send('File uploaded successfully.');
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});
