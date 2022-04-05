const fs = require('fs');
const WebTorrent = require('webtorrent');
const ffmpeg = require('fluent-ffmpeg');

function createVideoThumb(filePath, fileName, fileDir) {
    return new Promise((resolve, reject) => {
        ffmpeg(filePath)
            .screenshots({
                timestamps: [10],
                filename: `${fileName}.jpg`,
                folder: fileDir,
                size: '480x?',
            })
            .on('end', (err) => {
                if (err) {
                    reject(err);
                } else {
                    console.log(
                        '\x1b[32m%s\x1b[32m',
                        'Video thumbnail is created !',
                    );
                    resolve();
                }
            });
    });
}

function getMetaData(filePath) {
    return new Promise((resolve, reject) => {
        ffmpeg(filePath).ffprobe(async (err, info) => {
            if (err) {
                reject(err);
            } else {
                const filteredMetaData = await filterMetaData(info);
                resolve(filteredMetaData);
            }
        });
    });
}

function filterMetaData(metaData) {
    return new Promise((resolve) => {
        const filteredData = metaData.streams.reduce(
            (acc, file) => {
                if (file['codec_type'] === 'video') {
                    const newInfo = {
                        codec: file?.['codec_type'],
                        profile: file?.profile,
                        dimension: {
                            width: file?.width,
                            height: file?.height,
                        },
                    };

                    acc.video.push(newInfo);
                }

                if (file['codec_type'] === 'audio') {
                    const newInfo = {
                        codec: file?.['codec_type'],
                        name: file?.tags?.title,
                        language: file?.tags?.language,
                    };

                    acc.audio.push(newInfo);
                }

                if (file['codec_type'] === 'subtitle') {
                    const newInfo = {
                        codec: file?.['codec_type'],
                        name: file?.tags?.title,
                        language: file?.tags?.language,
                    };

                    acc.subtitle.push(newInfo);
                }

                return acc;
            },
            { video: [], audio: [], subtitle: [] },
        );

        resolve(filteredData);
    });
}

function getTorrentFileInfo(link, fileId) {
    return new Promise((resolve, reject) => {
        const client = new WebTorrent();

        client.add(link, async (torrent) => {
            try {
                // Получаем массив файлов в торренте
                const torrentFiles = torrent.files;

                // Помечаем торрент как не "выбранный"
                torrent.deselect(0, torrent.pieces.length - 1, false);

                // Убираем все вложенные файлы из загрузки
                torrentFiles.map((file) => {
                    file.deselect();
                });

                // Выбираем запрашиваемый в торренте файл
                const file = torrentFiles[fileId];
                const fileName = file.name;
                const folderName = torrent.name;
                const filePath = `./videoSample/${folderName}/${fileName}`;
                const fileDir = `./videoSample/${folderName}`;

                // Создаём директорию для хранения семпла и миниатюры
                if (!fs.existsSync(fileDir)) {
                    fs.mkdirSync(fileDir);
                }

                // Создаём читающий торент стрим -> пишуший стрим в файл
                const stream = file.createReadStream();
                const writeStream = fs.createWriteStream(filePath);

                stream.pipe(writeStream);

                // Следим за % загрузки, прерываем, делаем срез миниатюры и забор метаданных
                torrent.on('download', async () => {
                    // % после которого прырывается загрузка торрента
                    const cutOff = 2.1;

                    if (file.progress * 100 > cutOff) {
                        client.destroy(() => {
                            console.log(
                                '\x1b[36m%s\x1b[36m',
                                'WebTorrent client, successfully destroyed !',
                            );
                        });

                        await createVideoThumb(filePath, fileName, fileDir);
                        const metaData = await getMetaData(filePath);

                        resolve(metaData);

                        // Удаляем файл семпла
                        setTimeout(() => {
                            fs.unlinkSync(filePath);
                            console.log(
                                '\x1b[32m%s\x1b[32m',
                                `Video sample "${filePath}" was deleted !`,
                            );
                        });
                    }
                });
            } catch (err) {
                reject(err);
            }
        });

        client.on('error', (err) => {
            reject(err);
        });
    });
}

module.exports = { getTorrentFileInfo };
