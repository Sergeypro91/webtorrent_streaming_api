const fs = require('fs');
const WebTorrent = require('webtorrent');
const ffmpeg = require('fluent-ffmpeg');

const SAMPLE_DURATION = 30;
const SAMPLE_START_FROM = 5;
const SAMPLE_RESOLUTION = 480;
const SAMPLE_FPS = 12;
const SAMPLE_V_CODEC = 'libx264';

function generateThumb(filePath, fileName, fileDir) {
    return new Promise((resolve, reject) => {
        ffmpeg(filePath)
            .inputOptions([`-ss ${SAMPLE_START_FROM}`])
            .outputOptions([`-t ${SAMPLE_DURATION}`])
            .outputOption( "-vf", `scale=${SAMPLE_RESOLUTION}:-1:flags=lanczos,fps=${SAMPLE_FPS}`)
            .videoCodec(`${SAMPLE_V_CODEC}`)
            .noAudio()
            .screenshots({
                timestamps: [SAMPLE_START_FROM],
                filename: `${fileName}.thumb.jpg`,
                folder: fileDir,
                size: `${SAMPLE_RESOLUTION}x?`,
            })
            .output(`${fileDir}/${fileName}.sample.mp4`)
            .on('end', resolve)
            .on('error', reject)
            .run();
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

        resolve({
            format: metaData.format['format_name'],
            duration: metaData.format.duration,
            ...filteredData
        });
    });
}

function createFileThumb(link, fileId, duration) {
    const client = new WebTorrent();

    client.add(link, async (torrent) => {
        console.log(
            '\x1b[33m%s\x1b[0m',
            'WebTorrent client created !',
        );

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

        // Создаём читающий торент стрим -> пишуший стрим в файл семпл
        const stream = file.createReadStream();
        const writeStream = fs.createWriteStream(filePath);

        stream.pipe(writeStream);

        // Расчет отсечки х-секунд в процентном выражении
        const cutOffPercent = (100 / (duration / SAMPLE_DURATION)).toFixed(3);

        // Следим за % загрузки, ловим отсечку, срезаем миниатюру из семпла, удаляем семпл
        torrent.on('download', async () => {
            if (file.progress * 100 > cutOffPercent) {
                client.destroy(() => {
                    console.log(
                        '\x1b[36m%s\x1b[0m',
                        'WebTorrent client, successfully destroyed !',
                    );
                });

                await generateThumb(filePath, fileName, fileDir);

                // Удаляем файл семпла
                setTimeout(() => {
                    fs.unlinkSync(filePath);
                    console.log(
                        '\x1b[32m%s\x1b[0m',
                        `Video sample "${filePath}" was deleted !`,
                    );
                });
            }
        });
    });
}

function getTorrentFileInfo(link, fileId) {
    return new Promise((resolve, reject) => {
        const client = new WebTorrent();

        client.add(link, async (torrent) => {
            console.log(
                '\x1b[33m%s\x1b[0m',
                'WebTorrent client created !',
            );

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

                // Создаём читающий торент стрим
                const stream = file.createReadStream();
                const metaData = await getMetaData(stream);

                resolve({name: file.name, ...metaData });

                // Уничтажаем ранее созданного клиента
                client.destroy(() => {
                    console.log(
                        '\x1b[36m%s\x1b[0m',
                        'WebTorrent client, successfully destroyed !',
                    );
                });

                // Запуск генерации миниатюры для файла
                createFileThumb(link, fileId, metaData.duration);
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
