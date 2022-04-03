const WebTorrent = require('webtorrent');
const ffmpeg = require('fluent-ffmpeg');

async function getTorrent(link) {
    return new Promise((resp, rej) => {
        const client = new WebTorrent();

        client.add(link, (torrent) => {
            // Получаем массив файлов в торренте
            const torentFiles = torrent.files;

            // Помечаем торрент как не "выбранный"
            torrent.deselect(0, torrent.pieces.length - 1, false);

            // Убираем все вложенные файлы из загрузки
            torentFiles.map((file) => {
                file.deselect();
            });
        });

        client.on('torrent', (torrent) => {
            resp(torrent);

            setTimeout(() => {
                client.destroy((err) => {
                    console.log('Client successfully destroyed');
                });
            });
        });

        client.on('error', (err) => {
            rej(err);
        });
    });
}

module.exports = { getTorrent };
