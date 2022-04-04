const express = require('express');

const torrentStreamRouter = require('./torrenStream/torrenStream.router');
const torrentInfoRouter = require('./torrentInfo/torrentInfo.router');
const torrentFileInfoRouter = require('./torrentFileInfo/torrentFileInfo.router');

const api = express.Router();

api.use('/torrentStream', torrentStreamRouter);
api.use('/torrentInfo', torrentInfoRouter);
api.use('/torrentFileInfo', torrentFileInfoRouter);

module.exports = api;
