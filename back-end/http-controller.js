const express = require('express');
const fs = require('fs');
const bodyParser = require('body-parser');
const axios = require('axios');
const multer = require('multer');
const path = require('path');

const app = express();
const port = 3000;
const backendUrl = 'http://localhost:4000'; // URL of the backend server

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../../../video/tests/movies'));
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

const upload = multer({ storage: storage });

app.use(bodyParser.json({ limit: '1gb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '1gb' }));
app.use(express.static('public'));

app.post('/sendData', (req, res) => {
    const inputData = req.body.data;

    axios.post(`${backendUrl}/executeCommand`, { command: inputData })
        .then(response => res.send(response.data))
        .catch(error => res.status(500).send(`Error: ${error}`));
});

app.post('/handleStream', (req, res) => {
    const { action, type, id, preprocessing, postprocessing } = req.body;

    axios.post(`${backendUrl}/handleStream`, { action, type, id, preprocessing, postprocessing })
        .then(response => res.send(response.data))
        .catch(error => res.status(500).send(`Error: ${error}`));
});

app.post('/handleStreamElement', (req, res) => {
    const { command, type, id } = req.body;

    axios.post(`${backendUrl}/handleStreamElement`, { command, type, id })
        .then(response => res.send(response.data))
        .catch(error => res.status(500).send(`Error: ${error}`));
});

app.get('/getTopOutput', (req, res) => {
    axios.get(`${backendUrl}/getTopOutput`)
        .then(response => res.send(response.data))
        .catch(error => res.status(500).send(`Error: ${error}`));
});

app.post('/upload', upload.array('files'), (req, res) => {
    res.json({ message: 'Files uploaded successfully', files: req.files });
});

app.get('/movies', (req, res) => {
    const moviesDir = path.join(__dirname, '../../../video/tests/movies');
    fs.readdir(moviesDir, (err, files) => {
        if (err) {
            return res.status(500).json({ error: 'Unable to fetch movie files' });
        }
        const mp4Files = files.filter(file => path.extname(file).toLowerCase() === '.mp4');
        res.json(mp4Files);
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});
