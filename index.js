const request = require('request');
const cheerio = require('cheerio');
const TelegramBot = require('node-telegram-bot-api');
const sqlite3 = require('sqlite3').verbose();
const ChartjsNode = require('chartjs-node');

const token = ''; // токен бота

const bot = new TelegramBot(token, {polling: true});

const URL = 'http://www.bti.secna.ru/web-thermo/index.shtml'; // источник температуры

function doDraw(config, filename) {
  // создадим полотно с размером 640x480 пикселей

  var chartNode = new ChartjsNode(640, 480);

  return chartNode.drawChart(config)

      .then(() => {

          // запишем результат в файл

          return chartNode.writeImageToFile('image/png', filename);

      });

}

function prepareDraw0(v_time){


  // создадим Promise сборки данных и конфигурации

  return new Promise((resolve, reject)=>{resolve()})

      // здесь могут быть много шагов сбора данных, прежде чем перейти к графику

      .then(()=>{

          // произвольные данные, похожие на те, что хранятся в бд

         /* testData = [

              {"val":3,"ack":1,"ts":1539063874301},

              {"val":5,"ack":1,"ts":1539063884299},

              {"val":5.3,"ack":1,"ts":1539063894299},

              {"val":3.39,"ack":1,"ts":1539063904301},

              {"val":5.6,"ack":1,"ts":1539063914300},

              {"val":-1.3,"ack":1,"ts":1539063924300},

              {"val":-6.3,"ack":1,"ts":1539063934302},

              {"val":1.23,"ack":1,"ts":1539063944301},

          ];*/

      })

      // финальный шаг - создаем конфигурацию графиков

      .then(()=>{

          const chartJsOptions = {

              // тип графика - линейный

              type: 'line',

        data: {

            // список наборов данных

          datasets: [

            {

                // заголовок ряда 

            label: 'Температура',

            // цвет

            backgroundColor: 'rgb(0, 0, 0)',

            borderColor: 'rgb(0, 0, 0)',

            // размер точек

            pointRadius: 3,

            // ширина линии графика

            borderWidth: 2,

            // достанем данные из переменной 'пример' и оставим только значение и время изменения

            data: v_time.map((item) => {
		console.log(item.val);
              return {y: item.temper, t: new Date(item.tm)}
          }),

            // заливка графика - нет

            fill: false,

            }

          ]
    
        },

        options: {

          // настройка легенды

          legend: {

              labels: {

                  // размер шрифта

                  fontSize: 20,

              },

          },

          // оси координат

          scales: {

              // оси X

            xAxes: [{

                // тип - временная ось

                type: 'time',  

              display: true,

              // метка оси

              scaleLabel: {

                display: true,

                labelString: 'Время'

              },

            }],

            // оси Y

            yAxes: [{

                // тип - линейная

                type: 'linear',

              display: true,

              // метка оси

              scaleLabel: {

                display: true,

                labelString: 'Температура'

              },

            }]

          }

        }

    };
    
    return chartJsOptions;

      });

}

function sendGraph0(v_time){

  // имя файла, в который положим картинку с графиком

  const filename = './graph0.png';

  // выполним подготовку данных 

  prepareDraw0(v_time)

      // на след шаге нарисуем

      .then((result) => {

          // рисуем картинку по полученным данным и конфигурации


          return doDraw(result, filename);

      })
      .catch((err)=>{

          console.error(err);

      });
}

//----------------------------------------------------------------------------------------------------------


