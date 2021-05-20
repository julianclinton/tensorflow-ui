// Based on https://github.com/tensorflow/tfjs-models/blob/master/body-pix/demo/demo_util.js

import * as posenet from '@tensorflow-models/posenet'

export const GREEN = '#32EEDB'
export const RED = '#FF2C35'
export const BLUE = '#157AB3'

export const SKELETON_COLOR = 'aqua'
export const BOUNDING_BOX_COLOR = RED
export const OBJECT_BOX_COLOR = 'cyan'
export const SEGMENT_LINE_WIDTH = 2

export const drawPoint = (ctx, y, x, r, color) => {
  ctx.beginPath()
  ctx.arc(x, y, r, 0, 2 * Math.PI)
  ctx.fillStyle = color
  ctx.fill()
}

/**
 * Draws a line on a canvas, i.e. a joint
 */
export const drawSegment = ([ay, ax], [by, bx], color, scale, ctx) => {
  ctx.beginPath()
  ctx.moveTo(ax * scale, ay * scale)
  ctx.lineTo(bx * scale, by * scale)
  ctx.lineWidth = SEGMENT_LINE_WIDTH
  ctx.strokeStyle = color
  ctx.stroke()
}

/**
 * Draw pose keypoints onto a canvas
 */
export const drawKeypoints = (keypoints, minConfidence, ctx, scale = 1) => {
  for (let i = 0; i < keypoints.length; i++) {
    const keypoint = keypoints[i]

    if (keypoint.score < minConfidence) {
      continue
    }

    const {y, x} = keypoint.position
    drawPoint(ctx, y * scale, x * scale, 3, SKELETON_COLOR)
  }
}

/**
 * Draw the bounding box of a pose. For example, for a whole person standing
 * in an image, the bounding box will begin at the nose and extend to one of
 * ankles
 */
export const drawBoundingBox = (keypoints, ctx) => {
  const boundingBox = posenet.getBoundingBox(keypoints)

  ctx.rect(
      boundingBox.minX, boundingBox.minY, boundingBox.maxX - boundingBox.minX,
      boundingBox.maxY - boundingBox.minY)

  ctx.strokeStyle = BOUNDING_BOX_COLOR
  ctx.stroke()
}

/**
 * Draws a pose skeleton by looking up all adjacent keypoints/joints
 */
export const drawSkeleton = (keypoints, minConfidence, ctx, scale = 1) => {
  const adjacentKeyPoints =
      posenet.getAdjacentKeyPoints(keypoints, minConfidence)

  const toTuple = ({y, x}) => {
    return [y, x]
  }

  adjacentKeyPoints.forEach((keypoints) => {
    drawSegment(
        toTuple(keypoints[0].position), toTuple(keypoints[1].position), SKELETON_COLOR,
        scale, ctx)
  })
}

export const distance = (a, b) => {
  return Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2));
}

export const drawPath = (ctx, points, color, scale, closePath) => {
  const region = new Path2D()
  region.moveTo(points[0][0] * scale, points[0][1] * scale)
  for (let i = 1; i < points.length; i++) {
    const point = points[i]
    region.lineTo(point[0] * scale, point[1] * scale)
  }

  if (closePath) {
    region.closePath()
  }
  ctx.strokeStyle = color
  ctx.stroke(region)
}

/**
 * Converts an array of pixel data into an ImageData object
 */
 export const renderToCanvas = async (a, ctx) => {
  const [height, width] = a.shape
  const imageData = new ImageData(width, height)

  const data = await a.data()

  for (let i = 0; i < height * width; ++i) {
    const j = i * 4
    const k = i * 3

    imageData.data[j + 0] = data[k + 0]
    imageData.data[j + 1] = data[k + 1]
    imageData.data[j + 2] = data[k + 2]
    imageData.data[j + 3] = 255
  }

  ctx.putImageData(imageData, 0, 0)
}