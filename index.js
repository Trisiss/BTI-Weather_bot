
var request = require('request');
var cheerio = require('cheerio');
const TelegramBot = require('node-telegram-bot-api');

const token = ''; // токен бота

const bot = new TelegramBot(token, {polling: true});

const URL = 'http://www.bti.secna.ru/web-thermo/index.shtml'; // источник температуры

// var ms;
// exports.myWeatherTestBot = function telegramBot (req, res) {
  var msg = req.body;
bot.onText(/\/start/, (msg, match) => { // функция обработки команды /start
  var ms_once; // начальное значение
  const chatId = msg.chat.id; // id чата
 
    var ms = "Здравствуйте! Здесь вы можете узнать текущую температуру в городе по данным БТИ АлтГТУ. Для того, чтобы узнать данные о погоде введите /weather";
    
    bot.sendMessage(chatId, ms, {"parse_mode": "Markdown"}); // ответ пользователю
// парсинг температуры, получение начального значения для сравнения с новыми значениями через промежуток времени
    request(URL, function (err, res, body) {
      if (err) throw err;
        // console.log(body);
      console.log(res.statusCode);
      // console.log(match);
      var $ = cheerio.load(body); // парсинг температуры
       ms_once = ($('html').text());
      ms_once = ms_once.replace(/\r|\n/g, ''); // удаление символа переноса строки
      ms_once = ms_once.replace('°C', ''); // удаление знака температуры для перевода в число
      ms_once = ms_once.replace(',', '.'); // замена запятой на точку для перевода в число
    });
      setInterval(function() { // функция для повторения запроса температуры
        request(URL, function (err, res, body) {
          if (err) throw err;
            // console.log(body);
          console.log(res.statusCode);
          // console.log(match);
          var $ = cheerio.load(body);
          var ms_last = ($('html').text());
          ms_last = ms_last.replace(/\r|\n/g, '');
          ms_last = ms_last.replace('°C', '');
          ms_last = ms_last.replace(',', '.');
          parseFloat(ms_once);
          parseFloat(ms_last);
          // ms_once = 2;
          console.log("Начальная температура: " + ms_once);
          console.log("Новая температура: " + ms_last);
          console.log("Разница значений температуры: " + Math.abs(ms_once - ms_last));
          if (Math.abs(ms_once - ms_last) >= 5) { // сравнение предыдущей температуры с новым значением
            if (ms_last > 0) 
              bot.sendMessage(chatId, "*В Бийске* +" + ms_last + "°C", {"parse_mode":"Markdown"});
            else
              bot.sendMessage(chatId, "*В Бийске *" + ms_last + "°C", {"parse_mode":"Markdown"});
            ms_once = ms_last;
          }
      });
    }, 1800000);
      // console.log(ms_once);

});

bot.onText(/\/weather/, (msg, match) => {  // функция обработки команды пользователя

  const chatId = msg.chat.id;
  console.log(msg);
   request(URL, function (err, res, body) {
    if (err) throw err;
      // console.log(body);
    console.log(res.statusCode);
    // console.log(match);
    var $ = cheerio.load(body);
    // $('html') = $('html').replace(/\r|\n/g, '');
    var ms = ($('html').text());
    ms = ms.replace(/\r|\n/g, '');
    ms = ms.replace('°C', '');
    ms = ms.replace(',', '.');
    parseFloat(ms);
    // console.log(ms);
    if (ms > 0) {
      bot.sendMessage(chatId, "*В Бийске* +" + ms + "°C", {"parse_mode":"Markdown"});
    } else {
      bot.sendMessage(chatId, "*В Бийске *" + ms + "°C", {"parse_mode":"Markdown"});
    }
}); 
});
// }


