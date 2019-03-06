
var request = require('request');
var cheerio = require('cheerio');
const TelegramBot = require('node-telegram-bot-api');

const token = '649186539:AAEyUL40_QmEK4MqmiZOnFo8qiL4ADJp9YE';

const bot = new TelegramBot(token, {polling: true});

const URL = 'http://www.bti.secna.ru/web-thermo/index.shtml';


bot.onText(/\/start/, (msg, match) => {

  const chatId = msg.chat.id;
 
   var ms = "Здравствуйте! Здесь вы можете узнать текущую температуру в городе по данным БТИ АлтГТУ.";
    
    bot.sendMessage(chatId, ms, {
      "parse_mode": "Markdown",
      "reply_markup": {
          "ReplyKeyboardMarkup": {
              "keyboard": [
                  ['Yes'],
                  ['No']
              ]
          }
      }
  });
});

bot.onText(/\/weather/, (msg, match) => {

  const chatId = msg.chat.id;
   request(URL, function (err, res, body) {
    if (err) throw err;
      // console.log(body);
    console.log(res.statusCode);
    // console.log(match);
    var $ = cheerio.load(body);
    // $('html') = $('html').replace(/\r|\n/g, '');
    var ms = ($('html').text());
    ms = ms.replace(/\r|\n/g, '');
    // console.log(ms);

    bot.sendMessage(chatId, ms);
}); 
});



