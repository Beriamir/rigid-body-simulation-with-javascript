import { Vector2d } from './Vector2d.js';

// AABB
function axisAlign(vertices) {
  for (let i = 0; i < vertices.length; i++) {
    const vertex1 = vertices[i];
    const vertex2 = vertices[(i + 1) % vertices.length];
    const edge = Vector2d.subtract(vertex2, vertex1);

    if (Math.abs(edge.x) !== 0 && Math.abs(edge.y) !== 0) {
      return false;
    }
  }

  return true;
}

export function aabbIntersect(bodyA, bodyB) {
  if (axisAlign(bodyA.vertices) && axisAlign(bodyB.vertices)) {
    const centerA = bodyA.getCentroid();
    const centerB = bodyB.getCentroid();
    const minmaxA = {
      min: {
        x: centerA.x - bodyA.width,
        y: centerA.y - bodyA.height
      },
      max: {
        x: centerA.x + bodyA.width,
        y: centerA.y + bodyA.height
      }
    };
    const minmaxB = {
      min: {
        x: centerB.x - bodyB.width,
        y: centerB.y - bodyB.height
      },
      max: {
        x: centerB.x + bodyB.width,
        y: centerB.y + bodyB.height
      }
    };

    if (
      minmaxA.min.x > minmaxB.max.x ||
      minmaxB.min.x > minmaxA.max.x ||
      minmaxA.min.y > minmaxB.max.y ||
      minmaxB.min.y > minmaxA.max.y
    ) {
      return {
        isAligned: true,
        intersectAABB: false,
        minmaxA,
        minmaxB
      };
    }

    return {
      isAligned: true,
      intersectAABB: true,
      minmaxA,
      minmaxB
    };
  }

  return {
    isAligned: false,
    intersectAABB: false,
    minmaxA: null,
    minmaxB: null
  };
}

export function aabbCollision(bodyA, bodyB, minmaxA, minmaxB) {
  const centerA = bodyA.getCentroid();
  const centerB = bodyB.getCentroid();
  const normal = Vector2d.subtract(centerB, centerA);
  normal.normalize();

  const depthX = Math.min(
    minmaxA.max.x - minmaxB.min.x,
    minmaxB.max.x - minmaxA.min.x
  );
  const depthY = Math.min(
    minmaxA.max.y - minmaxB.min.y,
    minmaxB.max.y - minmaxA.min.y
  );
  const depth = Math.min(depthX, depthY);

  bodyA.vertices.forEach(p => p.add(normal, -depth * 0.5));
  bodyB.vertices.forEach(p => p.add(normal, depth * 0.5));

  const relativeVelocity = Vector2d.subtract(bodyB.velocity, bodyA.velocity);
  const velocityAlongNormal = relativeVelocity.dot(normal);

  if (velocityAlongNormal > 0) return null;

  const e = Math.min(bodyA.restitution, bodyB.restitution);
  const j = (-(1 + e) * velocityAlongNormal) / (bodyA.invMass + bodyB.invMass);

  bodyA.velocity.add(normal, -j * bodyA.invMass);
  bodyB.velocity.add(normal, j * bodyB.invMass);

  return null;
}

export function axisAlignIntersect(bodyA, bodyB) {
  const centerA = bodyA.getCentroid();
  const centerB = bodyB.getCentroid();
  const direction = Vector2d.subtract(centerB, centerA);
  const minmaxA = {
    min: {
      x: centerA.x - bodyA.width,
      y: centerA.y - bodyA.height
    },
    max: {
      x: centerA.x + bodyA.width,
      y: centerA.y + bodyA.height
    }
  };
  const minmaxB = {
    min: {
      x: centerB.x - bodyB.width,
      y: centerB.y - bodyB.height
    },
    max: {
      x: centerB.x + bodyB.width,
      y: centerB.y + bodyB.height
    }
  };

  const axes = [new Vector2d(0, 1).normalize(), new Vector2d(1, 0).normalize()];
  const projA = {
    min: null,
    max: null
  };
  const projB = {
    min: null,
    max: null
  };

  const normal = new Vector2d();
  let depth = Infinity;

  for (let axis of axes) {
    if (axis.x == 1) {
      projA.min = minmaxA.min.x;
      projA.max = minmaxA.max.x;

      projB.min = minmaxB.min.x;
      projB.max = minmaxB.max.x;
    } else {
      projA.min = minmaxA.min.y;
      projA.max = minmaxA.max.y;

      projB.min = minmaxB.min.y;
      projB.max = minmaxB.max.y;
    }

    if (projA.min > projB.max || projB.min > projA.max) {
      return {
        intersect: false,
        normal,
        depth
      };
    }

    const axisDepth = Math.min(projA.max - projB.min, projB.max - projA.min);

    if (axisDepth < depth) {
      depth = axisDepth;
      normal.set(axis.x, axis.y);
    }

    if (direction.dot(normal) < 0) normal.negate();
  }

  return {
    intersect: true,
    normal,
    depth
  };
}

