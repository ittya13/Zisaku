// OpenWeatherMap APIのエンドポイント
const weatherApiUrl = 'https://api.openweathermap.org/data/2.5';
const apiKey = 'YOUR_API_KEY'; // OpenWeatherMapから取得したAPIキーを入力してください

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
async function displayWeather() {
  const todayWeather = await fetchTodayWeather();
  const weeklyWeather = await fetchWeeklyWeather();

  // 今日の天気を表示
  const todayWeatherDiv = document.getElementById('todayWeather');
  todayWeatherDiv.innerHTML = `<pre>${JSON.stringify(todayWeather, null, 2)}</pre>`;

  // 1週間の天気を表示
  const weeklyWeatherDiv = document.getElementById('weeklyWeather');
  weeklyWeatherDiv.innerHTML = `<pre>${JSON.stringify(weeklyWeather, null, 2)}</pre>`;
}

// ページが読み込まれたときに天気情報を表示
window.onload = displayWeather;
