const WebTorrent = require('webtorrent');

function getTorrent(link) {
    return new Promise((resolve, reject) => {
        const client = new WebTorrent();

        client.add(link, (torrent) => {
            // Получаем массив файлов в торренте
            const torrentFiles = torrent.files;

            // Помечаем торрент как не "выбранный"
            torrent.deselect(0, torrent.pieces.length - 1, false);

            // Убираем все вложенные файлы из загрузки
            torrentFiles.map((file) => {
                file.deselect();
            });

            resolve(torrent);

            setTimeout(() => {
                client.destroy(() => {
                    console.log(
                        '\x1b[36m%s\x1b[36m',
                        'WebTorrent client, successfully destroyed !',
                    );
                });
            });
        });

        client.on('error', (err) => {
            reject(err);
        });
    });
}

module.exports = { getTorrent };