export function axisAlignCollision(bodyA, bodyB, normal, depth) {
  bodyA.vertices.forEach(p => p.add(normal, -depth * 0.5));
  bodyB.vertices.forEach(p => p.add(normal, depth * 0.5));

  const relativeVelocity = Vector2d.subtract(bodyB.velocity, bodyA.velocity);
  const velocityAlongNormal = relativeVelocity.dot(normal);

  if (velocityAlongNormal > 0) return;

  const e = Math.min(bodyA.restitution, bodyB.restitution);
  const j = (-(1 + e) * velocityAlongNormal) / (bodyA.invMass + bodyB.invMass);

  bodyA.velocity.add(normal, -j * bodyA.invMass);
  bodyB.velocity.add(normal, j * bodyB.invMass);
}

// SAT
function getAxes(vertices) {
  const axes = [];
  for (let i = 0; i < vertices.length; i++) {
    const vertexA = vertices[i];
    const vertexB = vertices[(i + 1) % vertices.length];
    const edge = Vector2d.subtract(vertexB, vertexA);

    axes.push(new Vector2d(-edge.y, edge.x).normalize());
  }
  return axes;
}

function projectPolygon(vertices, axis) {
  let min = Infinity;
  let max = -min;
  for (let i = 0; i < vertices.length; i++) {
    const projection = vertices[i].dot(axis);
    if (projection < min) min = projection;
    if (projection > max) max = projection;
  }

  return { min, max };
}

function projectionOverlap(projA, projB) {
  return projA.min > projB.max || projB.min > projA.max;
}

function pointLineSegment(va, vb, p) {
  const ab = Vector2d.subtract(vb, va);
  const ap = Vector2d.subtract(p, va);
  const abLenSq = ab.magnitudeSq();

  const pointProjection = ap.dot(ab) / abLenSq;
  const contactPoint = Vector2d.add(va, ab.scale(pointProjection));

  if (pointProjection <= 0) {
    contactPoint.copy(va);
  } else if (pointProjection >= 1) {
    contactPoint.copy(vb);
  }

  const distanceSq = Vector2d.distanceSq(p, contactPoint);

  return { contactPoint, distanceSq };
}

function equalValue(a, b) {
  return Math.abs(a - b) < 5e-3;
}

function equalVectorValue(va, vb) {
  return equalValue(va.x, vb.x) && equalValue(va.y, vb.y);
}

export function satIntersect(bodyA, bodyB) {
  const axesA = getAxes(bodyA.vertices);
  const axesB = getAxes(bodyB.vertices);
  const normal = new Vector2d();
  let depth = Number.MAX_VALUE;

  for (let axis of [...axesA, ...axesB]) {
    const projA = projectPolygon(bodyA.vertices, axis);
    const projB = projectPolygon(bodyB.vertices, axis);

    if (projectionOverlap(projA, projB)) {
      return {
        intersect: false,
        normal,
        depth
      };
    }

    const axisDepth = Math.min(projA.max - projB.min, projB.max - projA.min);

    if (axisDepth < depth) {
      depth = axisDepth;
      normal.set(axis.x, axis.y);
    }

    const centerA = bodyA.getCentroid();
    const centerB = bodyB.getCentroid();
    const direction = Vector2d.subtract(centerB, centerA);

    if (direction.dot(normal) < 0) normal.negate();
  }

  return {
    intersect: true,
    normal,
    depth
  };
}

export function satPositionCorrection(bodyA, bodyB, normal, depth) {
  if (bodyA.isStatic && !bodyB.isStatic) {
    bodyB.vertices.forEach(p => p.add(normal, depth));
  } else if (!bodyA.isStatic && bodyB.isStatic) {
    bodyA.vertices.forEach(p => p.add(normal, -depth));
  } else if (!bodyA.isStatic && !bodyB.isStatic) {
    bodyA.vertices.forEach(p => p.add(normal, -depth * 0.5));
    bodyB.vertices.forEach(p => p.add(normal, depth * 0.5));
  }
}

