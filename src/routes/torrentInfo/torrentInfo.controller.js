const { getTorrent } = require('../../models/torrentInfo/torrentInfo.model');

async function httpGetTorrentInfo(req, res) {
    const torrentLink = JSON.parse(JSON.stringify(req.body))?.link;

    const answerObj = {
        result: 0,
        data: '',
        message: '',
    };

    if (torrentLink) {
        try {
            const torrent = await getTorrent(torrentLink);
            const torrentFilesInfo = torrent.files.map((file, id) => {
                return {
                    id,
                    name: file.name,
                    path: file.path,
                    size: file.length,
                };
            });

            answerObj.result = 1;
            answerObj.data = { torrentFilesInfo };
        } catch (err) {
            answerObj.result = 0;
            answerObj.message = 'Some error with torrent client';
        }
    } else {
        answerObj.message = 'Some error with torrent link';
    }

    res.send(JSON.stringify(answerObj));
}

module.exports = {
    httpGetTorrentInfo,
};
