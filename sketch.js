let capture;
let handPose;
let hands = [];
let gesture = "等待辨識...";

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
  image(capture, x, y, w, h);

  // 繪製手部關鍵點
  for (let i = 0; i < hands.length; i++) {
    let hand = hands[i];
    for (let j = 0; j < hand.keypoints.length; j++) {
      let keypoint = hand.keypoints[j];
      fill(0, 255, 0); // 設置關鍵點顏色為綠色
      noStroke();
      // 將原始影像座標 (640x480) 映射到畫布上的顯示區域 (x, y, w, h)
      let px = map(keypoint.x, 0, 640, x, x + w);
      let py = map(keypoint.y, 0, 480, y, y + h);
      circle(px, py, 10);
    }
  }
  pop();

  // 處理辨識結果
  if (hands.length > 0) {
    gesture = checkGesture(hands[0]);
  } else {
    gesture = "請將手伸入畫面";
  }

  // 顯示結果文字
  fill(0);
  textSize(48);
  textAlign(CENTER, CENTER);
  text(gesture, width / 2, y + h + 50);
}

function gotHands(results) {
  hands = results;
}

function checkGesture(hand) {
  // 取得關鍵點 (ml5 v1 使用 keypoints)
  let landmarks = hand.keypoints;
  
  // 簡易邏輯判斷手指是否伸直 (比較指尖與指節的 Y 座標)
  // 8:食指尖, 6:食指節 | 12:中指尖, 10:中指節 | 16:無名指尖, 14:無名指節 | 20:小指尖, 18:小指節
  let indexUp = landmarks[8].y < landmarks[6].y;
  let middleUp = landmarks[12].y < landmarks[10].y;
  let ringUp = landmarks[16].y < landmarks[14].y;
  let pinkyUp = landmarks[20].y < landmarks[18].y;
  
  // 剪刀石頭布邏輯判斷
  if (!indexUp && !middleUp && !ringUp && !pinkyUp) {
    return "石頭 ✊";
  } else if (indexUp && middleUp && ringUp && pinkyUp) {
    return "布 🖐️";
  } else if (indexUp && middleUp && !ringUp && !pinkyUp) {
    return "剪刀 ✌️";
  }
  
  return "辨識中...";
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
