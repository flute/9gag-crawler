const request = require('request')
const async = require('async')
const path = require('path')
const fs = require('fs')
// log
const log = require('./utils/log').getLogger('debug')
// 每个分类要抓取的总页数
let pageCount = 1
// type = 'hot','trending','fresh'
let type = 'fresh'

const category = [
    'funny',
    'cute',
    'anime-manga',
    'ask9gag',
    'awesome',
    'basketball',
    'car',
    'comic',
    'cosplay',
    'country',
    'classicalartmemes',
    'imadedis',
    'drawing',
    'animefanart',
    'food',
    'football',
    'fortnite',
    'gaming',
    'gif',
    'girl',
    'girly',
    'guy',
    'history',
    'horror',
    'home',
    'kpop',
    'leagueoflegends',
    'lego',
    'movie-tv',
    'music',
    'overwatch',
    'pcmr',
    'photography',
    'pokemon',
    'politics',
    'relationship',
    'pubg',
    'roastme',
    'savage',
    'starwars',
    'satisfying',
    'school',
    'science',
    'superhero',
    'surrealmemes',
    'sport',
    'travel',
    'timely',
    'video',
    'warhammer',
    'wallpaper',
    'wtf'
]

// 视频存储数组
let videoList = []
// video数量
let videoAmount = 0
// img数量
let imgAmount = 0


// 存储路径
let videoDlPath = path.resolve(__dirname, `./downloads/video`);
let videoJsonPath = path.resolve(__dirname, `./downloads/video_json`);
let imgDlPath = path.resolve(__dirname, `./downloads/img`);
let imgJsonPath = path.resolve(__dirname, `./downloads/img_json`);

mkdirsSync(videoDlPath)
mkdirsSync(videoJsonPath)
mkdirsSync(imgDlPath)
mkdirsSync(imgJsonPath)

/**
 * 同步递归创建目录
 */
function mkdirsSync(dirname) {
    //log.info(dirname);  
    if (fs.existsSync(dirname)) {
        return true;
    } else {
        if (mkdirsSync(path.dirname(dirname))) {
            fs.mkdirSync(dirname);
            return true;
        }
    }
}

/**
 * 获取内容
 */
const get9gagList = (category, offset, next) => {

    var options = {
        method: 'GET',
        url: `https://9gag.com/v1/group-posts/group/${category}/type/${type}?`
    };

    if (offset == '') {
        options.url += 'c=10'
    } else if (offset == -1) {
        return next('complete')
    } else {
        options.url += offset
    }

    request(options, function (error, response, body) {
        if (error) {
            next(error, null)
            return
        }
        let data = JSON.parse(body)

        if (data && data.data && data.data.posts && data.data.posts.length) {
            log.info(`获取 ${category} 视频列表成功 offset ${offset? offset: 'c=10'}`, data.data.posts.length)
            //videoList.push(data.data)
            videoList = videoList.concat(data.data.posts)
            return next(null, category, data.data.nextCursor)
        } else {
            log.info(`获取 ${category} 内容为空 offset ${offset}，所有数据获取完毕 。`)
            return next(null, category, -1)
        }
    });

}

/**
 * 批量获取内容列表
 */
const getMultiList = async category => {
    // 每页依次队列获取
    let actions = [async.constant(category, '')]
    for (let i = 1; i <= pageCount; i++) {
        actions.push(get9gagList)
    }
    return new Promise((resolve, reject) => {
        async.waterfall(actions, function (err, result) {
            log.info(`finish crawler ${category} videos`, err, videoList.length)
            //if (err) return reject(new Error(err))
            if (err) log.info(err)
            return resolve(videoList)
        })
    })
}

/**
 * 下载视频/图片
 */
const download = (category, media, next) => {
    //return new Promise((resolve, reject) => {
        let isExist = isFileExist(media.id)
        if (isExist) return next(null)

        let filePath
        if (media.type == 'video') {
            filePath = `${videoDlPath}/${media.id}.mp4`
        } else if (media.type == 'img') {
            filePath = `${imgDlPath}/${media.id}.jpg`
        } else return next(null)

        request(media.url)
            .on('response', function (res) {
                // create file write stream
                var fws = fs.createWriteStream(filePath);
                // setup piping
                res.pipe(fws);
                // finish
                res.on('end', function (e) {
                    log.info(`finish download ${category} ${filePath}`)
                    saveJsonData(media.type, {
                        id: media.id,
                        category: category,
                        desc: media.desc
                    })
                    if (media.type == 'video') videoAmount++
                    else imgAmount++

                    //return resolve(filePath)
                    return next(null)
                });
                // error handler
                res.on('error', err => {
                    log.error('download error', err)
                    //return reject(err)
                    return next(null)
                })
            });
    //})
}

