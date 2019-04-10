var request = require('request');
var cheerio = require('cheerio');
const sqlite3 = require('sqlite3').verbose();
// const ChartjsNode = require('chartjs-node');

const chartColors = {

  black: 'rgb(0, 0, 0)',

red: 'rgb(255, 99, 132)',

orange: 'rgb(255, 159, 64)',

yellow: 'rgb(255, 205, 86)',

green: 'rgb(75, 192, 192)',

blue: 'rgb(54, 162, 235)',

purple: 'rgb(153, 102, 255)',

grey: 'rgb(201, 203, 207)'

};

function doDraw(config, filename) {

  // создадим полотно с размером 640x480 пикселей

  var chartNode = new ChartjsNode(640, 480);

  return chartNode.drawChart(config)

      .then(() => {

          // запишем результат в файл

          return chartNode.writeImageToFile('image/png', filename);

      });

}

function prepareDraw0(v_temp, v_time){

  // переменная, куда сохраним данные

  // var пример;

  // создадим Promise сборки данных и конфигурации

  return new Promise((resolve, reject)=>{resolve()})

      // здесь могут быть много шагов сбора данных, прежде чем перейти к графику

     /* .then(()=>{

          // произвольные данные, похожие на те, что хранятся в истории

          пример = [

              {"val":3,"ack":1,"ts":1539063874301},

              {"val":5,"ack":1,"ts":1539063884299},

              {"val":5.3,"ack":1,"ts":1539063894299},

              {"val":3.39,"ack":1,"ts":1539063904301},

              {"val":5.6,"ack":1,"ts":1539063914300},

              {"val":-1.3,"ack":1,"ts":1539063924300},

              {"val":-6.3,"ack":1,"ts":1539063934302},

              {"val":1.23,"ack":1,"ts":1539063944301},

          ];

      })*/

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

            data: v_temp.map((item) =>{
              v_time.map((el) => {
                return {t: new Date(el)}
              })
              return {y: item}
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

function sendGraph0(v_temp, v_time){

  // имя файла, в который положим картинку с графиком

  const filename = 'graph0.png';

  // выполним подготовку данных 

  prepareDraw0(v_temp, v_time)

      // на след шаге нарисуем

      .then((result) => {

          // рисуем картинку по полученным данным и конфигурации

          return doDraw(result, filename);

      })


      .catch((err)=>{

          console.error(err);

      });

}

const URL = 'http://www.bti.secna.ru/web-thermo/index.shtml'; // источник температуры
setInterval(function () {
request(URL, function (err, res, body) {
      if (err) throw err;
        // console.log(body);
      console.log(res.statusCode);
      // console.log(match);
      var $ = cheerio.load(body); // парсинг температуры
      var ms_once = ($('html').text());
      ms_once = ms_once.replace(/\r|\n/g, ''); // удаление символа переноса строки
      ms_once = ms_once.replace('°C', ''); // удаление знака температуры для перевода в число
      ms_once = ms_once.replace(',', '.'); // замена запятой на точку для перевода в число
      let db = new sqlite3.Database('./db/bot.db', (err) => {
        if (err) {
          return console.error(err.message);
        }
        console.log('Connected to the in-memory SQlite database.');
      });
      var sql = 'SELECT t temp FROM temp_tbl WHERE mark=1 ORDER BY time DESC LIMIT 1';
      db.each(sql, (err, row) => {
        if (err) {
          return console.error(err.message);
        }
        if (row) {
          console.log(row.temp);
            if (Math.abs(ms_once - row.temp) >= 5) {
              // bot.onText('*Температура в городе изменилась на пять градусов. Сейчас в Бийске *' + ms_last + '°C');
              console.log('В Бийске ' + ms_once);
              db.run('INSERT INTO temp_tbl(time, t, mark) VALUES(datetime("now","localtime"), ' + ms_once +', 1)', function(err) {
                if (err) {
                  return console.log(err.message);
                }
                
                // get the last insert id
                console.log('A row has been inserted with rowid' + this.lastID);
                console.log('Change:' + this.changes);
                
              });
            } else {
              console.log('Разница ' + Math.abs(ms_once - row.temp));
              db.run('INSERT INTO temp_tbl(time, t, mark) VALUES(datetime("now","localtime"), ' + ms_once +', 0)', function(err) {
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
      });;
var v_time = [];
var v_temp = [];
// SELECT * FROM (SELECT rowid, t FROM temp_tbl ORDER BY time DESC LIMIT 5) ORDER BY rowid;

// first row only
// db.each(sql, (err, row) => {
//   if (err) {
//     return console.error(err.message);
//   }
//   if (row) {
//     /*? console.log(row.tm, row.temper)*/ v_time.push(row.tm); v_temp.push(row.temper); /*console.log(znach);*/ }
//     /*:*/ else console.log('No chat');




 
// });

      db.close();
      // sendGraph0(v_temp, v_time);
    
      });
  }, 30000);

