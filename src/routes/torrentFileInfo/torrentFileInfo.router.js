const express = require('express');

const { httpGetTorrentFileInfo } = require('./torrentFileInfo.controller');

const torrenFileInfoRouter = express.Router();

torrenFileInfoRouter.post('/', httpGetTorrentFileInfo);

module.exports = torrenFileInfoRouter;