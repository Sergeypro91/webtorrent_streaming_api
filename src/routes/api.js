const express = require('express');

const torrenStreamRouter = require('./torrenStream/torrenStream.router');
const torrentInfoRouter = require('./torrentInfo/torrentInfo.router');

const api = express.Router();

api.use('/torrentStream', torrenStreamRouter);
api.use('/torrentInfo', torrentInfoRouter);

module.exports = api;
