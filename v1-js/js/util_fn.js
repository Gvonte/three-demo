// util_fn.js
// 合并两张图片 img1、img2，其中图片占比 a：b（需要两张图片同高）
function mergeImage(imgSrc1, imgSrc2, a, b) {
  return new Promise((res, rej) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img1 = new Image();
    img1.src = imgSrc1;
    img1.onload = function () {
      const img2 = new Image();
      img2.src = imgSrc2;
      img2.onload = function () {
        canvas.width = img1.width * a + img2.width * b;
        canvas.height = img1.height;
        ctx.rect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#fff";
        ctx.fill();

        let width = 0;
        // 绘制img1
        for (let i = 0; i < a; i++) {
          ctx.drawImage(img1, width, 0, img1.width, img1.height);
          width += img1.width;
        }

        // 绘制img2
        for (let i = 0; i < b; i++) {
          ctx.drawImage(img2, width, 0, img2.width, img2.height);
          width += img2.width;
        }

        // 合并
        const base64 = canvas.toDataURL("image/png"); // "image/png" 这里注意一下
        // const img = document.createElement('img');
        // img.setAttribute('src', base64);
        // res(img);
        res(base64);
      };
    };
  });
}
// 计算对应UV坐标
function computeUV(geometry) {
  geometry.computeBoundingBox(); // 计算外边界矩形，这样才能得到geometry的boundingBox属性值
  const max = geometry.boundingBox.max,
    min = geometry.boundingBox.min; // 获取最大、最小值
  const offset = new THREE.Vector2(0 - min.x, 0 - min.y); // 计算偏移量
  const range = new THREE.Vector2(max.x - min.x, max.y - min.y); // 计算范围
  const uvArr = geometry.getAttribute("uv");
  uvArr.array = uvArr.array.map((item, index) =>
    index % 2 ? item / range.y + offset.y : item / range.x + offset.x
  );
  geometry.setAttribute("uv", uvArr); // 将geometry的uv属性设置成我们刚刚计算出来的新uv值
  geometry.uvsNeedUpdate = true; // needUpdate必须为true才会更新
}
