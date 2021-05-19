import React, { Fragment, useState, useEffect } from 'react'
import Form from 'react-bootstrap/Form'
import Col from 'react-bootstrap/Col'
import Row from 'react-bootstrap/Row'
import RangeSlider from 'react-bootstrap-range-slider'
import Chart from 'react-apexcharts'
import Loading from '../components/Loading'
import VideoPanel from '../components/VideoPanel'
import { BAR_CHART_DEFAULTS } from '../util/constants'
import { GREEN, RED, distance, drawPath } from '../util/drawing'
import { TRIANGULATION } from '../util/triangulation'
require('@tensorflow/tfjs-backend-cpu')
require('@tensorflow/tfjs-backend-webgl')
const faceLandmarksDetection = require('@tensorflow-models/face-landmarks-detection')

const DISPLAY_OPTIONS = { ...BAR_CHART_DEFAULTS }

const NUM_KEYPOINTS = 468
const NUM_IRIS_KEYPOINTS = 5

const drawFaceFeatures = (result, scale, ctx) => {
  if (result.length > 0) {
    result.forEach(prediction => {
      const keypoints = prediction.scaledMesh

      if (true) {
        ctx.strokeStyle = GREEN;
        ctx.lineWidth = 0.5;

        for (let i = 0; i < TRIANGULATION.length / 3; i++) {
          const points = [
            TRIANGULATION[i * 3], TRIANGULATION[i * 3 + 1],
            TRIANGULATION[i * 3 + 2]
          ].map(index => keypoints[index])

          drawPath(ctx, points, scale, true)
        }
      } else {
        ctx.fillStyle = GREEN

        for (let i = 0; i < NUM_KEYPOINTS; i++) {
          const x = keypoints[i][0]
          const y = keypoints[i][1]

          ctx.beginPath();
          ctx.arc(x, y, 1 /* radius */, 0, 2 * Math.PI)
          ctx.fill()
        }
      }

      if (keypoints.length > NUM_KEYPOINTS) {
        ctx.strokeStyle = RED;
        ctx.lineWidth = 1

        const leftCenter = keypoints[NUM_KEYPOINTS];
        const leftDiameterY = distance(
          keypoints[NUM_KEYPOINTS + 4],
          keypoints[NUM_KEYPOINTS + 2]);
        const leftDiameterX = distance(
          keypoints[NUM_KEYPOINTS + 3],
          keypoints[NUM_KEYPOINTS + 1])

        ctx.beginPath()
        ctx.ellipse(leftCenter[0], leftCenter[1], leftDiameterX / 2, leftDiameterY / 2, 0, 0, 2 * Math.PI)
        ctx.stroke()

        if (keypoints.length > NUM_KEYPOINTS + NUM_IRIS_KEYPOINTS) {
          const rightCenter = keypoints[NUM_KEYPOINTS + NUM_IRIS_KEYPOINTS]
          const rightDiameterY = distance(
            keypoints[NUM_KEYPOINTS + NUM_IRIS_KEYPOINTS + 2],
            keypoints[NUM_KEYPOINTS + NUM_IRIS_KEYPOINTS + 4])
          const rightDiameterX = distance(
            keypoints[NUM_KEYPOINTS + NUM_IRIS_KEYPOINTS + 3],
            keypoints[NUM_KEYPOINTS + NUM_IRIS_KEYPOINTS + 1])

          ctx.beginPath()
          ctx.ellipse(rightCenter[0], rightCenter[1], rightDiameterX / 2, rightDiameterY / 2, 0, 0, 2 * Math.PI)
          ctx.stroke()
        }
      }
    })
  }
}

export const FaceLandmarksDetection = (props) => {
  const [model, setModel] = useState(null)
  const [settings, setSettings] = useState({
    classThreshold: 0.1,
    maxFaces: 3,
  })
  const [chartData, setChartData] = useState([])

  const loadModel = async (settings) => {
    setModel(await faceLandmarksDetection.load(faceLandmarksDetection.SupportedPackages.mediapipeFacemesh,
      { maxFaces: settings.maxFaces }))
  }
  
  const updateCanvas = async (source, canvas, ctx, modelApplyData, settings) => {
    if (modelApplyData.length > 0) {
      // Why scale of 0.5? Presumably default resolution is 640x480 which is double
      // the size of our canvas.
      drawFaceFeatures(modelApplyData, 0.5, ctx)
    }
  }

  const updateApplyPanel = async (modelApplyData, settings) => {
    const data = []
    if (modelApplyData) {
      modelApplyData.forEach((entry, i) => {
        if (true /*entry.probability > settings.classThreshold*/) {
          data.push({
            x: `face-${i+1}`,
            y: entry.faceInViewConfidence
          })
        }
      })
    }
    // padChartSeries(data, settings.maxFaces)

    setChartData([
      {
        name: "probability",
        data: data
      }
    ])
  }

  const applySegmentationModel = async (video, settings) => {
    let modelApplyData = await model.estimateFaces({
      input: video
    })
    // console.log(modelApplyData)
    updateApplyPanel(modelApplyData, settings)
    return modelApplyData
  }

  useEffect(() => {
    loadModel(settings)
  }, [settings])

  const onClassThresholdChange = (event) => {
    setSettings({ ...settings, classThreshold: event.target.value })
  }
  
  const onMaxFacesChange = (event) => {
    setSettings({ ...settings, maxFaces: event.target.value })
  }
  
  const controlPanel = <Form>
    <Row>
      <Col>
        <Form.Label>Max faces</Form.Label>
        <RangeSlider
          value={settings.maxFaces}
          min={1}
          max={10}
          step={1}
          onChange={onMaxFacesChange}
        />   
      </Col>
    </Row>
  </Form>

  return (
    <Fragment>
      <h2>Face Landmarks Detection</h2>
      { (model &&
        <VideoPanel
          controlPanel={controlPanel}
          settings={settings}
          applyRateMS={250}
          applyModel={(source) => applySegmentationModel(source, settings)}
          updateCanvas={(source, canvas, ctx, modelData) => updateCanvas(source, canvas, ctx, modelData, settings)}
        >
          {<Chart options={DISPLAY_OPTIONS} series={chartData} type='bar' height='100%'/>}
        </VideoPanel>)
        || <Loading message={'Loading model...'}/>
      }
    </Fragment>
  )
}

export default FaceLandmarksDetection
