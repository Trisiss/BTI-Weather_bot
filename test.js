//curl -XPOST https://api.telegram.org/bot649186539:AAEyUL40_QmEK4MqmiZOnFo8qiL4ADJp9YE/setWebhook\?url\=https://us-central1-blissful-bonsai-234214.cloudfunctions.net/myWeatherTestBot

var request = require('request');
var cheerio = require('cheerio');
const TelegramBot = require('node-telegram-bot-api');

const token = ''; // токен бота

const bot = new TelegramBot(token, {polling: false});

const URL = 'http://www.bti.secna.ru/web-thermo/index.shtml'; // источник температуры


exports.myWeatherTestBot = function telegramBot (req, res) {
  // Логируем запрос (пригодится для отладки)
  console.log('Request body: ' + JSON.stringify(req.body));

  var Request = req.body;
  var message = req.body.message;

  if (typeof message.chat !== "undefined") { 
      var chat = message.chat;

      if (chat.type == "private") {
          // Это сообщение отправлено в личный чат с ботом
          
          // Из какого чата пришло сообщение и текст сообщения
          var chatId = chat.id;
          var messageText = message.text;

          switch (messageText) {
              // Обработка команд
              case '/start':
                  console.log('Processing command: ' + messageText);

                  var ms_once; // начальное значение
 
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
                        console.log(ms_once);
                        console.log(ms_last);
                        console.log(Math.abs(ms_once - ms_last));
                        if (Math.abs(ms_once - ms_last) >= 5) { // сравнение предыдущей температуры с новым значением
                          bot.sendMessage(chatId, "*Погода в городе по данным БТИ АлтГТУ *" + ms_last + "°C", {"parse_mode":"Markdown"});
                          ms_once = ms_last;
                        }
                    });
                  }, 1800000);
                    // console.log(ms_once);
                  
                  break;
                  case '/weather':
  // const chatId = msg.chat.id;
  console.log(message);
   request(URL, function (err, res, body) {
    if (err) throw err;
      // console.log(body);
    console.log(res.statusCode);
    // console.log(match);
    var $ = cheerio.load(body);
    // $('html') = $('html').replace(/\r|\n/g, '');
    var ms = ($('html').text());
    ms = ms.replace(/\r|\n/g, '');
    ms = ms.replace(',', '.');
    // console.log(ms);

    bot.sendMessage(chatId, "*Погода в городе по данным БТИ АлтГТУ *" + ms, {"parse_mode":"Markdown"});
}); 
break;
              
          }
      }
  }
  res.status(201).send('Done!');
}