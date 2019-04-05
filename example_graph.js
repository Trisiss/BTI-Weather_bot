'use strict';

const ChartjsNode = require('chartjs-node');

 

/**

 * функция sendTo как Promise, чтобы удобно было строить цепочки

 */

 

function sendToPromise(adapter, cmd, params) {

    return new Promise((resolve, reject) => {

        sendTo(adapter, cmd, params, (result) => {

            resolve(result);

        });

    });

}

 

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

 

/**

 * функция подготовки параметров для ChartJS.

 * собирает данные из истории и складывает их в переменные, 

 * чтобы потом включить в ряды.

 * 

 *  параметры:

 *  @param hours - количество часов, за которые получить данные

 *  результат:

 *  @param Promise - успешная подготовка параметров

 */

 

function prepareDraw1(hours){

    // вычислим интервал времени, за который надо получить данные

    const end = new Date().getTime(),

          start = end - 3600000*(hours || 1); // 1 = час назад

 

    // зададим переменные, в которые будем складывать результаты запроса

    // исторических данных

    var улица, куры2, куры1, куры2свет, куры2вент;

 

    // создадим Promise сборки данных и конфигурации

    return new Promise((resolve, reject)=>{resolve()})

        // на этом шаге собираем историю по 'mqtt.0.ESP_Easy.Улица.Temperature'

        .then(() => {

            return sendToPromise('history.0', 'getHistory', {

                    id: 'mqtt.0.ESP_Easy.Улица.Temperature',

                    options: {

                        start: start,

                        end: end,

                        aggregate: 'onchange'

                    }

                }

            ).then((result) => {

                // записываем результат в переменную 'улица'

                улица = result.result;

            });

        })

        // на этом шаге собираем историю по 'sonoff.0.chicken2.DS18B20_Temperature'

        .then(() => {

            return sendToPromise('history.0', 'getHistory', {

                id: 'sonoff.0.chicken2.DS18B20_Temperature',

                options: {

                    start: start,

                    end: end,

                    aggregate: 'onchange'

                }

            }).then((result)=>{

                // записываем результат в переменную 'куры2'

                куры2 = result.result;

            });

        })

        .then(() => {

            return sendToPromise('history.0', 'getHistory', {

                id: 'sonoff.0.sonoff_chicken_vent.DS18B20_Temperature',

                options: {

                    start: start,

                    end: end,

                    aggregate: 'onchange'

                }

            }).then((result)=>{

                куры1 = result.result;

            });

        })

        .then(() => {

            return sendToPromise('history.0', 'getHistory', {

                id: 'sonoff.0.chicken2.POWER1',

                options: {

                    start: start,

                    end: end,

                    aggregate: 'onchange'

                }

            }).then((result)=>{

                куры2свет = result.result;

            });

        })

        .then(() => {

            return sendToPromise('history.0', 'getHistory', {

                id: 'sonoff.0.chicken2.POWER2',

                options: {

                    start: start,

                    end: end,

                    aggregate: 'onchange'

                }

            }).then((result)=>{

                куры2вент = result.result;

            });

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

    			        // заголовок ряда с указанием последнего значения из ряда в скобках

    					label: 'Улица ('+улица[улица.length - 1].val+')',

    					// цвет

    					backgroundColor: chartColors.blue,

    					borderColor: chartColors.blue,

    					// размер точек. 0 - нет точки

    					pointRadius: 0,

    					// ширина линии графика

    					borderWidth: 3,

    					// достанем данные из переменной 'улица' и оставим только значение и время изменения

    					data: улица.map((item) => {

    					    return {y: item.val, t: new Date(item.ts)}

    					}),

    					// заливка графика - нет

    					fill: false,

    					// идентификатор оси Y

    					yAxisID: 'y-axis-1',

    			    },{

    					label: 'Куры 1 ('+куры1[куры1.length - 1].val+')',

    					backgroundColor: chartColors.green,

    					borderColor: chartColors.green,

    					pointRadius: 0,

    					borderWidth: 3,

    					data: куры1.map((item) => {

    					    return {y: item.val, t: new Date(item.ts)}

    					}),

    					fill: false,

    					yAxisID: 'y-axis-1',

    				},{

    					label: 'Куры 2 ('+куры2[куры2.length - 1].val+')',

    					backgroundColor: chartColors.red,

    					borderColor: chartColors.red,

    					pointRadius: 0,

    					borderWidth: 3,

    					data: куры2.map((item) => {

    					    return {y: item.val, t: new Date(item.ts)}

    					}),

    					fill: false,

    					yAxisID: 'y-axis-1',

    				},{

    					label: 'Куры 2 свет ('+куры2свет[куры2свет.length - 1].val+')',

    					backgroundColor: chartColors.yellow,

    					borderColor: chartColors.yellow,

    					pointRadius: 0,

    					borderWidth: 1,

    					data: куры2свет.map((item) => {

    					    return {y: (item.val) ? 1 : 0, t: new Date(item.ts)}

    					}),

    					fill: true,

    					lineTension: 0,

		                steppedLine: true,

    					yAxisID: 'y-axis-2',

    				},{

    					label: 'Куры 2 вент ('+куры2вент[куры2вент.length - 1].val+')',

    					backgroundColor: chartColors.grey,

    					borderColor: chartColors.grey,

    					pointRadius: 0,

    					borderWidth: 1,

    					data: куры2вент.map((item) => {

    					    return {y: (item.val) ? -1 : 0, t: new Date(item.ts)}

    					}),

    					fill: true,

    					lineTension: 0,

		                steppedLine: true,

    					yAxisID: 'y-axis-2',

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

    						// настройка формата оси (времени)

    						time: {

    						    unit: 'minute',

    						    displayFormats: {

                                    minute: 'HH:mm'

                                }

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

    						// расположение линейки - слева

    						position: 'left',

    						// идентификатор оси

    						id: 'y-axis-1',

    					},{

    					    type: 'linear',

    					    display: true,

    						scaleLabel: {

    							display: true,

    							labelString: 'Свет и вентиляция'

    						},

    						ticks: {

    							min: -4,

    							max: 2

    						},

    						// расположение линейки - справа

    						position: 'right',

    						id: 'y-axis-2',

        				}]

    				}

    			}

			};

			return chartJsOptions;

        });

}

 

