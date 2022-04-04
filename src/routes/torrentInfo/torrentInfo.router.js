const express = require('express');

const { httpGetTorrentInfo } = require('./torrentInfo.controller');

const torrentInfoRouter = express.Router();

torrentInfoRouter.post('/', httpGetTorrentInfo);

module.exports = torrentInfoRouter;
