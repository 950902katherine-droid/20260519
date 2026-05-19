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
  pop();

  // 辨識邏輯和文字顯示已移除，如果需要可以重新加入
  // if (hands.length > 0) {
  //   gesture = checkGesture(hands[0]);
  // } else {
  //   gesture = "請將手伸入畫面";
  // }
  // fill(0);
  // textSize(48);
  // textAlign(CENTER, CENTER);
  // text(gesture, width / 2, y + h + 50);
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
