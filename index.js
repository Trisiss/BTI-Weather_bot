const request = require('request');
const cheerio = require('cheerio');
const TelegramBot = require('node-telegram-bot-api');
const sqlite3 = require('sqlite3').verbose();


const token = ''; // токен бота

const bot = new TelegramBot(token, { polling: true });

const URL = 'http://www.bti.secna.ru/web-thermo/index.shtml'; // источник температуры


setInterval(function () { // функция для повторения запроса температуры
  request(URL, function (err, res, body) {
    if (err) throw err;
    // console.log(body);
    console.log(res.statusCode);
    // console.log(match);
    let $ = cheerio.load(body);
    let ms_last = ($('html').text());
    ms_last = ms_last.replace(/\r|\n/g, '');
    ms_last = ms_last.replace('°C', '');
    ms_last = ms_last.replace(',', '.');
    parseFloat(ms_last);
    let db = new sqlite3.Database('./db/bot.db', (err) => {
      if (err) {
        return console.error(err.message);
      }
      console.log('Connected to the in-memory SQlite database.');
    });
    let sql = 'SELECT t temp FROM temp_tbl WHERE mark=1 ORDER BY time DESC LIMIT 1';
    db.each(sql, (err, row) => {
      if (err) {
        return console.error(err.message);
      }
      if (row) {
        if (Math.abs(ms_last - row.temp) >= 5) {
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
              bot.onText(row.id, '*Температура в городе изменилась на пять градусов. Сейчас в Бийске *' + ms_last + '°C');
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
      }
      else console.log('No chat');
    });
    db.close();


    // ms_once = 2;
    // console.log("Начальная температура: " + ms_once);
    // console.log("Новая температура: " + ms_last);
    // console.log("Разница значений температуры: " + Math.abs(ms_once - ms_last));
    // if (Math.abs(ms_once - ms_last) >= 5) { // сравнение предыдущей температуры с новым значением
    //   if (ms_last > 0) 
    //     bot.sendMessage(chatId, "*В Бийске* +" + ms_last + "°C", {"parse_mode":"Markdown"});
    //   else
    //     bot.sendMessage(chatId, "*В Бийске *" + ms_last + "°C", {"parse_mode":"Markdown"});
    //   ms_once = ms_last;
    // }
  });
}, 120000);


//-----------------------------------------------------------------------------------------------------

bot.onText(/\/start/, (msg, match) => { // функция обработки команды /start
  let ms_once; // начальное значение
  const chatId = msg.chat.id; // id чата
  console.log(msg);
  let flag = 0;
  let flagfol = 0;

  let ms = "Здравствуйте! Здесь вы можете узнать текущую температуру в городе по данным БТИ АлтГТУ. Для того, чтобы узнать данные о погоде, введите /w. Для того, чтобы подписаться\/отписаться на обновление погоды, введите /f. Сейчас в Бийске ";

  // bot.sendMessage(chatId, ms, {"parse_mode": "Markdown"}); // ответ пользователю
  let db = new sqlite3.Database('./db/bot.db', (err) => {
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
      if (row.temp > 0) bot.sendMessage(chatId, ms + "+" + row.temp + "°C Из БД", { "parse_mode": "Markdown" });
      else bot.sendMessage(chatId, ms + row.temp + "°C Из БД", { "parse_mode": "Markdown" });
      flag = 1;
    }
  });
    /*else {*/ if (flag == 0) {
      console.log('No chat');
      // парсинг температуры, получение начального значения для сравнения с новыми значениями через промежуток времени
      request(URL, function (err, res, body) {
        if (err) throw err;
        // console.log(body);
        console.log(res.statusCode);
        // console.log(match);
        let $ = cheerio.load(body); // парсинг температуры
        ms_once = ($('html').text());
        ms_once = ms_once.replace(/\r|\n/g, ''); // удаление символа переноса строки
        ms_once = ms_once.replace('°C', ''); // удаление знака температуры для перевода в число
        ms_once = ms_once.replace(',', '.'); // замена запятой на точку для перевода в число
        parseFloat(ms_once);
        console.log(ms_once + " температура загруженная");
        if (ms_once > 0) {
          bot.sendMessage(chatId, ms + "+" + ms_once + "°C Загрузил", { "parse_mode": "Markdown" });
        } else {
          bot.sendMessage(chatId, ms + ms_once + "°C Загрузил", { "parse_mode": "Markdown" });
        }
      });
    }
  // });
  /*db.each("SELECT * FROM foll_tbl WHERE foll_tbl.chat_id='" + chatId + "'", (err, row) => {
    if (err) {
      return console.error(err.message);
    }
    if (row) {
      flagfol = 1;
    }
    // else {
  });*/
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
  // });
  db.close();
});




//------------------------------------------------------------------------------------------------

bot.onText(/\/w/, (msg, match) => {  // функция обработки команды пользователя

  const chatId = msg.chat.id;
  console.log(msg);
  let flag = 0;
  let db = new sqlite3.Database('./db/bot.db', (err) => {
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
    // else {
      if (flag == 0) {
      console.log('No chat');
      request(URL, function (err, res, body) {
        if (err) throw err;
        // console.log(body);
        console.log(res.statusCode);
        let $ = cheerio.load(body);
        let ms = ($('html').text());
        ms = ms.replace(/\r|\n/g, '');
        ms = ms.replace('°C', '');
        ms = ms.replace(',', '.');
        parseFloat(ms);
        // console.log(ms);
        if (ms > 0) {
          bot.sendMessage(chatId, "*В Бийске* +" + ms + "°C", { "parse_mode": "Markdown" });
        } else {
          bot.sendMessage(chatId, "*В Бийске *" + ms + "°C", { "parse_mode": "Markdown" });
        }
      });
    }
  // });
  db.close();
});



//--------------------------------------------------------------------------------------------

bot.onText(/\/f/, (msg, match) => {  // функция обработки команды пользователя
  let flag = 0;
  const chatId = msg.chat.id;
  console.log(msg);
  let db = new sqlite3.Database('./db/bot.db', (err) => {
    if (err) {
      return console.error(err.message);
    }
    console.log('Connected to the in-memory SQlite database.');
  });
  let sql = "SELECT follow fol FROM foll_tbl WHERE chat_id='" + chatId + "'";
  db.each(sql, (err, row) => {
    if (err) {
      return console.error(err.message);
    }
    if (row) {
      console.log(row + " " + row.fol);
      if (row.fol == 0) {
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
    } else console.log('No chat');
  });
  db.close();
});

//----------------------------------------------------------------------------------------------------------


bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const user = msg.chat.username;
  let mes = msg.text;
  mes = mes.replace('/', '');
  let db = new sqlite3.Database('./db/bot.db', (err) => {
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
 // db.close();
  // send a message to the chat acknowledging receipt of their message
  // bot.sendMessage(chatId, 'Неизвестная команда.');
});

// bot.on('polling_error', (error) => {
//   console.log(error.code);  // => 'EFATAL'
// });


