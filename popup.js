var BGP = chrome.extension.getBackgroundPage();
var bitcoins = BGP.bitcoins;
var month = 30 * 24 * 60 * 60;

// loader
$('#content').append('<img id="loading" src="loader.gif" />');

// on load
document.addEventListener('DOMContentLoaded', function () {

    // grab bitcoin data from background
    var data = bitcoins.getPrices();

    // get historical data and draw the chart
    bitcoins.queryHistory(drawChart);

    // print details
    printPrices(data);
});


function printPrices(updates) {

    if(updates.currentPrice != -1 && typeof updates.currentPrice != 'undefined') {

        $('#content').empty();
        $('<div>').appendTo('#content')
            .html('<b>BTC</b> <span class="money2">$</span>' + updates.currentPrice.toFixed(2))
            .attr('id','currentPrice');

        addUpdate('day',updates.day);
        addUpdate('week',updates.week);
        addUpdate('month',updates.month);
    }

}

function addUpdate(text,data) {

    var average = parseInt(data.average);
    var div = $('<div class="sector">')
        .css({color: color(data.change) })
        .html('<div class="price"><span class="money">$</span>' + Math.abs(parseFloat(average.toFixed(2))) + '</div>'
            + '<div class="priceLabel">' + text + '</div>')
        .appendTo('#content');
}

// gets the sign of a value as 1,0,-1
function sign(x) { return x ? x < 0 ? -1 : 1 : 0; }

//gets the color based on the sign using the color globals for UP and DOWN defined in background.js
function color(num) { return sign(num) > 0 ? BGP.UP : sign(num) < 0 ? BGP.DOWN : BGP.STAY; }

// draws chart using the Highcharts library
function drawChart(data) {

    var prices = [];
    for(var i = 0; i < data.values.length; i++) {
        prices.push(parseInt(data.values[i]['y']));
    }

    var chart = new Highcharts.Chart({
        chart: {
            renderTo: $('#chart')[0],
            zoomType: 'x',
            spacingRight: 20,
            backgroundColor:'rgba(255, 255, 255, 0)',
            style: {
                cursor: 'ew-resize'
            },
            resetZoomButton: {
                theme: {
                    display: 'none'
                }
            }
        },
        title: {
            text: null
        },
        subtitle: {
            text: null
        },
        xAxis: {
            type: 'datetime',
            maxZoom: 3 * 24 * 3600000, // fourteen days
            title: {
                text: null
            },
            lineWidth: 0,
            minorGridLineWidth: 0,
            lineColor: 'grey',
            labels: {
                enabled: true,
                style: {
                    color: 'white',
                    fontSize: '8px'
                }
            },
            minorTickLength: 0,
            tickLength: 0
        },
        yAxis: {
            min: 0,
            title: {
                text: null
            },
            lineWidth: 0,
            minorGridLineWidth: 0,
            lineColor: 'transparent',
            labels: {
                enabled: true,
                style: {
                    color: 'white',
                    fontSize: '8px'
                }
            },
            minorTickLength: 0,
            tickLength: 0,
            gridLineColor: 'transparent'
        },
        drilldown: {
            activeAxisLabelStyle: {
                cursor: 'pointer',
                color: 'red',
                fontWeight: 'bold',
                textDecoration: 'underline'
            }
        },
        tooltip: {
            shared: true,
            style: {
                color: 'black',
                opacity: 1.0,
                background: 'white',
                fontSize: '12px',
                textColor: 'black',
                padding: '8px'

            }
        },
        legend: {
            enabled: false
        },
        plotOptions: {
            area: {
                fillColor:'rgba(255, 255, 255, 0)',
                lineWidth: 1,
                marker: {
                    enabled: false
                },
                shadow: false,
                states: {
                    hover: {
                        lineWidth: 1
                    }
                },
                threshold: null
            }
        },

        series: [{
            type: 'area',
            name: 'USD',
            pointInterval: 24 * 3600 * 1000,
            pointStart: data.values[0]['x']*1000,
            data: prices,
            color: {
                    linearGradient: { x1: 0, y1: 0, x2: 0, y2: 2},
                    stops: [
                        [0, 'white'],
                        [1, 'white']
                    ]
                }
        }]
    });

    $('tspan').text('');
    $('#resetZoom').click(function() {
        chart.zoomOut();
    });

    var d = new Date().getTime();
    chart.xAxis[0].setExtremes((d - month), d);

}


