import React, { Fragment, useState, useEffect } from 'react'
import Loading from '../components/Loading'
import VideoPanel from '../components/VideoPanel'
import { SKELETON_COLOR, drawPoint, drawPath } from '../util/drawing'
import '@tensorflow/tfjs-backend-webgl'
const handpose = require('@tensorflow-models/handpose')

const FINGER_LOOKUP_INDICES = {
  thumb: [0, 1, 2, 3, 4],
  indexFinger: [0, 5, 6, 7, 8],
  middleFinger: [0, 9, 10, 11, 12],
  ringFinger: [0, 13, 14, 15, 16],
  pinky: [0, 17, 18, 19, 20]
}

const drawKeypoints = (keypoints, scale, ctx) => {
  const keypointsArray = keypoints;

  for (let i = 0; i < keypointsArray.length; i++) {
    const y = keypointsArray[i][0] * scale;
    const x = keypointsArray[i][1] * scale;
    drawPoint(ctx, x - 2, y - 2, 3, SKELETON_COLOR);
  }

  const fingers = Object.keys(FINGER_LOOKUP_INDICES);
  for (let i = 0; i < fingers.length; i++) {
    const finger = fingers[i];
    const points = FINGER_LOOKUP_INDICES[finger].map(idx => keypoints[idx]);
    drawPath(ctx, points, SKELETON_COLOR, scale, false);
  }
}

export const HandDetection = (props) => {
  const [model, setModel] = useState(null)

  const loadModel = async () => {
    setModel(await handpose.load())
  }
  
  const updateCanvas = async (source, canvas, ctx, modelApplyData, settings) => {
    if (modelApplyData.length > 0) {
      modelApplyData.forEach((hand, index) => {
        // Presumably default resolution is 640x480 so factor relative to
        // the size of our canvas.
        const scale = canvas.width / 640.0
        drawKeypoints(hand.landmarks, scale, ctx)
      })
    }
  }

  const updateApplyPanel = async (modelApplyData, settings) => {
  }

  const applySegmentationModel = async (video, canvas, settings) => {
    let modelApplyData = await model.estimateHands(video)
    // console.log(modelApplyData)
    // updateApplyPanel(modelApplyData, settings)
    return modelApplyData
  }

  useEffect(() => {
    loadModel()
  }, [])

  return (
    <Fragment>
      <h2>Hand Detection (Single)</h2>
      { (model &&
        <VideoPanel 
          applyRateMS={100}
          applyModel={(source, canvas) => applySegmentationModel(source, canvas, null)}
          updateCanvas={(source, canvas, ctx, modelData) => updateCanvas(source, canvas, ctx, modelData, null)}
        >
        </VideoPanel>)
        || <Loading message={'Loading model...'}/>
      }
    </Fragment>
  )
}

export default HandDetection