/**
 * 视频是否已下载
 */
const isFileExist = id => {
    let videoPath = `${videoDlPath}/${id}.mp4`
    let imgPath = `${imgDlPath}/${id}.jpg`
    if (fs.existsSync(videoPath)) {
        log.info('video file exist', videoPath)
        return true
    } else if (fs.existsSync(imgPath)) {
        log.info('img file exist', imgPath)
        return true
    } else return false
}

/**
 * 视频下载成功后，实时更新json数据。防止程序中途奔溃后视频信息未保存
 */
const saveJsonData = (type, data) => {
    try {
        // 读取已有json信息
        let jsonFile = type == 'video' ? videoJsonPath : imgJsonPath
        jsonFile += `/data.json`

        let jsonData = []
        if (fs.existsSync(jsonFile)) {
            fileData = fs.readFileSync(jsonFile, {
                encoding: 'utf8'
            })
            if (fileData) {
                jsonData = JSON.parse(fileData)
            }
        }
        // 写入
        jsonData.push(data)
        fs.writeFileSync(jsonFile, JSON.stringify(jsonData));

    } catch (error) {
        log.error('写入json文件失败', data)
    }

}

/**
 * 将无声MP4转为gif图
 */
const convertVideoToGift = () => {
    let videoPath = './233.mp4'
    var command = ffmpeg(videoPath)
        /* .audioCodec('libfaac')
        .videoCodec('libx264') */
        .format('gif');
    command.save('./233.gif');
}

/**
 * 内容筛选，只下载有声视频
 */
const mediaFilter = data => {
    let results = [],
        videos = [],
        imgs = []
    for (let i = 0; i < data.length; i++) {
        let video = data[i]
        if (video.images.image460sv && video.images.image460sv.hasAudio && video.images.image460sv.url) {
            // 有声视频
            videos.push({
                id: video.id,
                type: 'video',
                url: video.images.image460sv.url,
                desc: video.title
            })
        } else if (!video.images.image460sv && video.images.image460.url) {
            // 图片
            imgs.push({
                id: video.id,
                type: 'img',
                url: video.images.image460.url,
                desc: video.title
            })
        }
    }
    return {
        results: results.concat(videos, imgs),
        video: videos.length,
        img: imgs.length
    }
}

/**
 * 每个分类的抓取任务
 */
const task = async (category, next) => {
    let videoLists = await getMultiList(category)
    videoList = []
    log.info('数据获取成功', videoLists.length)
    let {
        results: videos,
        video,
        img
    } = mediaFilter(videoLists)
    log.info(`${videoLists.length} 个内容，有声视频共 ${video} 个，图片共 ${img} 个`)
    
    let dlActions = videos.map(video => next => {
        return download(category, video, next)
    })

    async.series(dlActions, (err, result) => {
        if(err) {
            log.error(`finish【${category}】all download error`, error)
            return next(error)
        }
        log.info(`finish【${category}】all downloads success`, result.filter(item => item).length)
            return next(null)
    })
    /* Promise.all(dlActions)
        .then(result => {
            log.info(`finish【${category}】all downloads success`, result.filter(item => item).length)
            return next(null)
        })
        .catch(error => {
            log.error(`finish【${category}】all download error`, error)
            return next(error)
        })
 */
}

const main = () => {

    let actions = category.map(item => next => {
        return task(item, next)
    })

    return new Promise((resolve, reject) => {
        async.series(actions, function (err, result) {
            if (err) return reject(new Error(err))
            return resolve(result)
        })
    })
}

main()
    .then(result => {
        log.info(`awsome！ all ${result.length} tasks finish success! video: ${videoAmount} 个, img: ${imgAmount} 个`, )
    })
    .catch(error => {
        log.info(`all tasks finish error!  video: ${videoAmount}, img: ${imgAmount}`, error)
    })
    .then(() => {
        process.exit(0)
    })