export function getContactPointPolygonPolygon(verticesA, verticesB) {
  const contact1 = new Vector2d(Number.MAX_VALUE, Number.MAX_VALUE);
  const contact2 = new Vector2d(Number.MAX_VALUE, Number.MAX_VALUE);
  let contactCount = 0;
  let minDistanceSq = Infinity;

  for (let i = 0; i < verticesA.length; i++) {
    const p = verticesA[i];

    for (let j = 0; j < verticesB.length; j++) {
      const va = verticesB[j];
      const vb = verticesB[(j + 1) % verticesB.length];

      const { contactPoint, distanceSq } = pointLineSegment(va, vb, p);

      if (equalValue(distanceSq, minDistanceSq)) {
        if (
          !equalVectorValue(contactPoint, contact1) &&
          !equalVectorValue(contactPoint, contact2)
        ) {
          minDistanceSq = distanceSq;
          contact2.copy(contactPoint);
          contactCount = 2;
        }
      } else if (distanceSq < minDistanceSq) {
        minDistanceSq = distanceSq;
        contactCount = 1;
        contact1.copy(contactPoint);
      }
    }
  }

  for (let i = 0; i < verticesB.length; i++) {
    const p = verticesB[i];

    for (let j = 0; j < verticesA.length; j++) {
      const va = verticesA[j];
      const vb = verticesA[(j + 1) % verticesA.length];

      const { contactPoint, distanceSq } = pointLineSegment(va, vb, p);

      if (equalValue(distanceSq, minDistanceSq)) {
        if (
          !equalVectorValue(contactPoint, contact1) &&
          !equalVectorValue(contactPoint, contact2)
        ) {
          minDistanceSq = distanceSq;
          contact2.copy(contactPoint);
          contactCount = 2;
        }
      } else if (distanceSq < minDistanceSq) {
        minDistanceSq = distanceSq;
        contactCount = 1;
        contact1.copy(contactPoint);
      }
    }
  }

  return { contact1, contact2, contactCount };
}

