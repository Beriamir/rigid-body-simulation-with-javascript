export class Vector2d {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  set(x, y) {
    this.x = x;
    this.y = y;
  }

  copy(v) {
    this.x = v.x;
    this.y = v.y;
  }

  clone() {
    return new Vector2d(this.x, this.y);
  }

  equals(v) {
    return this.x === v.x && this.y === v.y;
  }

  zero() {
    this.x = 0;
    this.y = 0;
    return this;
  }

  negate() {
    this.x = -this.x;
    this.y = -this.y;
    return this;
  }

  add(v, s = 1) {
    this.x += v.x * s;
    this.y += v.y * s;
    return this;
  }

  subtract(v, s = 1) {
    this.x -= v.x * s;
    this.y -= v.y * s;
    return this;
  }

  divide(s = 1) {
    if (s > 0) {
      this.x /= s;
      this.y /= s;
    }
    return this;
  }

  multiply(v) {
    this.x *= v.x;
    this.y *= v.y;
    return this;
  }

  scale(s) {
    this.x *= s;
    this.y *= s;
    return this;
  }

  magnitude() {
    return Math.sqrt(this.x ** 2 + this.y ** 2);
  }

  magnitudeSq() {
    return this.x ** 2 + this.y ** 2;
  }

  distance(v) {
    const dx = v.x - this.x;
    const dy = v.y - this.y;
    return Math.sqrt(dx ** 2 + dy ** 2);
  }

  distanceSq(v) {
    const dx = v.x - this.x;
    const dy = v.y - this.y;
    return dx ** 2 + dy ** 2;
  }

  normalize() {
    const mag = this.magnitude();
    if (mag > 0) {
      this.divide(mag);
    }
    return this;
  }

  dot(v) {
    return this.x * v.x + this.y * v.y;
  }

  cross(v) {
    return this.x * v.y - this.y * v.x;
  }

  lerp(v, t) {
    this.x += (v.x - this.x) * t;
    this.y += (v.y - this.y) * t;
    return this;
  }

  rotate(angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const x = this.x * cos - this.y * sin;
    const y = this.x * sin + this.y * cos;
    return new Vector2d(x, y);
  }

  angle() {
    return Math.atan2(this.y, this.x);
  }

  toString() {
    return `(${this.x.toFixed(2)}, ${this.y.toFixed(2)})`;
  }

  // Static methods
  static add(v1, v2) {
    return new Vector2d(v1.x + v2.x, v1.y + v2.y);
  }

  static subtract(v1, v2) {
    return new Vector2d(v1.x - v2.x, v1.y - v2.y);
  }

  static multiply(v1, v2) {
    return new Vector2d(v1.x * v2.x, v1.y * v2.y);
  }

  static divide(v, s) {
    return new Vector2d(v.x / s, v.y / s);
  }
  static scale(v, s) {
    return new Vector2d(v.x * s, v.y * s);
  }

  static dot(v1, v2) {
    return v1.x * v2.x + v1.y * v2.y;
  }

  static cross(v1, v2) {
    return v1.x * v2.y - v1.y * v2.x;
  }

  static distance(v1, v2) {
    const dir = Vector2d.subtract(v1, v2);
    return Math.sqrt(dir.x ** 2 + dir.y ** 2);
  }

  static distanceSq(v1, v2) {
    const dir = Vector2d.subtract(v1, v2);
    return dir.x ** 2 + dir.y ** 2;
  }

  static lerp(v1, v2, t) {
    const x = v1.x + (v2.x - v1.x) * t;
    const y = v1.y + (v2.y - v1.y) * t;
    return new Vector2d(x, y);
  }

  static rotate(v, angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const x = v.x * cos - v.y * sin;
    const y = v.x * sin + v.y * cos;
    return new Vector2d(x, y);
  }
}
