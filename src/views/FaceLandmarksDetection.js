import React, { Fragment, useState, useEffect } from 'react'
import Form from 'react-bootstrap/Form'
import Col from 'react-bootstrap/Col'
import Row from 'react-bootstrap/Row'
import ButtonGroup from 'react-bootstrap/ButtonGroup'
import ToggleButton from 'react-bootstrap/ToggleButton'
import RangeSlider from 'react-bootstrap-range-slider'
import Chart from 'react-apexcharts'
import Loading from '../components/Loading'
import VideoPanel from '../components/VideoPanel'
import { BAR_CHART_DEFAULTS } from '../util/constants'
import { padChartSeries, createDefaultSeries } from '../util/charts'
import { GREEN, RED, distance, drawPath } from '../util/drawing'
import { TRIANGULATION } from '../util/triangulation'
import '@tensorflow/tfjs-backend-cpu'
import '@tensorflow/tfjs-backend-webgl'
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection'

const DISPLAY_OPTIONS = { ...BAR_CHART_DEFAULTS }

const CANVAS_OPTIONS = [
  {
    label: 'Points',
    value: 'points'
  },
  {
    label: 'Mesh',
    value: 'mesh'
  }
]

const NUM_KEYPOINTS = 468
const NUM_IRIS_KEYPOINTS = 5

const drawFaceFeatures = (result, settings, scale, ctx) => {
  if (result.length > 0) {
    result.forEach(face => {
      const keypoints = face.keypoints.map((keypoint) => [keypoint.x, keypoint.y])

      if (settings.displayStyle === 'mesh') {
        ctx.strokeStyle = GREEN
        ctx.lineWidth = 0.5

        for (let i = 0; i < TRIANGULATION.length / 3; i++) {
          const points = [
            TRIANGULATION[i * 3],
            TRIANGULATION[i * 3 + 1],
            TRIANGULATION[i * 3 + 2],
          ].map((index) => keypoints[index])
  
          drawPath(ctx, points, GREEN, scale, true)
        }
      } else {
        ctx.fillStyle = GREEN

        for (let i = 0; i < NUM_KEYPOINTS; i++) {
          const x = scale * keypoints[i][0]
          const y = scale * keypoints[i][1]

          ctx.beginPath()
          ctx.arc(x, y, 1 /* radius */, 0, 2 * Math.PI)
          ctx.fill()
        }
      }

      // Draw irises
      if (keypoints.length > NUM_KEYPOINTS) {
        ctx.strokeStyle = RED
        ctx.lineWidth = 1

        const leftCenter = keypoints[NUM_KEYPOINTS];
        const leftDiameterY = distance(
          keypoints[NUM_KEYPOINTS + 4],
          keypoints[NUM_KEYPOINTS + 2])
        const leftDiameterX = distance(
          keypoints[NUM_KEYPOINTS + 3],
          keypoints[NUM_KEYPOINTS + 1])

        ctx.beginPath()
        ctx.ellipse(scale * leftCenter[0], scale * leftCenter[1], leftDiameterX / 2, leftDiameterY / 2, 0, 0, 2 * Math.PI)
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
          ctx.ellipse(scale * rightCenter[0], scale * rightCenter[1], rightDiameterX / 2, rightDiameterY / 2, 0, 0, 2 * Math.PI)
          ctx.stroke()
        }
      }
    })
  }
}

const categoryFormatter = (index) => `face-${index + 1}`

export const FaceLandmarksDetection = (props) => {
  const [model, setModel] = useState(null)
  const [settings, setSettings] = useState({
    maxFaces: 3,
    displayStyle: 'points'
  })
  const [chartData, setChartData] = useState(createDefaultSeries(3, categoryFormatter))

  const loadModel = async (settings) => {
    setModel(await faceLandmarksDetection.createDetector(faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh,
      {
        runtime: 'tfjs',
        maxFaces: settings.maxFaces,
        refineLandmarks: true
      }))
  }
  
  const updateCanvas = async (source, canvas, ctx, modelApplyData, settings) => {
    if (modelApplyData.length > 0) {
      // Presumably default resolution is 640x480 so factor relative to
      // the size of our canvas.
      const scale = canvas.width / 640.0
      drawFaceFeatures(modelApplyData, settings, scale, ctx)
    }
  }

  const updateApplyPanel = async (modelApplyData, settings) => {
    const data = []
    if (modelApplyData) {
      modelApplyData.forEach((entry, i) => {
        if (true /*entry.probability > settings.classThreshold*/) {
          data.push({
            x: categoryFormatter(i),
            y: entry.faceInViewConfidence
          })
        }
      })
    }
    padChartSeries(data, settings.maxFaces, categoryFormatter)

    setChartData([
      {
        name: 'confidence',
        data: data
      }
    ])
  }

  const applySegmentationModel = async (video, canvas, settings) => {
    let modelApplyData = await model.estimateFaces(video, {flipHorizontal: false})
    updateApplyPanel(modelApplyData, settings)
    return modelApplyData
  }

  useEffect(() => {
    loadModel(settings)
  }, [settings])

  const onDisplayStyleChange = (event) => {
    setSettings({ ...settings, displayStyle: event.target.value })
  }
  
  const onMaxFacesChange = (event) => {
    const maxFaces = event.target.value
    setSettings({ ...settings, maxFaces: maxFaces })
    setChartData(createDefaultSeries(maxFaces, categoryFormatter))
  }
  
  const controlPanel = <Form>
    <Row>
      <Col>
        <Form.Label>Max faces </Form.Label>
        <RangeSlider
          value={settings.maxFaces}
          min={1}
          max={10}
          step={1}
          onChange={onMaxFacesChange}
        />   
      </Col>
      <Col>
        <Form.Label>Display as </Form.Label>
        <ButtonGroup type='radio'>
          {CANVAS_OPTIONS.map((radio, idx) => (
            <ToggleButton
              key={idx}
              type='radio'
              variant='light'
              name='radio'
              value={radio.value}
              checked={settings.displayStyle === radio.value}
              onChange={(onDisplayStyleChange)}
            >
              {` ${radio.label}`}
            </ToggleButton>
          ))}
        </ButtonGroup>
      </Col>
    </Row>
  </Form>

  // TODO - make chart optional
  const chart = <Chart options={DISPLAY_OPTIONS} series={chartData} type='bar' height='100%'/>
  return (
    <Fragment>
      <h2>Face Landmarks Detection</h2>
      { (model &&
        <VideoPanel
          controlPanel={controlPanel}
          settings={settings}
          sourceSize='default'
          applyRateMS={100}
          applyModel={(source, canvas) => applySegmentationModel(source, canvas, settings)}
          updateCanvas={(source, canvas, ctx, modelData) => updateCanvas(source, canvas, ctx, modelData, settings)}
        >
          
        </VideoPanel>)
        || <Loading message={'Loading model...'}/>
      }
    </Fragment>
  )
}

export default FaceLandmarksDetection
