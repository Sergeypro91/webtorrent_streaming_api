const Webtorrent = require('webtorrent');
const ffmpeg = require('fluent-ffmpeg');

const torrentId =
    // 'magnet:?xt=urn:btih:f0f042bf8c08f5531cfcea0eaf608784abb4e72d&tr=http%3A%2F%2Fbt02.nnm-club.cc%3A2710%2F00189626c471ef6326f26d0272a23d43%2Fannounce&tr=http%3A%2F%2Fbt02.nnm-club.cc%3A2710%2F00189626c471ef6326f26d0272a23d43%2Fannounce';
    // 'https://n.tracktor.site/td.php?s=wuYeYbM6GBoV4atxJCWoiQ2MIYVUEFzhUsV8FCy7lBdthlTVtacAw9%2BskdcXxmIp0n7uj%2B%2Fl6lMyQIHyOgWtRjQjDl0e%2BiJtjM4XV5BwlKkfMSrc9AYCxMFEKX3y2%2F%2B%2BW5it9Q%3D%3D';
    'magnet:?xt=urn:btih:190082f2af24e98a1c52e4db173c354c4806761f&tr=http%3A%2F%2Fbt02.nnm-club.cc%3A2710%2F00189626c7582b835d2b5f0585cbeb5b%2Fannounce&tr=http%3A%2F%2Fbt02.nnm-club.cc%3A2710%2F00189626c7582b835d2b5f0585cbeb5b%2Fannounce';

async function httpGetTorrentStream(req, res) {
    const client = new Webtorrent();

    client.add(torrentId, { maxWebConns: 40 }, (torrent) => {
        console.log('TORRENT INFOHASH', torrent);
        // Получаем все данные о торрент-файле
        const torentFiles = torrent.files;

        // Удаляем торент из загрузки
        torrent.deselect(0, torrent.pieces.length - 1, false);

        // Удаляем все йайлы торрента из загрузки
        torentFiles.map((file) => {
            file.deselect();
        });

        // Выбираем конкретный файл для загрузки из всего террента
        const file = torentFiles[0];
        const fileSize = file.length;
        const chunkSize = 10 ** 8;
        const range = req.headers.range;

        // Реализация перемотки
        if (range) {
            const start = Number(range.replace(/\D/g, ''));
            console.log('START', file);
            const end = Math.min(start + chunkSize, fileSize - 1);

            if (start >= fileSize) {
                res.status(416).send(
                    'Requested range not satisfiable\n' +
                        start +
                        ' >= ' +
                        fileSize,
                );
                return;
            }

            const contentLength = end - start + 1;
            const stream = file.createReadStream({
                start,
                end,
            });

            const head = {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': contentLength,
                'Content-Type': 'video/mp4',
            };
            res.writeHead(206, head);

            ffmpeg(stream)
                .audioCodec('libmp3lame')
                .videoCodec('libx264')
                .withOutputFormat('matroska')
                .on('error', function (err) {
                    console.log('an error happened: ' + err.message);
                })
                .on('end', function () {
                    console.log('file has been converted succesfully');
                })
                // .pipe(res);
                .writeToStream(res, { end: true });
        } else {
            const head = {
                'Content-Length': fileSize,
                'Content-Type': 'video/mp4',
            };
            res.writeHead(200, head);

            const stream = file.createReadStream();
            stream.pipe(res);
        }
    });
}

module.exports = {
    httpGetTorrentStream,
};
