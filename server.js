'use strict';

const express = require('express');
const compression = require('compression');

const HOST = '127.0.0.1';
const PORT = 8080;

const app = express();
app.use(compression());
app.use(express.static(`${__dirname}/build/`));
app.listen(PORT, HOST, () => {
    console.log(`Listening on port ${PORT}`);
});
