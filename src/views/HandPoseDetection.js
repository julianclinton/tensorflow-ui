import React, { Fragment, useState, useEffect } from 'react'
import Form from 'react-bootstrap/Form'
import Col from 'react-bootstrap/Col'
import Row from 'react-bootstrap/Row'
import RangeSlider from 'react-bootstrap-range-slider'
import Loading from '../components/Loading'
import VideoPanel from '../components/VideoPanel'
import { drawPoint, drawPath } from '../util/drawing'
import '@tensorflow/tfjs-backend-webgl'
import * as handdetection from '@tensorflow-models/hand-pose-detection'

const FINGER_LOOKUP_INDICES = {
  thumb: [0, 1, 2, 3, 4],
  indexFinger: [0, 5, 6, 7, 8],
  middleFinger: [0, 9, 10, 11, 12],
  ringFinger: [0, 13, 14, 15, 16],
  pinky: [0, 17, 18, 19, 20],
} // for rendering each finger as a polyline

const LEFT_HAND_COLOUR = 'Red'
const RIGHT_HAND_COLOUR = 'Blue'

const drawKeypoints = (hand, scale, ctx) => {
  const handedness = hand.handedness
  const keypoints = hand.keypoints
  ctx.fillStyle = handedness === 'Left' ? LEFT_HAND_COLOUR : RIGHT_HAND_COLOUR
  ctx.strokeStyle = 'White'

  for (let i = 0; i < keypoints.length; i++) {
    const y = keypoints[i].x * scale;
    const x = keypoints[i].y * scale;
    drawPoint(ctx, x - 2, y - 2, 3, ctx.fillStyle);
  }

  const fingers = Object.keys(FINGER_LOOKUP_INDICES);
  for (let i = 0; i < fingers.length; i++) {
    const finger = fingers[i];
    const points = FINGER_LOOKUP_INDICES[finger].map(idx => [keypoints[idx].x, keypoints[idx].y]);
    drawPath(ctx, points, ctx.fillStyle, scale, false);
  }
}

export const HandPoseDetection = (props) => {
  const [model, setModel] = useState(null)
  const [settings, setSettings] = useState({
    maxHands: 4
  })

  const loadModel = async (settings) => {
    setModel(await handdetection.createDetector(handdetection.SupportedModels.MediaPipeHands,
      {
        runtime: 'tfjs',
        maxHands: settings.maxHands,
        refineLandmarks: true
      }))
  }
  
  const updateCanvas = async (source, canvas, ctx, modelApplyData, settings) => {
    if (modelApplyData.length > 0) {
      modelApplyData.forEach((hand, index) => {
        // Presumably default resolution is 640x480 so factor relative to
        // the size of our canvas.
        const scale = canvas.width / 640.0
        drawKeypoints(hand, scale, ctx)
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

  const onMaxHandsChange = (event) => {
    setSettings({ ...settings, maxHands: event.target.value })
  }
  
  useEffect(() => {
    loadModel(settings)
  }, [settings])

  const controlPanel = <Form>
    <Row>
      <Col>
        <Form.Label>Max hands</Form.Label>
        <RangeSlider
          value={settings.maxHands}
          min={1}
          max={4}
          step={1}
          onChange={onMaxHandsChange}
        />   
      </Col>
    </Row>
  </Form>

  return (
    <Fragment>
      <h2>Hand Pose Detection (Multiple)</h2>
      { (model &&
        <VideoPanel 
          controlPanel={controlPanel}
          settings={settings}
          applyRateMS={250}
          applyModel={(source, canvas) => applySegmentationModel(source, canvas, settings)}
          updateCanvas={(source, canvas, ctx, modelData) => updateCanvas(source, canvas, ctx, modelData, settings)}
        >
        </VideoPanel>)
        || <Loading message={'Loading model...'}/>
      }
    </Fragment>
  )
}

export default HandPoseDetection
