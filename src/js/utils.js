class Utils {

  isPointInRectangle(point, rect) {
    const [x, y] = point;
    const [[x1, y1], [x2, y2]] = rect; // rect defined by two corners

    return x >= Math.min(x1, x2) && x <= Math.max(x1, x2) &&
          y >= Math.min(y1, y2) && y <= Math.max(y1, y2);
  }

}

module.exports = Utils;