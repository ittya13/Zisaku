$(function() {
  // ユーザーの位置情報を取得
  if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(function(position) {
          var latitude = position.coords.latitude;
          var longitude = position.coords.longitude;
          getWeatherData(latitude, longitude);
      });
  } else {
      console.log("Geolocation is not available in this browser.");
  }
});

function getWeatherData(latitude, longitude) {
  var API_KEY = '377020f44773d84f61922c6f095cb890';
  var url = 'https://api.openweathermap.org/data/2.5/forecast?lat=' + latitude + '&lon=' + longitude + '&units=metric&APPID=' + API_KEY;
  
  $.ajax({
      url: url,
      dataType: "json",
      type: 'GET',
  })
  .done(function(data) {
      var insertHTML = "";
      var cityName = '<h2>' + data.city.name + '</h2>';
      $('#city-name').html(cityName);
      
      for (var i = 0; i <= 8; i = i + 2) {
          insertHTML += buildHTML(data, i);
      }
      
      $('#weather').html(insertHTML);
  })
  .fail(function(data) {
      console.log("失敗しました");
  });
}

function buildHTML(data, i) {
  var Week = new Array("（日）","（月）","（火）","（水）","（木）","（金）","（土）");
  var date = new Date(data.list[i].dt_txt);
  date.setHours(date.getHours() + 9);
  var month = date.getMonth() + 1;
  var day = month + "月" + date.getDate() + "日" + Week[date.getDay()] + date.getHours() + "：00";
  var icon = data.list[i].weather[0].icon;
  
  var html =
      '<div class="weather-report">' +
      '<img src="http://openweathermap.org/img/w/' + icon + '.png">' +
      '<div class="weather-date">' + day + '</div>' +
      '<div class="weather-main">' + data.list[i].weather[0].main + '</div>' +
      '<div class="weather-temp">' + Math.round(data.list[i].main.temp) + '℃</div>' +
      '</div>';
  return html;
}
