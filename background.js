// colors
UP      = '#33cc66';
STAY    = 'blue';
DOWN    = '#ff2741';
ERROR   = 'black';

// pixel measures
var w = 15,
    h = 10,

// starting pixel for each positon used for 1,7,30 day icons
    POS1 = 4,
    POS2 = 9,
    POS3 = 14,

    // query used to retrieve latest price (15min delay)
    queryLatest     = 'https://blockchain.info/ticker?cors=true',

    // query used to return 1 day, 7 day, and 30 day averages in USD (returns all currencies)
    queryAverages   = 'http://api.bitcoincharts.com/v1/weighted_prices.json',

    // query used to return last month of daily prices for graphing purposes
    queryHistory    = 'https://api.coindesk.com/v1/bpi/historical/close.json';

// main
function Bitcoins () {
    var s = this;

    var data = {
        hour: {
            average: 0,
            change: 0
        },
        day: {
            average: 0,
            change: 0
        },
        week: {
            average: 0,
            change: 0
        },
        month: {
            average: 0,
            change: 0
        },
        currentPrice: -1
    }

    s.getPrices = function () {
        return data.currentPrice != -1 ? data : -1;
    }

    // updates 1,7 and 30 day averages
    var updateAverages = function (callback) {

        $.get(queryAverages,function(newData) {

            console.log('updated averages.');

            var usd = $.parseJSON(newData)['USD'];

            data.day.average = usd['24h'];
            data.week.average = usd['7d'];
            data.month.average = usd['30d'];

            // if callback provided, execute it
            if(typeof callback != 'undefined') callback();

        });
    }

    // updates the historical data used for graphing
    s.queryHistory = function (callback) {
        console.log('queryHistory');
        // JSON response is incorrectly formatted therefore I have to
        // handle error case and reparse the responseText manuallyk
        $.get(queryHistory, function (newData) {

            console.log('queryHistory/succ');
            console.log(newData);

        }).fail( function (err) {
            console.log('queryHistory/err');
            console.log(err.error());

            var res = err.responseText;

            res2 = JSON.parse(res);
            console.log(res2);
            res = res.split('{"bpi":{')[1];
            res = res.split('},"disclaimer"')[0];
            res = res.split(',');

            var obj = {
                values: []
            };
            res.forEach( function (ea) {
                var item = {};
                var kv = ea.split(':');
                item.x = new Date(kv[0].slice(1,kv[0].length-1)).getTime()/1000;
                item.y = parseInt(kv[1]);
                obj.values.push(item);
            });

            callback(obj);
        });


    }

    // gets latest price (delayed 15min)
    updateCurrent = function () {

        $.get(queryLatest,function(newData) {

            console.log('updated latest.');
            console.log(newData);

            newCurrent(newData);

        }).fail(function(err) {

             var res = err.responseText;

             var r1 = res.slice(0,res.length - 6);
             var r2 = res.slice(res.length - 5, res.length);

             res = r1 + r2;

             var newData = JSON.parse(res);

             newCurrent(newData);
         });
    }

    function newCurrent(newData) {

        data.currentPrice = newData['USD']['15m'];

        data.day.change     = data.currentPrice - data.day.average;
        data.week.change    = data.currentPrice - data.week.average;
        data.month.change   = data.currentPrice - data.month.average;

        drawIcon(data);
    }


    // initial
    updateAverages(updateCurrent);

    // update current price every minute
    setInterval(function() {
        console.log('updating latest...');
        updateCurrent();
    }, 60000);

    // update averages every 30min
    setInterval(function() {
        console.log('updating averages...');
        updateAverages();
    }, 1800000);

};

// redraw icon with updated price information
function drawIcon(updates) {

    var canvas  = document.getElementById('canvas');
    var ctx     = canvas.getContext('2d');

    ctx.clearRect(0,0,50,50);
    ctx.rect(0,0,50,50);
    ctx.fillStyle = "rgba(3,30,3,0.8)";
    ctx.fill();
    ctx.stroke();

    // draw to the canvas...
    updates.day.change < 0 ?    down(ctx,1) : up(ctx,1);
    updates.week.change < 0 ?   down(ctx,2) : up(ctx,2);
    updates.week.change < 0 ?   down(ctx,3) : up(ctx,3);

    // round to integer for badge price
    var price = updates.currentPrice.toFixed(0);

    // if the number if 4 digits or more use smaller font px
    ctx.font = price.toString().length > 3 ? "8px Helvetica Neue" : "10px Helvetica Neue";

    // set badge using price info
    chrome.browserAction.setBadgeBackgroundColor({ color: UP });
    chrome.browserAction.setBadgeText({text: updates.currentPrice.toFixed(0).toString()});

    // set icon using canvas image
    var imageData = ctx.getImageData(0, 0, 19, 19);
    chrome.browserAction.setIcon({
        imageData: imageData
    });

}
// draws icon used for price increase
function up(ctx,pos) {

    var x = pos == 1? POS1 : pos == 2? POS2 : POS3;
    ctx.fillStyle = UP;
    ctx.beginPath();
    ctx.moveTo(x,h);
    ctx.lineTo(x,h-7);
    ctx.lineTo(x+2,h-7);
    ctx.lineTo(x+2,h);
    ctx.closePath();
    ctx.fill();

}

// draws icon used for price decrease
function down(ctx,pos) {

    var x = pos == 1? POS1 : pos == 2? POS2 : POS3;
    ctx.fillStyle = DOWN;
    ctx.beginPath();
    ctx.moveTo(x,h);
    ctx.lineTo(x,h-7);
    ctx.lineTo(x+2,h-7);
    ctx.lineTo(x+2,h);
    ctx.closePath();
    ctx.fill();

}

// init
bitcoins = new Bitcoins();
