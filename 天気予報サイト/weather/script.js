var API_KEY = '23787320c06b88b6ca7aebb6921f3885';
var defaultCity = 'Tokyo';

function currentWeather() {
    $.ajax({
        url: 'https://api.openweathermap.org/data/2.5/weather?q=' + defaultCity + ',jp&units=metric&appid=' + API_KEY,
        dataType: 'json',
        type: 'GET'
    })
    .done(function (data) {
        getWeatherData(data);
        createDate(city.date);
        getDiscription(city.description);
        domWeatherWrite();
    })
    .fail(function (data) {
        console.log('Failed to fetch current weather.');
    });
}

function threeWeather() {
    $.ajax({
        url: 'https://api.openweathermap.org/data/2.5/forecast?q=' + defaultCity + ',jp&units=metric&appid=' + API_KEY,
        dataType: 'json',
        type: 'GET'
    })
    .done(function (data) {
        var insertHTML = '';
        for (var i = 0; i <= 12; i++) {
            insertHTML += domThreeWeatherWrite(data, i);
        }
        $('#weather-report').html(insertHTML);

        $('.weather-reportItem').click(function () {
            var targetNum = $(this).index();
            getWeatherData(data.list[targetNum]);
            createDate(new Date(data.list[targetNum].dt * 1000));
            getDiscription(city.description);
            domWeatherWrite();
            $('body, html').animate({
                scrollTop: 0
            }, 300, 'linear');
        })
    })
    .fail(function (data) {
        console.log('Failed to fetch 3-hour weather forecast.');
    });
}

function weatherInit() {
    currentWeather();
    threeWeather();
}

weatherInit();
