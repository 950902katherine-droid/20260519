let capture;
let handPose;
let hands = [];

// 遊戲狀態：WAITING, THINKING, RESULT, ENDED
let gameState = "WAITING";
let playerChoice = "";
let aiChoice = "";
let result = "";
let timerStart = 0;
let lastGesture = "NONE";
let gestureStableCount = 0; // 確保手勢穩定

const choices = ["石頭", "剪刀", "布"];
const emojiMap = { "石頭": "✊", "剪刀": "✌️", "布": "🖐️" };

function preload() {
  // 載入手勢辨識模型
  handPose = ml5.handPose();
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  // 擷取攝影機影像
  capture = createCapture(VIDEO);
  capture.size(640, 480);
  // 隱藏預設產生的影像元件，只在畫布上顯示
  capture.hide();
  
  // 開始持續偵測手部
  handPose.detectStart(capture, gotHands);
}

function draw() {
  background('#e7c6ff');

  let w = width * 0.5;
  let h = height * 0.5;
  let x = (width - w) / 2;
  let y = (height - h) / 2;

  push();
  // 左右顛倒處理 (鏡像)
  translate(width, 0);
  scale(-1, 1);
  // 在翻轉後的座標系中繪製影像以維持居中
  if (gameState !== "ENDED") {
    image(capture, x, y, w, h);
  }

  // 只有在遊戲未結束時才繪製骨架
  if (gameState !== "ENDED") {
    drawSkeleton(x, y, w, h);
  }
  pop();

  // 處理遊戲邏輯與 UI
  handleGameLogic(x, y, w, h);
}

function drawSkeleton(x, y, w, h) {
  for (let i = 0; i < hands.length; i++) {
    let hand = hands[i];
    let landmarks = hand.keypoints;

    // 繪製手部骨架線條
    stroke(0, 255, 0); // 綠色線條
    strokeWeight(3);

    // 定義骨架連接點 (MediaPipe Hand landmarks)
    const connections = [
      [0, 1], [1, 2], [2, 3], [3, 4], // 拇指
      [0, 5], [5, 6], [6, 7], [7, 8], // 食指
      [0, 9], [9, 10], [10, 11], [11, 12], // 中指
      [0, 13], [13, 14], [14, 15], [15, 16], // 無名指
      [0, 17], [17, 18], [18, 19], [19, 20], // 小指
      [5, 9], [9, 13], [13, 17] // 掌心連接
    ];

    for (let connection of connections) {
      let p1 = landmarks[connection[0]];
      let p2 = landmarks[connection[1]];

      // 映射座標
      let px1 = map(p1.x, 0, 640, x, x + w);
      let py1 = map(p1.y, 0, 480, y, y + h);
      let px2 = map(p2.x, 0, 640, x, x + w);
      let py2 = map(p2.y, 0, 480, y, y + h);

      line(px1, py1, px2, py2);
    }

    // 繪製手部關鍵點 (圓點)
    for (let j = 0; j < landmarks.length; j++) {
      let keypoint = landmarks[j];
      fill(255, 0, 0); // 紅色圓點
      noStroke();
      let px = map(keypoint.x, 0, 640, x, x + w);
      let py = map(keypoint.y, 0, 480, y, y + h);
      circle(px, py, 8); // 稍微縮小圓點半徑
    }
  }
}

function handleGameLogic(x, y, w, h) {
  let currentGesture = "NONE";
  if (hands.length > 0) {
    currentGesture = checkGesture(hands[0]);
  }

  textAlign(CENTER, CENTER);
  fill(0);
  
  if (gameState === "WAITING") {
    textSize(32);
    text("請出拳 (剪刀、石頭、布)", width / 2, y - 40);
    
    // 如果偵測到有效拳法，且維持穩定一段時間（避免誤觸）
    if (["石頭", "剪刀", "布"].includes(currentGesture)) {
      playerChoice = currentGesture;
      gameState = "THINKING";
      timerStart = millis();
    }
  } 
  else if (gameState === "THINKING") {
    let elapsed = (millis() - timerStart) / 1000;
    let countdown = Math.ceil(3 - elapsed);
    
    textSize(64);
    fill(255, 0, 0);
    text(`電腦思考中... ${countdown}`, width / 2, height / 2);
    
    if (elapsed >= 3) {
      aiChoice = random(choices);
      determineWinner();
      gameState = "RESULT";
    }
  } 
  else if (gameState === "RESULT") {
    // 顯示結果
    textSize(40);
    text(`玩家: ${emojiMap[playerChoice]}  VS  電腦: ${emojiMap[aiChoice]}`, width / 2, y - 60);
    textSize(80);
    text(result, width / 2, height / 2);
    
    // 顯示操作選項
    textSize(24);
    fill(50);
    text("👍 大拇指朝上：繼續下一局", width / 2, y + h + 40);
    text("🤙 比 6：結束遊戲", width / 2, y + h + 80);

    // 導覽手勢判定
    if (currentGesture === "THUMBS_UP") {
      gameState = "WAITING";
    } else if (currentGesture === "SIX") {
      gameState = "ENDED";
    }
  } 
  else if (gameState === "ENDED") {
    background('#2b2d42');
    fill(255);
    textSize(60);
    text("遊戲結束", width / 2, height / 2);
    textSize(24);
    text("請重新整理網頁以開始", width / 2, height / 2 + 80);
  }
}

function determineWinner() {
  if (playerChoice === aiChoice) {
    result = "平手！ 🤝";
  } else if (
    (playerChoice === "石頭" && aiChoice === "剪刀") ||
    (playerChoice === "剪刀" && aiChoice === "布") ||
    (playerChoice === "布" && aiChoice === "石頭")
  ) {
    result = "你贏了！ 🎉";
  } else {
    result = "你輸了... 💀";
  }
}

function gotHands(results) {
  hands = results;
}

function checkGesture(hand) {
  let landmarks = hand.keypoints;
  
  // 指尖與關鍵關節
  let thumbTip = landmarks[4];
  let thumbMcp = landmarks[2];
  let indexUp = landmarks[8].y < landmarks[6].y;
  let middleUp = landmarks[12].y < landmarks[10].y;
  let ringUp = landmarks[16].y < landmarks[14].y;
  let pinkyUp = landmarks[20].y < landmarks[18].y;
  let thumbUp = thumbTip.y < thumbMcp.y;

  // 1. 比 6 (大拇指和小指伸直，其他收起)
  if (thumbUp && !indexUp && !middleUp && !ringUp && pinkyUp) {
    return "SIX";
  }
  // 2. 大拇指朝上 (只有大拇指伸直)
  if (thumbUp && !indexUp && !middleUp && !ringUp && !pinkyUp) {
    return "THUMBS_UP";
  }
  // 3. 布 (四指皆伸直)
  if (indexUp && middleUp && ringUp && pinkyUp) {
    return "布";
  }
  // 4. 石頭 (四指皆收起)
  if (!indexUp && !middleUp && !ringUp && !pinkyUp) {
    return "石頭";
  }
  // 5. 剪刀 (食指與中指伸直)
  if (indexUp && middleUp && !ringUp && !pinkyUp) {
    return "剪刀";
  }

  return "NONE";
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
