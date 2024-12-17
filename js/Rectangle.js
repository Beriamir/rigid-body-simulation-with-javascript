import { Vector2d } from './Vector2d.js';

export class Rectangle {
  constructor(x, y, width, height, option = {}) {
    this.position = new Vector2d(x, y);
    this.width = width * 0.5;
    this.height = height * 0.5;
    this.vertices = [
      new Vector2d(this.position.x - this.width, this.position.y - this.height),
      new Vector2d(this.position.x + this.width, this.position.y - this.height),
      new Vector2d(this.position.x + this.width, this.position.y + this.height),
      new Vector2d(this.position.x - this.width, this.position.y + this.height)
    ];
    this.colors = [
      '#fc39ed',
      '#39fc4c',
      '#3963fc',
      '#fc6d39',
      '#fc396a',
      '#fcea39',
      '#fc3939',
      '#39fce6'
    ];
    this.staticFriction = option.staticFriction || 0.8;
    this.dynamicFriction = option.dynamicFriction || 0.6;
    this.restitution = option.restitution || 0.0;
    this.mass = 2700 * (this.width * this.height);
    this.invMass = 1 / this.mass;
    this.inertia = (1 / 12) * this.mass * (this.width ** 2 + this.height ** 2);
    this.invInertia = 1 / this.inertia;
    this.angle = option.angle || 0.0;
    this.rotate(this.angle);
    this.angularVelocity = 0.0;
    this.torqueFactor = option.torqueFactor || 1;
    this.velocity = option.velocity || new Vector2d();
    this.color =
      option.color ||
      this.colors[
        Math.round(Math.random() * this.colors.length) % this.colors.length
      ];
    this.isStatic = option.isStatic || false;
    if (this.isStatic) {
      this.invMass = 0;
      this.invInertia = 0;
      this.dynamicFriction = this.staticFriction;
      this.velocity.zero();
      this.restitution = 1.0;
    }
  }

  equalValue(a, b) {
    return Math.abs(a - b) < 5e-2;
  }

  equalVectorValue(va, vb) {
    return this.equalValue(va.x, vb.x) && this.equalValue(va.y, vb.y);
  }

  simulate(gravity, speed, deltatime, velocityIters) {
    deltatime /= velocityIters;
    const acceleration = Vector2d.scale(gravity, this.invMass);

    this.velocity.add(acceleration, speed * deltatime);
    
    this.vertices.forEach(p => p.add(this.velocity, speed * deltatime));
    this.rotate(this.angularVelocity * speed * deltatime);
  }

  rotate(angle) {
    const center = this.getCentroid();

    this.vertices = this.vertices.map(vertex => {
      const translation = Vector2d.subtract(center, vertex);
      const rotatation = translation.rotate(angle);

      return Vector2d.add(rotatation, center);
    });
  }

  translate(dx, dy) {
    const direction = new Vector2d(dx, dy);
    this.vertices = this.vertices.map(vertex => vertex.add(direction));
  }

  getCentroid() {
    const sumX = this.vertices.reduce((sum, v) => sum + v.x, 0);
    const sumY = this.vertices.reduce((sum, v) => sum + v.y, 0);
    const count = this.vertices.length;

    return new Vector2d(sumX / count, sumY / count);
  }
}