function sendGraph0(user){

    // имя файла, в который положим картинку с графиком

    const filename = '/tmp/graph0.png';

    // выполним подготовку данных 

    prepareDraw0()

        // на след шаге нарисуем

        .then((result) => {

            // рисуем картинку по полученным данным и конфигурации

            return doDraw(result, filename);

        })

        .then(()=>{

            // теперь отправим сообщение в телеграм

            sendTo('telegram.0', {

                user: user, 

                text: filename, 

                caption: 'Пример графика',

            });

        })

        .catch((err)=>{

            console.error(err);

        });

}

 

/**

 * функция отправки графика в телеграм

 * @param user - какому юзеру слать. если пусто - всем

 * @param chat_id - 

 * @param message_id - в каком чате и какое сообщение заменить при обновлении

 * @param hours - количество часов, за которые получить данные

 */

 

function sendGraph1(user, chat_id, message_id, hours){

    // имя файла, в который положим картинку с графиком

    const filename = '/tmp/graph1.png';

    hours = hours || 1;

    // выполним подготовку данных 

    prepareDraw1(hours)

        // на след шаге нарисуем

        .then((result) => {

            // рисуем картинку по полученным данным и конфигурации

            return doDraw(result, filename);

        })

        .then(() => {

            // удалим предыдущее сообщение

            if (message_id && chat_id) {

                sendTo('telegram', {

                    user: user,

                    deleteMessage: {

                        options: {

                            chat_id: chat_id, 

                            message_id: message_id

                        }

                    }

                });

            }

        })

        .then(()=>{

            // теперь отправим сообщение в телеграм

            sendTo('telegram.0', {

                user: user, 

                text: filename, 

                caption: 'Температура в курятниках ('+hours+'ч)',

                reply_markup: {

                    inline_keyboard: [

                        [

                            { text: '🔄', callback_data: 'graph_'+hours},

                            { text: '1 ч', callback_data: 'graph_1' },

                            { text: '2 ч', callback_data: 'graph_2' },

                            { text: '4 ч', callback_data: 'graph_4' },

                            { text: '12 ч', callback_data: 'graph_12' },

                            { text: '24 ч', callback_data: 'graph_24' },

                        ]

                    ]

                }

            });

        })

        .catch((err)=>{

            console.error(err);

        });

}

 

// будем слушать телеграм и ждать команды на построение графика

on({id: "telegram.0.communicate.request", ack: false, change: 'any'}, function (obj) {

    var v;

    var msg = obj.state.val;

    var command = obj.state.val.substring(obj.state.val.indexOf(']')+1);

    var user = obj.state.val.substring(obj.state.val.indexOf('[')+1,obj.state.val.indexOf(']'));

    var chat_id = getState("telegram.0.communicate.requestChatId").val;

    var message_id = getState("telegram.0.communicate.requestMessageId").val;

 

    // команда для графика - demo

    if (command == 'demo') {

        sendGraph0(user);

    }

    // команда для графика - graph

    if (command.startsWith('graph')) {

        const hours = parseInt(command.split('_')[1]);

        sendGraph1(user, chat_id, message_id, hours);

    }

});