## 9GAG 内容抓取

### 运行

修改 `app.js`:

* `pageCount` 为每个分类要抓取的页数，超过实际页数时自动停止。
* `type` 为获取的数据类型。`hot`、`trending`、`fresh`对应最热、上升、最新
* `category` 数组为要抓取的分类

执行`node app.js`运行代码或使用pm2守护进程：`pm2 start app.js --name '9gag'`。

下载完的视频、图片及JSON文件存储在`downloads`对应目录下，完整日志在`logs`目录。

### 程序说明

1、总共52个分类。

2、数据获取

* url：`https://9gag.com/v1/group-posts/group/cute/type/hot?c=10`
* 说明：`cute` 为分类。首次获取只需传入 `c=10` 即为前十条数据。下次请求附带上次请求返回的 `nextCursor` 参数即可。每次请求返回10条数据。

3、每个资源的属性：

* 唯一标志： id
* 资源描述： titile


4、资源分三种类型，根据images属性下的字段区分

1. image
    * 属性：image460    image700
2. gif
    * 属性：image460    image460sv  image460svwm    image700  
    * 说明：image460sv image460svwm 两个属性下的 hasAudio 字段为0，及为无声，即为GIF

3. video
    * 属性：image460    image460sv  image460svwm   image700
    * 说明：image460sv image460svwm 两个属性下的 hasAudio 字段为1，及为有声，即为video

5、内容字段

```js
image460 : {
    height: 258
    url: "https://img-9gag-fun.9cache.com/photo/aq73Yrj_460s.jpg"
    webpUrl: "https://img-9gag-fun.9cache.com/photo/aq73Yrj_460swp.webp"
    width: 460
}

image460sv: {
    duration: 32
    h265Url: "https://img-9gag-fun.9cache.com/photo/aq73Yrj_460svh265.mp4"
    hasAudio: 1
    height: 258
    url: "https://img-9gag-fun.9cache.com/photo/aq73Yrj_460sv.mp4"
    vp9Url: "https://img-9gag-fun.9cache.com/photo/aq73Yrj_460svvp9.webm"
    width: 460
}

image460svwm : {
    duration: 32
    hasAudio: 1
    height: 258
    url: "https://img-9gag-fun.9cache.com/photo/aq73Yrj_460svwm.webm"
    width: 460
}

image700 : {
    height: 258
    url: "https://img-9gag-fun.9cache.com/photo/aq73Yrj_460s.jpg"
    width: 460
}

```

6、分类数组

```js
[
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
```

7、请求返回数据格式

```js
{
    "meta": {
        "timestamp": 1537350040,
        "status": "Success",
        "sid": "9gVQ01EVjlHTUVkMMRVS1wEVJFTTB1TY"
    },
    "data": {
        "posts": [{
            "id": "aQ3w2q8",
            "url": "http:\/\/9gag.com\/gag\/aQ3w2q8",
            "title": "Demonic ZR",
            "type": "Photo",
            "nsfw": 0,
            "upVoteCount": 10,
            "creationTs": 1537304358,
            "promoted": 0,
            "isVoteMasked": 0,
            "hasLongPostCover": 0,
            "images": {
                "image700": {
                    "width": 700,
                    "height": 933,
                    "url": "https:\/\/img-9gag-fun.9cache.com\/photo\/aQ3w2q8_700b.jpg",
                    "webpUrl": "https:\/\/img-9gag-fun.9cache.com\/photo\/aQ3w2q8_700bwp.webp"
                },
                "image460": {
                    "width": 460,
                    "height": 613,
                    "url": "https:\/\/img-9gag-fun.9cache.com\/photo\/aQ3w2q8_460s.jpg",
                    "webpUrl": "https:\/\/img-9gag-fun.9cache.com\/photo\/aQ3w2q8_460swp.webp"
                }
            },
            "sourceDomain": "",
            "sourceUrl": "",
            "commentsCount": 0,
            "postSection": {
                "name": "Fan Art ",
                "url": "https:\/\/9gag.com\/animefanart",
                "imageUrl": "https:\/\/miscmedia-9gag-fun.9cache.com\/images\/thumbnail-facebook\/1530063695.5011_DE9YhE_100x100.jpg"
            },
            "tags": [],
            "descriptionHtml": ""
        }
        ....
        ],
        "group": {
            "name": "Fan Art ",
            "url": "animefanart",
            "description": "For all your fan art needs!",
            "ogImageUrl": "https:\/\/miscmedia-9gag-fun.9cache.com\/images\/thumbnail-facebook\/1530063695.5011_DE9YhE_100x100.jpg",
            "userUploadEnabled": true,
            "isSensitive": false
        },
        "nextCursor": "after=a9pQ5PK%2CaDxp8Zw%2CaBxqVrx&c=20"
    }
}
```

获取评论接口


`https://comment-cdn.9gag.com/v1/cacheable/comment-list.json?appId=a_dd8f2b7d304a10edaf6f29517ea0ca4100a43d1b&url=http:%2F%2F9gag.com%2Fgag%2FaAxWgdR&count=10&order=score`