const mongoConfig = require('../configuration/db-config') ;
const querystring = require('querystring');
var request = require('request');
var videosIdList = [];
const getVideosList = (options,channelId,YoutubeApiKey)=>{
    return new Promise((resolve, reject)=>{

        request.get('https://www.googleapis.com/youtube/v3/search?' + options,(err,data)=>{
            var video_ID = [];
            if(err){
                console.log(err)
                reject(err);
            }
            var results = JSON.parse(data.body);
            results.items.forEach(element => {
                videosIdList.push(element.id.videoId);
                video_ID.push(element.id.videoId);
            });
            console.log(`video id length ${video_ID.length}`)
            var options0 = querystring.stringify({
                part : 'snippet,contentDetails,statistics', 
                id: '"'+video_ID.join() +'"',
                key: YoutubeApiKey
            });
            getEachVideoTags(options0,channelId).then(()=>{
            if(results.nextPageToken){
                var options1 = querystring.stringify({
                part : 'snippet', 
                channelId : channelId, 
                type : 'video',
                pageToken: results.nextPageToken,
                maxResults: 50,
                key: YoutubeApiKey
            });

            resolve( getVideosList(options1,channelId,YoutubeApiKey));
            }else{
                console.log('completed');
                resolve (videosIdList);
            }
        });
        });
        
    })
}

const getEachVideoTags = (options,channelId)=>{
    return new Promise((resolve, reject)=>{
    mongoConfig.connectToServer(function(err){
        console.log('connected to the MongoDb server');   
    request.get('https://www.googleapis.com/youtube/v3/videos?' + options,(err,data)=>{
        if(err)
        return console.log(err);
        var results = JSON.parse(data.body);
        console.log(`results length ${results.items.length}`);
        if(results.items.length !== 0){
        results.items.forEach(element => {
            db.collection('Videos-Details').insertOne({id:channelId, videos: [{title: element.snippet.title,tags:[element.snippet.tags],statistics:{viewCount:element.statistics.viewCount,likeCount:element.statistics.likeCount,dislikeCount:element.statistics.dislikeCount,commentCount:element.statistics.commentCount}}] },(err,result)=>{
                if(result){
                    resolve();
                }
            });
        });
    }else{
        resolve();
    }
    });
});
});
}





module.exports = {
    getVideosList,
    getEachVideoTags
} ;