setInterval(function () { // функция для повторения запроса температуры
  let v_time = [];
  request(URL, function (err, res, body) {
    if (err) throw err;
    console.log(res.statusCode);
    let flag = 0;
    let $ = cheerio.load(body);
    let ms_last = ($('html').text());
    ms_last = ms_last.replace(/\r|\n/g, '');
    ms_last = ms_last.replace('°C', '');
    ms_last = ms_last.replace(',', '.');
    parseFloat(ms_last);
    var db = new sqlite3.Database('/home/Plex/weather-bot/db/bot.db', (err) => {
      if (err) {
        return console.error(err.message);
      }
      console.log('Connected to the in-memory SQlite database.');
    });
    return new Promise((resolve, reject) => {
    console.log("promise");
    let sql = 'SELECT t temp FROM temp_tbl WHERE mark=1 ORDER BY time DESC LIMIT 1';
    db.each(sql, (err, row) => {
      if (err) {
        reject(err);
      }
      if (row) {
    console.log("row");
    console.log(row.temp);
        if (Math.abs(ms_last - row.temp) >= 5) {
          flag = 1;
    console.log("flag = 1");
          resolve(flag);
        } else resolve(flag);
      }
    });
  })
  .then((flag)=>{
    if (flag == 1) {
          db.run('INSERT INTO temp_tbl(time, t, mark) VALUES(datetime("now", "localtime"), ' + ms_last + ', 1)', function (err) {
            if (err) {
              return console.log(err.message);
            }
            // get the last insert id
            console.log('A row has been inserted with rowid' + this.lastID);
            console.log('Change:' + this.changes);
          });
          let sql = 'SELECT chat_id id FROM foll_tbl WHERE follow=1';
          db.each(sql, (err, row) => {
            if (err) {
              return console.error(err.message);
            }
            if (row) {
              bot.sendMessage(row.id, '*Температура в городе изменилась на пять градусов. Сейчас в Бийске *' + ms_last + '°C', { "parse_mode": "Markdown" });
            }
          });
        } else {
          db.run('INSERT INTO temp_tbl(time, t, mark) VALUES(datetime("now", "localtime"), ' + ms_last + ', 0)', function (err) {
            if (err) {
              return console.log(err.message);
            }
            // get the last insert id
            console.log('A row has been inserted with rowid' + this.lastID);
            console.log('Change:' + this.changes);
          });
        }

      return new Promise((resolve, reject) => {
    
        let sql = "SELECT * FROM (SELECT rowid, time tm, t temper FROM temp_tbl ORDER BY time DESC LIMIT 12) ORDER BY rowid";

       //  first row only
       db.all(sql, (err, rows) => {
         if (err) {
            reject(err);
         }
	
         rows.forEach((row) => {
               v_time.push({"tm":row.tm, "temper":row.temper});
           console.log(row.tm);
            console.log(row.temper);
       });
       
        resolve(v_time);
       
       });
       
         })
         .then((v_time) =>{
           if (v_time.length == 12) {
           console.log("v_time = 12");
           sendGraph0(v_time);
           db.close();
       }
       })
    })
       .catch((err)=>{
        console.error(err);
      });
  });
}, 1800000);


//-----------------------------------------------------------------------------------------------------

bot.onText(/\/start/, msg => { // функция обработки команды /start
  let ms_once; // начальное значение
  const chatId = msg.chat.id; // id чата
  console.log(msg);
  let flag = 0;

  let ms = "Здравствуйте! Здесь вы можете узнать текущую температуру в городе по данным БТИ АлтГТУ. Для того, чтобы узнать данные о погоде, введите /w. Для того, чтобы подписаться\/отписаться на обновление погоды, введите /f. Для получения графика погоды введите /p. Сейчас в Бийске ";

  let db = new sqlite3.Database('/home/Plex/weather-bot/db/bot.db', (err) => {
    if (err) {
      return console.error(err.message);
    }
    console.log('Connected to the in-memory SQlite database.');
  });
  let sql = 'SELECT t temp FROM temp_tbl WHERE ((strftime("%s","now", "localtime") - strftime("%s", temp_tbl.time)) < 20)';
  db.each(sql, (err, row) => {
    console.log("TRUE");
    if (err) {
      return console.error(err.message);
    }
    console.log(row + " " + row.temp);
    if (row) {
      if (row.temp > 0) bot.sendMessage(chatId, ms + "+" + row.temp + "°C", { "parse_mode": "Markdown" });
      else bot.sendMessage(chatId, ms + row.temp + "°C", { "parse_mode": "Markdown" });
      flag = 1;
    }
  });
    if (flag == 0) {
      console.log('No chat');
      // парсинг температуры, получение начального значения для сравнения с новыми значениями через промежуток времени
      request(URL, function (err, res, body) {
        if (err) throw err;
        console.log(res.statusCode);
        let $ = cheerio.load(body); // парсинг температуры
        ms_once = ($('html').text());
        ms_once = ms_once.replace(/\r|\n/g, ''); // удаление символа переноса строки
        ms_once = ms_once.replace('°C', ''); // удаление знака температуры для перевода в число
        ms_once = ms_once.replace(',', '.'); // замена запятой на точку для перевода в число
        parseFloat(ms_once);
        console.log(ms_once + " температура загруженная");
        if (ms_once > 0) {
          bot.sendMessage(chatId, ms + "+" + ms_once + "°C", { "parse_mode": "Markdown" });
        } else {
          bot.sendMessage(chatId, ms + ms_once + "°C", { "parse_mode": "Markdown" });
        }
      });
    }
      console.log('No chat');
      let sql3 = "INSERT INTO foll_tbl (chat_id, follow) SELECT * FROM (SELECT '" + chatId + "', 0) AS tmp WHERE NOT EXISTS (SELECT chat_id FROM foll_tbl WHERE chat_id = '" + chatId + "') LIMIT 1;";
      db.run(sql3, function (err) {
        if (err) {
          return console.log(err.message);
        }
        // get the last insert id
        console.log('A row has been inserted with rowid' + this.lastID);
        console.log('Change:' + this.changes);
      });
  db.close();
});




