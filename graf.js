const ChartjsNode = require('chartjs-node');

 

/**

 * функция sendTo как Promise, чтобы удобно было строить цепочки

 */

 



 

// константы для цветов

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

 

/**

 * функция рисования и сохранения картинки в файл

 *  параметры:

 *  @param config - конфигурация графика для рисования

 *  @param filename - имя файла для сохранения

 *  результат:

 *  @param Promise - успешное сохранение файла

 */

 

function doDraw(config, filename) {

    // создадим полотно с размером 640x480 пикселей

    var chartNode = new ChartjsNode(640, 480);

    return chartNode.drawChart(config)

        .then(() => {

            // запишем результат в файл

            return chartNode.writeImageToFile('image/png', filename);

        });

}

 

/**

 * функция подготовки параметров для ChartJS.

 *  результат:

 *  @param Promise - успешная подготовка параметров

 */

 

function prepareDraw0(){

    // переменная, куда сохраним данные

    var пример;

    // создадим Promise сборки данных и конфигурации

    return new Promise((resolve, reject)=>{resolve()})

        // здесь могут быть много шагов сбора данных, прежде чем перейти к графику

        .then(()=>{

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

    					label: 'тест',

    					// цвет

    					backgroundColor: chartColors.black,

    					borderColor: chartColors.black,

    					// размер точек

    					pointRadius: 3,

    					// ширина линии графика

    					borderWidth: 3,

    					// достанем данные из переменной 'пример' и оставим только значение и время изменения

    					data: пример.map((item) => {

    					    return {y: item.val, t: new Date(item.ts)}

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

function sendGraph0(){

    // имя файла, в который положим картинку с графиком

    const filename = '/tmp/graph0.png';

    // выполним подготовку данных 

    prepareDraw0()

        // на след шаге нарисуем

        .then((result) => {

            // рисуем картинку по полученным данным и конфигурации

            return doDraw(result, filename);

        })


        .catch((err)=>{

            console.error(err);

        });

}

 