import { Vector2d } from './Vector2d.js';
import { Rectangle } from './Rectangle.js';
import {
  aabbIntersect,
  aabbCollision,
  axisAlignIntersect,
  axisAlignCollision,
  satIntersect,
  satPositionCorrection,
  getContactPointPolygonPolygon,
  satResolveCollision
} from './Collision.js';

function _main() {
  const fps = 90;
  const stepInterval = 1000 / fps;
  let interval = stepInterval;
  let lastTimeStep = performance.now();
  const canvas = document.getElementById('renderer');
  const ctx = canvas.getContext('2d');
  const width = innerWidth;
  const height = innerHeight;
  const pixelDense = Math.round(devicePixelRatio);
  const rectList = [];
  const minSize = 49;
  const maxSize = 1;
  const restitution = 0.8;
  const staticFriction = 0.2;
  const dynamicFriction = 0.1;
  const gravity = new Vector2d(0, 800);
  const speed = 1;
  const velocityIters = 10;
  const contactPoints = new Map();

    canvas.width = width * pixelDense;
    canvas.height = height * pixelDense;
    ctx.scale(pixelDense, pixelDense);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';

  function _initialize() {
    // generateBoxes(10);
    createGround();
    createLeftWall();
    createRightWall();
  }

  function createGround() {
    const groundWidth = width * 0.8;
    const groundHeight = 40;
    const position = new Vector2d(width / 2, height / 1.1);
    const option = {
      isStatic: true,
      color: '#655e5b'
    };

    createRectangle(position.x, position.y, groundWidth, groundHeight, option);
  }
  function createLeftWall() {
    const wallWidth = 40;
    const wallHeight = height * 0.3;
    const position = new Vector2d(width * 0.25, height * 0.3);
    const option = {
      isStatic: true,
      color: '#655e5b',
      angle: -120
    };

    createRectangle(position.x, position.y, wallWidth, wallHeight, option);
  }
  function createRightWall() {
    const wallWidth = 40;
    const wallHeight = height * 0.3;
    const position = new Vector2d(width * 0.75, height * 0.5);
    const option = {
      isStatic: true,
      color: '#655e5b',
      angle: 1.1 * Math.PI
    };

    createRectangle(position.x, position.y, wallWidth, wallHeight, option);
  }

  function generateBoxes(counts) {
    for (let i = 0; i < counts; i++) {
      const boxWidth = Math.random() * maxSize + minSize;
      const boxHeight = Math.random() * maxSize + minSize;
      const position = new Vector2d(
        Math.random() * (width - boxWidth * 2) + boxWidth,
        Math.random() * (height - boxHeight * 2) + boxHeight
      );
      // const position = new Vector2d(
      //   width * 0.5,
      //   height * 0.5
      // );
      const option = {
        velocity: new Vector2d(Math.random() - 0.5, Math.random() - 0.5),
        restitution: restitution,
        dynamicFriction: dynamicFriction,
        staticFriction: staticFriction
      };

      createRectangle(position.x, position.y, boxWidth, boxHeight, option);
    }

    // setTimeout(() => {
    //   generateBoxes(1);
    // }, 1000);
  }

  function createRectangle(x, y, width, height, option) {
    rectList.push(new Rectangle(x, y, width, height, option));
  }

  function throttle(callback, delay) {
    let lastTime = performance.now();
    return function (...args) {
      const currentTime = performance.now();
      if (currentTime - lastTime > delay) {
        callback(...args);
        lastTime = currentTime;
      }
    };
  }

  canvas.addEventListener(
    'pointerdown',
    throttle(event => {
      const boxWidth = Math.random() * maxSize + minSize;
      const boxHeight = Math.random() * maxSize + minSize;
      const pointer = new Vector2d(event.offsetX, event.offsetY);
      const option = {
        velocity: new Vector2d(),
        restitution: restitution,
        staticFriction: staticFriction,
        dynamicFriction: dynamicFriction
      };
      // const option = {
      //   velocity: new Vector2d(Math.random() - 0.5, Math.random() - 0.5)
      // };

      createRectangle(pointer.x, pointer.y, boxWidth, boxHeight, option);
    }, stepInterval)
  );

  canvas.addEventListener(
    'pointermove',
    throttle(event => {
      const boxWidth = Math.random() * maxSize + minSize;
      const boxHeight = Math.random() * maxSize + minSize;
      const pointer = new Vector2d(event.offsetX, event.offsetY);
      // const option = {
      //   velocity: new Vector2d()
      // };
      const option = {
        velocity: new Vector2d(Math.random() - 0.5, Math.random() - 0.5),
        restitution: restitution,
        staticFriction: staticFriction,
        dynamicFriction: dynamicFriction
      };

      createRectangle(pointer.x, pointer.y, boxWidth, boxHeight, option);
    }, stepInterval)
  );

  function setBoundary(body, width, height) {
    const centroid = body.getCentroid();

    // if (centroid.x - body.width < 0) {
    //   body.translate(-centroid.x + body.width, 0);
    //   body.velocity.x *= -1;
    // } else if (centroid.x + body.width > width) {
    //   body.translate(width - centroid.x - body.width, 0);
    //   body.velocity.x *= -1;
    // }

    // if (centroid.y - body.height < 0) {
    //   body.translate(0, -centroid.y + body.height);
    //   body.velocity.y *= -1;
    // } else if (centroid.y + body.height > height) {
    //   body.translate(0, height - centroid.y - body.height);
    //   body.velocity.y *= -1 * body.restitution;
    // }

    // if (centroid.y + body.height > height) {
    //   body.translate(0, height - centroid.y - body.height);
    //   body.velocity.y *= -1 * body.restitution;
    // }
  }

  function _step(deltatime) {
    ctx.clearRect(0, 0, width, height);

    for (let iter = 0; iter < velocityIters; iter++) {
      for (let i = 0; i < rectList.length; i++) {
        const box = rectList[i];

        box.simulate(gravity, speed, deltatime, velocityIters);
        setBoundary(box, width, height);
      }

      // Collision
      for (let i = 0; i < rectList.length; i++) {
        const bodyA = rectList[i];

        for (let j = i + 1; j < rectList.length; j++) {
          const bodyB = rectList[j];

          if (bodyA === bodyB) continue;

          // AABB
          // const {
          //   isAligned,
          //   intersectAABB,
          //   minmaxA,
          //   minmaxB
          // } = aabbIntersect(bodyA, bodyB);
          // if (intersectAABB && isAligned) {
          //   // continue;
          //   aabbCollision(bodyA, bodyB, minmaxA, minmaxB);
          // }

          // // Axis Align SAT
          // const { intersect, normal, depth } = axisAlignIntersect(bodyA, bodyB);
          // if (intersect) {
          //   axisAlignCollision(bodyA, bodyB, normal, depth);
          // }

          // SAT
          const { intersect, normal, depth } = satIntersect(bodyA, bodyB);
          if (intersect) {
            satPositionCorrection(bodyA, bodyB, normal, depth);
            const { contact1, contact2, contactCount } =
              getContactPointPolygonPolygon(bodyA.vertices, bodyB.vertices);
            satResolveCollision(
              bodyA,
              bodyB,
              normal,
              depth,
              contact1,
              contact2,
              contactCount
            );

            // const key1 = JSON.stringify(contact1);
            // const key2 = JSON.stringify(contact2);
            // if (!contactPoints.has(key1)) {
            //   contactPoints.set(key1, contact1);
            // }
            // if (!contactPoints.has(key2)) {
            //   contactPoints.set(key2, contact2);
            // }
          }
        }
      }
    }

    // Render Bodies
    for (let i = 0; i < rectList.length; i++) {
      const box = rectList[i];

      ctx.beginPath();
      ctx.moveTo(box.vertices[0].x, box.vertices[0].y);
      for (let j = 1; j < box.vertices.length; j++) {
        ctx.lineTo(box.vertices[j].x, box.vertices[j].y);
      }
      ctx.closePath();
      ctx.fillStyle = box.color;
      ctx.fill();
      ctx.strokeStyle = 'white';
      ctx.stroke();
    }

    // Render Contact Points
    // contactPoints.forEach(p => {
    //   ctx.fillStyle = 'red';
    //   ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
    //   ctx.strokeStyle = 'white';
    //   ctx.strokeRect(p.x - 2, p.y - 2, 4, 4);
    // });

    // // Empty contactPoints
    // for (let key of contactPoints) {
    //   contactPoints.delete(key[0]);
    // }

    // Delete Offscreen Bodies
    for (let i = 0; i < rectList.length; i++) {
      const body = rectList[i];
      const position = body.getCentroid();
      if (
        position.x < -body.width ||
        position.x > width + body.width ||
        position.y < -body.height ||
        position.y > height + body.height
      ) {
        rectList.splice(i, 1);
      }
    }

    // console.log(rectList.length)
  }

  function update(timeStep) {
    const deltatime = timeStep - lastTimeStep;
    interval += deltatime;
    lastTimeStep = timeStep;

    if (interval >= stepInterval) {
      _step(deltatime);
      interval = 0;
    }
    requestAnimationFrame(update);
  }

  _initialize();
  requestAnimationFrame(update);
}

_main();