//------------------------------------------------------------------------------------------------

bot.onText(/\/w/, msg => {  // функция обработки команды пользователя

  const chatId = msg.chat.id;
  console.log(msg);
  let flag = 0;
  let db = new sqlite3.Database('/home/Plex/weather-bot/db/bot.db', (err) => {
    if (err) {
      return console.error(err.message);
    }
    console.log('Connected to the in-memory SQlite database.');
  });
  let sql = 'SELECT t temp FROM temp_tbl WHERE ((strftime("%s","now", "localtime") - strftime("%s", temp_tbl.time)) < 20)';
  db.each(sql, (err, row) => {
    if (err) {
      return console.error(err.message);
    }
    if (row) {
      if (row.temp > 0) bot.sendMessage(chatId, "*В Бийске* +" + row.temp + "°C", { "parse_mode": "Markdown" });
      else bot.sendMessage(chatId, "*В Бийске* " + row.temp + "°C", { "parse_mode": "Markdown" });
      flag = 1;
    }
  });

      if (flag == 0) {
      console.log('No chat');
      request(URL, function (err, res, body) {
        if (err) throw err;
        console.log(res.statusCode);
        let $ = cheerio.load(body);
        let ms = ($('html').text());
        ms = ms.replace(/\r|\n/g, '');
        ms = ms.replace('°C', '');
        ms = ms.replace(',', '.');
        parseFloat(ms);
        if (ms > 0) {
          bot.sendMessage(chatId, "*В Бийске* +" + ms + "°C", { "parse_mode": "Markdown" });
        } else {
          bot.sendMessage(chatId, "*В Бийске *" + ms + "°C", { "parse_mode": "Markdown" });
        }
      });
    }
  db.close();
});



//--------------------------------------------------------------------------------------------

bot.onText(/\/f/, msg => {  // функция обработки команды пользователя
  const chatId = msg.chat.id;
  let fol;
  console.log(msg);
  let db = new sqlite3.Database('/home/Plex/weather-bot/db/bot.db', (err) => {
    if (err) {
      return console.error(err.message);
    }
    console.log('Connected to the in-memory SQlite database.');
  });
  return new Promise((resolve, reject) => {
  let sql = "SELECT follow fol FROM foll_tbl WHERE chat_id='" + chatId + "'";
  db.each(sql, (err, row) => {
    if (err) {
      reject(err);
    }
    if (row) {
      console.log(row + " " + row.fol);
      fol = row.fol;
      resolve(fol);
    }
  });
})
  
  .then((fol) =>{
        if (fol == 0) {
        db.run("UPDATE foll_tbl SET follow=1 WHERE chat_id='" + chatId + "'", function (err) {
          if (err) {
            return console.log(err.message);
          }
          // get the last insert id
          console.log('A row has been updated with rowid' + this.lastID);
          console.log('Change:' + this.changes);

        });
        console.log("tsrlskdf");
        bot.sendMessage(chatId, '*Вы подписались на изменения температуры!*', { "parse_mode": "Markdown" });
      }
      else {
        db.run("UPDATE foll_tbl SET follow=0 WHERE chat_id='" + chatId + "'", function (err) {
          if (err) {
            return console.log(err.message);
          }

          // get the last insert id
          console.log('A row has been updated with rowid' + this.lastID);
          console.log('Change:' + this.changes);

        });
        bot.sendMessage(chatId, '*Вы отписались от изменений температуры!*', { "parse_mode": "Markdown" });
      }
    db.close();
    return 0;
  });
   
});


//--------------------------------------------------------------------------------------------

bot.onText(/\/p/, msg => {  // команда для отправки графика температуры
  const chatId = msg.chat.id;
  console.log(msg);

  bot.sendPhoto(chatId, "graph0.png", {
  caption: "График погоды за 6 часов"
});
console.log("Send graph");
});

//----------------------------------------------------------------------------------------------------------


bot.on('message', msg => {
  const user = msg.chat.username;
  let mes = msg.text;
  let db = new sqlite3.Database('/home/Plex/weather-bot/db/bot.db', (err) => {
    if (err) {
      return console.error(err.message);
    }
    console.log('Connected to the in-memory SQlite database.');
  });
  let sql = "INSERT INTO mes_tbl(user, time, mes) VALUES('" + user + "', datetime('now','localtime'),  '" + mes + "' )";
  db.run(sql, function (err) {
    if (err) {
      return console.log(err.message);
    }
    // get the last insert id
    console.log('A row has been inserted with rowid' + this.lastID);
    console.log('Change:' + this.changes);

  });
 db.close();
});





