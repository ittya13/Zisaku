// OpenWeatherMapのAPIエンドポイント（実際のAPIキーを使用してください）
const openWeatherMapAPI = "https://api.openweathermap.org/data/2.5/weather";
const apiKey = "6d3cf7ab4e8307c3f4f9f5722b8e6675"; // ここにOpenWeatherMapのAPIキーを設定してください

// 地図を初期化
const map = L.map("map").setView([0, 0], 2);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);

// リアルタイムデータの取得と表示
function updateWeatherData() {
    // 任意の場所の座標を設定（例: パリ）
    const latitude = 48.8566;
    const longitude = 2.3522;

    // OpenWeatherMap APIへのリクエストを構築
    const requestUrl = `${openWeatherMapAPI}?lat=${latitude}&lon=${longitude}&appid=${apiKey}`;

    $.get(requestUrl, function (data) {
        // データの処理とマーカーの表示を行うコードをここに追加
        const temperature = data.main.temp;
        const description = data.weather[0].description;

        // マーカーを作成して地図上に表示
        L.marker([latitude, longitude])
            .bindPopup(`Temperature: ${temperature}°C<br>Description: ${description}`)
            .addTo(map);
    });
}

// リアルタイムデータの更新間隔（ミリ秒）
const updateInterval = 600000; // 10分

// 一定の間隔でリアルタイムデータを更新
updateWeatherData(); // 初回実行
setInterval(updateWeatherData, updateInterval);
