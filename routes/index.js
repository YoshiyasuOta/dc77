const express = require('express');
const { brotliDecompressSync } = require('zlib');
const app = express();
const port = process.env.PORT || 3000;
app.listen(port, () => console.log('Listening on port ${port}...'));
/*
var router = express.Router();

/* GET home page. 
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

module.exports = router;
*/



// body
var bodyParser = require('body-parser');
app.use(bodyParser());

// ファイルコントロール
var fs = require('fs');

// 日付コントロール
require('date-utils');



//-------------------- SQLイベント --------------------
// DB接続文字列設定
var Connection = require('tedious').Connection;  
/*
var config = {  
    server: 'localhost',
    authentication: {
        type: 'default',
        options: {
            userName: 'sa',
            password: 'Wintec2711',
            port: 1433
        }
    },
    options: {
        encrypt: false,
        database: 'WINTEC'
    }
};
*/
var config = {  
    server: 'ctmsales.database.windows.net',
    authentication: {
        type: 'default',
        options: {
            userName: 'ctmuser',
            password: 'Wintec2711',
            port: 1433
        }
    },
    options: {
        encrypt: true,
        database: 'CTM_SALES'
    }
};

 









//-------------------- apiイベント --------------------

// JSONデータ格納パラメータ
const courses = [
    {
        name:'',    
        now_image:'',
        pass_ts:'',
        temp:0,
        person_id:0,
        uuid:'',
        face_mask_type:0
    }
];

// APIテスト１
app.get('/api/receive', (req, res) => {
    res.send(courses);
});

// JSON.POSTイベント
app.post('/api/receive', (req, res)=>{
    const course = {
        name: req.body.name,    
        now_image:req.body.now_image,
        now_img:req.body.now_img,
        pass_ts:req.body.pass_ts,
        temp:req.body.temp,
        person_id:req.body.person_id,
        uuid:req.body.uuid,
        face_mask_type:req.body.face_mask_type
    };

    // タイムスタンプ
    var dt = new Date();
    var formatted = dt.toFormat("YYYYMMDD");

    // 文字列結合
    var data = 
    course.name + ',' +
    course.pass_ts + ',' +
    course.temp + ',' +
    course.person_id + ',' +
    course.face_mask_type + ',' +
    course.uuid + ',' +
    course.now_img;

    var image = course.now_img;
    var photo_dt = course.pass_ts;
/*
    // ファイル出力
    var filename = formatted + "_dc77.txt";
    //var filename = "\\\\wt2008r2\\WINTEC\\99_得意先資料\\神谷薬品\\2020.06.サーマルカメラ\\01.DOC\\nodeについて\\" + formatted + "_dc77.txt";
    fs.stat(filename, (error, stats) => {
        if (error) {
            writeFile(filename, data + '\n');
        } else {
            appendFile(filename, data + '\n');
        }
    });
*/

    // DB接続＆SQL文実行
    var connection = new Connection(config);  
    connection.on('connect', function(err) {  
        if (err) {  
            console.log(err);} 
        else{
            console.log("Connected");
        
            // SQL実行
            InsertDataProcess();  
        }  
    });
    // DB接続完了
    connection.on('end', function(){
        console.log("disconnected");
    }); 


    
    // SQL文実行関数
    var Request = require('tedious').Request;  
    var TYPES = require('tedious').TYPES;
    function InsertDataProcess() {  
        // SQL文発行
        request = new Request(
            "INSERT dbo.T_PHOTO_LOG (" +
            " PHOTO_TIME" +
            ",USER_NAME" +
            ",USER_ID" +
            ",USER_TEMP" +
            ",USER_IMAGE" +
            ",MASK_MODE" +
            ",MACHINE_NAME" +
            ") VALUES (" +
            " @PHOTO_TIME" +
            ",@USER_NAME" +
            ",@USER_ID" +
            ",@USER_TEMP" +
            ",@USER_IMAGE" +
            ",@MASK_MODE" +
            ",@MACHINE_NAME" +
            ");", function(err) {  
        if (err) {  
            console.log(err);}  
        });  

        // パラメータセット
        request.addParameter('PHOTO_TIME', TYPES.DateTimeOffset, course.pass_ts);
        request.addParameter('USER_NAME', TYPES.NVarChar, course.name);
        request.addParameter('USER_ID', TYPES.NVarChar, course.person_id);
        request.addParameter('USER_TEMP', TYPES.Float, course.temp);
        request.addParameter('USER_IMAGE', TYPES.NVarChar, course.now_img);
        request.addParameter('MASK_MODE', TYPES.Int, course.face_mask_type);
        request.addParameter('MACHINE_NAME', TYPES.NVarChar, course.uuid);

        // SQLの行ごとに実行
        request.on('row', function(columns){
            columns.forEach(function(column){
                if(column.value === null){
                    console.log('NULL');
                }else{
                    console.log('INSERT ' + column.value);
                } 
            });
        });
        
        // SQLのリクエスト完了
        request.on('requestCompleted', function(){
            console.log('requestCompleted');
            connection.close();
        });
        request.on('done', function(){
            console.log('done');
            connection.close();
        });

        // DB処理実行
        connection.execSql(request);  
    }  
    
// base64形式画像データ 変換テスト
/* 
    // 画像変換
    fs.readFile('encoded.png', 'utf8', function(err, image) {
        var decode = new Buffer(image,'base64');
        fs.writeFile(photo_dt.toFormat("YYYYMMDDHH24MISS") + '_xxx.png', decode, function(err) {
          console.log(err);
        });
    });
*/

    courses.push(course);
    res.send(course);
});












//-------------------- FUNCTION --------------------

//ファイルの書き込み関数
function writeFile(path, data) {
    fs.writeFile(path, data, function (err) {
        if (err) {
            throw err;
        }
    });
}
//ファイルの追記関数
function appendFile(path, data) {
    fs.appendFile(path, data, function (err) {
        if (err) {
            throw err;
        }
    });
}

  