let capture;
let handPose;
let hands = [];
let stars = [];

// 遊戲狀態：START_SCREEN, WAITING, THINKING, RESULT, ENDED
let gameState = "START_SCREEN";
let playerChoice = "";
let aiChoice = "";
let result = "";
let timerStart = 0;
let resultDisplayEmoji = "";
let wins = 0;
let losses = 0;
let ties = 0;
let navTimer = 0;
let lastNavGesture = "NONE";
let lastGesture = "NONE";
let gestureStableCount = 0; // 確保手勢穩定

const choices = ["石頭", "剪刀", "布"];
const emojiMap = { "石頭": "✊", "剪刀": "✌️", "布": "🖐️" };

function preload() {
  // 載入手勢辨識模型
  handPose = ml5.handPose();
}

function setup() {
  // 背景全螢幕
  createCanvas(windowWidth, windowHeight);
  // 擷取攝影機影像
  capture = createCapture(VIDEO);
  capture.size(640, 480);
  // 隱藏預設產生的影像元件，只在畫布上顯示
  capture.hide();
  
  // 初始化星空
  for (let i = 0; i < 400; i++) {
    stars.push(new Star());
  }

  // 開始持續偵測手部
  handPose.detectStart(capture, gotHands);
}

function draw() {
  // 深海藍星空背景
  background(10, 15, 30);
  
  // 繪製星空動畫
  for (let star of stars) {
    star.update();
    star.show();
  }

  let w = v(width * 0.5, 640); // 影像寬度取畫布一半，最大 640
  let h = w * 0.75;             // 比例 4:3
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
  // 設定發光效果
  drawingContext.shadowBlur = 10;
  drawingContext.shadowColor = '#00ffcc';
  
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

// 輔助函式：確保數值不超過上限
function v(val, maxVal) {
  return val > maxVal ? maxVal : val;
}

function handleGameLogic(x, y, w, h) {
  // 套用星空發光文字樣式
  drawingContext.shadowBlur = 15;
  drawingContext.shadowColor = 'rgba(255, 255, 255, 0.8)';
  
  let currentGesture = "NONE";
  if (hands.length > 0) {
    currentGesture = checkGesture(hands[0]);
  }

  // 1. 顯示上方計分板
  textSize(24);
  textAlign(LEFT, BOTTOM);
  drawingContext.shadowColor = '#00ff00';
  fill(150, 255, 150);
  text(`勝: ${wins}`, x, y - 15);
  
  textAlign(CENTER, BOTTOM);
  drawingContext.shadowColor = '#ffff00';
  fill(255, 255, 150);
  text(`平手: ${ties}`, x + w/2, y - 15);
  
  textAlign(RIGHT, BOTTOM);
  drawingContext.shadowColor = '#ff0000';
  fill(255, 150, 150);
  text(`敗: ${losses}`, x + w, y - 15);

  // 2. 處理遊戲狀態邏輯
  textAlign(CENTER, CENTER);
  fill(255);
  
  if (gameState === "START_SCREEN") {
    textSize(28);
    fill(200, 200, 255);
    text("準備開始：請比手勢 ☝️ (1) 開始遊戲", width / 2, y + h + 40);
    
    if (currentGesture === "ONE") {
      gameState = "WAITING";
    }
  }
  else if (gameState === "WAITING") {
    textSize(28);
    fill(255);
    text("遊戲開始：剪刀、石頭、布！", width / 2, y + h + 40);
    
    if (["石頭", "剪刀", "布"].includes(currentGesture)) {
      playerChoice = currentGesture;
      gameState = "THINKING";
      timerStart = millis();
    }
  } 
  else if (gameState === "THINKING") {
    // 顯示在畫面中間
    let elapsed = (millis() - timerStart) / 1000;
    let countdown = Math.ceil(3 - elapsed);
    
    textSize(48);
    fill(255, 215, 0); // 金色思考
    text(`AI 思考中... ${countdown}`, x + w/2, y + h/2);
    
    textSize(24);
    fill(180, 220, 255);
    text("系統判定中...", width / 2, y + h + 40);

    if (elapsed >= 3) {
      aiChoice = random(choices);
      determineWinner();
      gameState = "RESULT";
    }
  } 
  else if (gameState === "RESULT") {
    // 影像區域暗轉遮罩
    noStroke();
    fill(0, 0, 0, 160);
    rect(x, y, w, h);

    // 中間顯示雙方出拳與結果
    textSize(32);
    fill(255);
    text(`${result}`, x + w/2, y + h/2 - 50);
    
    textSize(64);
    text(`${emojiMap[playerChoice]} vs ${emojiMap[aiChoice]}`, x + w/2, y + h/2 + 20);
    
    textSize(20);
    fill(200);
    text(`(你出 ${playerChoice}，AI 出 ${aiChoice})`, x + w/2, y + h/2 + 75);
    
    // 顯示操作選項
    textSize(22);
    fill(200, 255, 200);
    text("👍 大拇指：繼續下一局  |  🤙 比 6：結束遊戲", width / 2, y + h + 40);

    // 導覽手勢判定與成功辨識提示
    if (currentGesture === "THUMBS_UP" || currentGesture === "SIX") {
      if (lastNavGesture !== currentGesture) {
        navTimer = millis();
        lastNavGesture = currentGesture;
      }

      let isContinue = currentGesture === "THUMBS_UP";
      let feedbackMsg = isContinue ? "繼續手勢成功辨識" : "結束手勢成功辨識";

      textSize(26);
      fill(0, 255, 255); // 青色發光感
      drawingContext.shadowColor = '#00ffff';
      text(feedbackMsg, width / 2, y + h + 80);

      if (millis() - navTimer > 1000) { // 成功辨識後停留 1 秒再動作
        gameState = isContinue ? "WAITING" : "ENDED";
        lastNavGesture = "NONE";
      }
    } else {
      lastNavGesture = "NONE";
    }
  } 
  else if (gameState === "ENDED") {
    background(0, 0, 0, 200);
    fill(255);
    textSize(48);
    text("遊戲結束", width / 2, height / 2);
    textSize(20);
    text("請重新整理網頁以開始", width / 2, height / 2 + 80);
  }
}

function determineWinner() {
  if (playerChoice === aiChoice) {
    result = "平手！ 🤝";
    ties++;
  } else if (
    (playerChoice === "石頭" && aiChoice === "剪刀") ||
    (playerChoice === "剪刀" && aiChoice === "布") ||
    (playerChoice === "布" && aiChoice === "石頭")
  ) {
    result = "你贏了！ 🎉";
    wins++;
  } else {
    result = "你輸了... 💀";
    losses++;
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

  // 0. 手勢 1 (只有食指伸直)
  if (indexUp && !middleUp && !ringUp && !pinkyUp && !thumbUp) {
    return "ONE";
  }
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

// 星空背景類別
class Star {
  constructor() {
    this.x = random(width);
    this.y = random(height);
    this.size = random(1, 3);
    this.t = random(TAU);
  }
  update() {
    this.t += 0.05;
    this.y += 0.2; // 緩慢向下飄動
    if (this.y > height) this.y = 0;
  }
  show() {
    let val = map(sin(this.t), -1, 1, 100, 255);
    fill(val);
    noStroke();
    circle(this.x, this.y, this.size);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
