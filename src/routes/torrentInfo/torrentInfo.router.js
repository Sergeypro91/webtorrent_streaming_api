const express = require('express');

const { httpGetTorrentInfo } = require('./torrentInfo.controller');

const torrenInfoRouter = express.Router();

torrenInfoRouter.post('/:link', httpGetTorrentInfo);

module.exports = torrenInfoRouter;