export function satResolveCollision(
  bodyA,
  bodyB,
  normal,
  depth,
  contact1,
  contact2,
  contactCount
) {
  const centerA = bodyA.getCentroid();
  const centerB = bodyB.getCentroid();
  const e = Math.min(bodyA.restitution, bodyB.restitution);
  const sf = (bodyA.staticFriction + bodyB.staticFriction) * 0.5;
  const df = (bodyA.dynamicFriction + bodyB.dynamicFriction) * 0.5;
  const impulses = [];
  const frictionImpulses = [];
  const tangent = new Vector2d();
  const raList = [];
  const rbList = [];
  const contactList = [contact1, contact2];
  const smallAmount = 1e-5;
  const decreaseFactorV = 0.999;
  const decreaseFactorAV = 0.999;

  for (let i = 0; i < contactCount; i++) {
    impulses[i] = 0;
    frictionImpulses[i] = 0;
    raList[i] = new Vector2d();
    rbList[i] = new Vector2d();
  }

  for (let i = 0; i < contactCount; i++) {
    if (bodyA.velocity.x < smallAmount && bodyA.velocity.y < smallAmount) {
      bodyA.velocity.scale(decreaseFactorV);
    }
    if (bodyB.velocity.x < smallAmount && bodyB.velocity.y < smallAmount) {
      bodyB.velocity.scale(decreaseFactorV);
    }

    if (bodyA.angularVelocity < smallAmount) {
      bodyA.angularVelocity *= decreaseFactorAV;
    }
    if (bodyB.angularVelocity < smallAmount) {
      bodyB.angularVelocity *= decreaseFactorAV;
    }

    const ra = Vector2d.subtract(contactList[i], centerA);
    const rb = Vector2d.subtract(contactList[i], centerB);

    raList[i] = ra;
    rbList[i] = rb;

    const raPerp = new Vector2d(-ra.y, ra.x);
    const rbPerp = new Vector2d(-rb.y, rb.x);

    const angularVelocityA = Vector2d.scale(raPerp, bodyA.angularVelocity);
    const angularVelocityB = Vector2d.scale(rbPerp, bodyB.angularVelocity);

    const relativeVelocity = Vector2d.subtract(
      Vector2d.add(bodyB.velocity, angularVelocityB),
      Vector2d.add(bodyA.velocity, angularVelocityA)
    );

    const velocityAlongNormal = Vector2d.dot(relativeVelocity, normal);

    if (velocityAlongNormal > 0) {
      continue;
    }

    const raPerpAlongNormal = Vector2d.dot(raPerp, normal);
    const rbPerpAlongNormal = Vector2d.dot(rbPerp, normal);

    let j =
      (-(1 + e) * velocityAlongNormal) /
      (bodyA.invMass +
        bodyB.invMass +
        raPerpAlongNormal ** 2 * bodyA.invInertia +
        rbPerpAlongNormal ** 2 * bodyB.invInertia);

    j /= contactCount;

    impulses[i] = j;
  }

  for (let i = 0; i < contactCount; i++) {
    let j = impulses[i];
    const ra = raList[i];
    const rb = rbList[i];

    bodyA.velocity.add(normal, -j * bodyA.invMass);
    bodyB.velocity.add(normal, j * bodyB.invMass);

    const torqueA = Vector2d.cross(ra, Vector2d.scale(normal, -j));
    const torqueB = Vector2d.cross(rb, Vector2d.scale(normal, j));

    bodyA.angularVelocity += torqueA * bodyA.invInertia;
    bodyB.angularVelocity += torqueB * bodyB.invInertia;
  }

  for (let i = 0; i < contactCount; i++) {
    if (bodyA.velocity.x < smallAmount && bodyA.velocity.y < smallAmount) {
      bodyA.velocity.scale(decreaseFactorV);
    }
    if (bodyB.velocity.x < smallAmount && bodyB.velocity.y < smallAmount) {
      bodyB.velocity.scale(decreaseFactorV);
    }

    // if (bodyA.angularVelocity <smallAmount) {
    //   bodyA.angularVelocity *=decreaseFactorAV;
    // }
    // if (bodyB.angularVelocity <smallAmount) {
    //   bodyB.angularVelocity *= decreaseFactorAV;
    // }
    const ra = raList[i];
    const rb = rbList[i];

    const raPerp = new Vector2d(-ra.y, ra.x);
    const rbPerp = new Vector2d(-rb.y, rb.x);

    const angularVelocityA = Vector2d.scale(raPerp, bodyA.angularVelocity);
    const angularVelocityB = Vector2d.scale(rbPerp, bodyB.angularVelocity);

    const relativeVelocity = Vector2d.subtract(
      Vector2d.add(bodyB.velocity, angularVelocityB),
      Vector2d.add(bodyA.velocity, angularVelocityA)
    );

    tangent.copy(
      Vector2d.subtract(
        relativeVelocity,
        Vector2d.scale(normal, relativeVelocity.dot(normal))
      )
    );

    if (equalVectorValue(tangent, new Vector2d())) {
      continue;
    }

    tangent.normalize();

    const raPerpAlongTangent = Vector2d.dot(raPerp, tangent);
    const rbPerpAlongTangent = Vector2d.dot(rbPerp, tangent);

    let jF =
      -relativeVelocity.dot(tangent) /
      (bodyA.invMass +
        bodyB.invMass +
        raPerpAlongTangent ** 2 * bodyA.invInertia +
        rbPerpAlongTangent ** 2 * bodyB.invInertia);

    jF /= contactCount;

    frictionImpulses[i] = jF;
  }

  for (let i = 0; i < contactCount; i++) {
    let jF = frictionImpulses[i];
    let j = impulses[i];
    const ra = raList[i];
    const rb = rbList[i];

    if (Math.abs(jF) <= j * sf) {
      bodyA.velocity.add(tangent, -jF * bodyA.invMass);
      bodyB.velocity.add(tangent, jF * bodyB.invMass);

      const torqueA = Vector2d.cross(ra, Vector2d.scale(tangent, -jF));
      const torqueB = Vector2d.cross(rb, Vector2d.scale(tangent, jF));

      bodyA.angularVelocity += torqueA * bodyA.invInertia;
      bodyB.angularVelocity += torqueB * bodyB.invInertia;
    } else {
      j = -j * df;
      
      bodyA.velocity.add(tangent, -j * bodyA.invMass);
      bodyB.velocity.add(tangent, j * bodyB.invMass);

      const torqueA = Vector2d.cross(ra, Vector2d.scale(tangent, -j));
      const torqueB = Vector2d.cross(rb, Vector2d.scale(tangent, j));

      bodyA.angularVelocity += torqueA * bodyA.invInertia;
      bodyB.angularVelocity += torqueB * bodyB.invInertia;
    }
  }
}
