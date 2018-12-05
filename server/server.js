const express = require('express');
var request = require('request');
const querystring = require('querystring');
const cron = require('node-cron');
const app = express();
const mongoConfig = require('../configuration/db-config') ;
const YoutubeApiKey = require('../configuration/api-config').apiKey;
const getVideosList = require('../controllers/app').getVideosList;
const getEachVideoTags = require('../controllers/app').getEachVideoTags;
let port = process.env.PORT || 3000;
app.set('port', port);
  
mongoConfig.connectToServer(function(err){
    console.log('connected to the MongoDb server');
    app.get('/channels/data',(req,res)=>{
        // console.log(db)
        const channelId = req.query.Id;
        console.log(channelId)
        var options = querystring.stringify({
            part : 'snippet,statistics',
            id : channelId, 
            key: YoutubeApiKey
        });
        db.collection('channels').findOne({id:channelId},(err,doc)=>{
            if(err)
            return console.log(err);
            console.log(doc)
            if(doc){
                console.log('there')
                res.json({id:doc.id,title:doc.title,description:doc.description,statistics:{viewCount:doc.statistics.videoCount,subscriberCount:doc.statistics.subscriberCount,videoCount:doc.statistics.videoCount}});

            }else{
                request
                .get('https://www.googleapis.com/youtube/v3/channels?' + options,(err,data)=>{
                    if(err){
                    console.log(err)
                    }
                    var results = JSON.parse(data.body);
                    db.collection('channels').insert({id:channelId,title:results.items[0].snippet.title,description:results.items[0].snippet.description,publishedAt:results.items[0].snippet.publishedAt,statistics:{viewCount:results.items[0].statistics.viewCount,subscriberCount:results.items[0].statistics.subscriberCount,videoCount:results.items[0].statistics.videoCount}});
                    var options1 = querystring.stringify({
                        part : 'snippet', 
                        channelId : channelId, 
                        type : 'video',
                        maxResults: 50,
                        key: YoutubeApiKey
                    });   

                    let promise =  getVideosList(options1,channelId,YoutubeApiKey);
                    
                    promise.then((result)=>{
                        console.log('alaallal');
                        db.collection('channels').findOne({id:channelId},(err,doc)=>{
                            if(err){
                                console.log(err);
                            }
                            res.json({id:doc.id,title:doc.title,description:doc.description,statistics:{viewCount:doc.statistics.videoCount,subscriberCount:doc.statistics.subscriberCount,videoCount:doc.statistics.videoCount}});
                        })
                       
                    })
                    .catch((err)=>{
                        res.send(err)
                        console.log(err);
                    })

                    cron.schedule('* * * 0-6', () => {
                        console.log('running a task every day');
                        let promise =  getVideosList(options1);
                        promise.then((result)=>{
                            getEachVideoTags(result);
                        })
                        .catch((err)=>{
                            res.send(err)
                        })
                      });
                });
                
            }

        });
    });

});



app.listen(app.get('port'), (err) => {
    console.log(`Server running on port: ${app.get('port')}`);
})