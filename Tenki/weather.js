// OpenWeatherMap APIのエンドポイント
const weatherApiUrl = 'https://api.openweathermap.org/data/2.5';
const apiKey = '6d3cf7ab4e8307c3f4f9f5722b8e6675'; // OpenWeatherMapから取得したAPIキーを入力してください

// 今日の天気を取得する関数
async function fetchTodayWeather() {
  const response = await fetch(`${weatherApiUrl}/weather?q=Tokyo&appid=${apiKey}`);
  const data = await response.json();
  return data;
}

// 1週間の天気を取得する関数
async function fetchWeeklyWeather() {
  const response = await fetch(`${weatherApiUrl}/forecast?q=Tokyo&appid=${apiKey}`);
  const data = await response.json();
  return data;
}

// 天気情報を表示する関数
// 天気情報を表示する関数
async function displayWeather() {
  const todayWeather = await fetchTodayWeather();
  const weeklyWeather = await fetchWeeklyWeather();

  // 今日の天気を表示
  const currentWeather = todayWeather.weather[0].description;
  const todayWeatherDiv = document.getElementById('todayWeather');
  todayWeatherDiv.textContent = `現在の天気: ${currentWeather}`;

  // 1週間の天気を表示
  const weeklyWeatherDescription = weeklyWeather.list.map(item => item.weather[0].description);
  const weeklyWeatherDiv = document.getElementById('weeklyWeather');
  weeklyWeatherDiv.textContent = `1週間の天気: ${weeklyWeatherDescription.join(', ')}`;
}

// ページが読み込まれたときに天気情報を表示
window.onload = displayWeather;
