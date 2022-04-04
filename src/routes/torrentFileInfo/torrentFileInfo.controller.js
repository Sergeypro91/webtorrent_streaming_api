const {
    getTorrentFileInfo,
    collectFileInfo,
} = require('../../models/torrentFileInfo/torrentFileInfo.model');

async function httpGetTorrentFileInfo(req, res) {
    const torrentLink = JSON.parse(JSON.stringify(req.body))?.link;
    const torrentFileId = JSON.parse(JSON.stringify(req.body))?.fileId;

    const answerObj = {
        result: 0,
        data: '',
        message: '',
    };

    if (torrentLink && typeof torrentFileId === 'number') {
        try {
            const fileData = await getTorrentFileInfo(
                torrentLink,
                torrentFileId,
            );

            answerObj.result = 1;
            answerObj.data = {
                id: torrentFileId,
                mediaType: { ...fileData },
            };
        } catch (err) {
            answerObj.result = 0;
            answerObj.message = 'Some error with torrent client';
        }
    } else {
        answerObj.message =
            'Some error with torrent "link" of torrent file "id"';
    }

    res.send(JSON.stringify(answerObj));
}

module.exports = {
    httpGetTorrentFileInfo,
};
