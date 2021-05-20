import React, { Fragment, useState, useEffect } from 'react'
import Form from 'react-bootstrap/Form'
import RangeSlider from 'react-bootstrap-range-slider'
import Chart from 'react-apexcharts'
import Loading from '../components/Loading'
import VideoPanel from '../components/VideoPanel'
import { BODY_PARTS, BAR_CHART_DEFAULTS } from '../util/constants'
import { drawBoundingBox, drawSkeleton } from '../util/drawing'
import { createDefaultCategorySeries } from '../util/charts'
import '@tensorflow/tfjs-backend-webgl'
const posenet = require('@tensorflow-models/posenet')

const DISPLAY_OPTIONS = {
  ...BAR_CHART_DEFAULTS,
  xaxis: {
    categories: BODY_PARTS
  }
}

export const PoseDetection = (props) => {
  const [model, setModel] = useState(null)
  const [settings, setSettings] = useState({
    bodyThreshold: 0.3
  })
  const [chartData, setChartData] = useState(createDefaultCategorySeries(BODY_PARTS))

  const loadModel = async () => {
    setModel(await posenet.load({
      architecture: 'MobileNetV1',
      outputStride: 16,
      inputResolution: { width: 640, height: 480 },
      multiplier: 0.75
    }))
  }
  
  const updateCanvas = async (source, canvas, ctx, modelApplyData, settings) => {
    if (modelApplyData.length > 0) {
      modelApplyData.forEach((body, index) => {
        // Apply the threshold when low confidence that this person exists
        // console.log(`body ${index}: score=${body.score}, threshold=${settings.bodyThreshold}`)
        if (body.score > settings.bodyThreshold) {
          drawBoundingBox(body.keypoints, ctx)
          drawSkeleton(body.keypoints, 0.1, ctx, 1)
        }
      })
    }
  }

  const updateApplyPanel = async (modelApplyData, settings) => {
    let data = []
    if (modelApplyData && modelApplyData.length > 0) {
      modelApplyData.forEach((body, index) => {
        // Apply the threshold when low confidence that this person exists
        // console.log(`body ${index}: score=${body.score}, threshold=${settings.bodyThreshold}`)
        if (body.score > settings.bodyThreshold) {
          const bodyData = body.keypoints.map((entry) => {
              return {
              x: entry.part,
              y: entry.score
            }
          })

          data.push({
            name: `body-${index + 1}`,
            data: bodyData
          })
        }
      })
    } else {
      data = createDefaultCategorySeries(BODY_PARTS)
    }

    setChartData(data)
}

  const applySegmentationModel = async (video, canvas, settings) => {
    let modelApplyData = await model.estimateMultiplePoses(video)
    updateApplyPanel(modelApplyData, settings)
    return modelApplyData
  }

  useEffect(() => {
    loadModel()
  }, [])

  const onBodyThresholdChange = (event) => {
    setSettings({ ...settings, bodyThreshold: event.target.value })
  }
  
  const controlPanel = <Form>
    <Form.Group>
      <Form.Label>Body threshold</Form.Label>
      <RangeSlider
        value={settings.bodyThreshold}
        min={0.0}
        max={1.0}
        step={0.02}
        onChange={onBodyThresholdChange}
      />   
    </Form.Group>
  </Form>

  return (
    <Fragment>
      <h2>Pose Detection</h2>
      { (model &&
        <VideoPanel 
          controlPanel={controlPanel}
          settings={settings}
          applyRateMS={250}
          applyModel={(source, canvas) => applySegmentationModel(source, canvas, settings)}
          updateCanvas={(source, canvas, ctx, modelData) => updateCanvas(source, canvas, ctx, modelData, settings)}
        >
          {<Chart options={DISPLAY_OPTIONS} series={chartData} type='bar' height='100%'/>}
        </VideoPanel>)
        || <Loading message={'Loading model...'}/>
      }
    </Fragment>
  )
}

export default PoseDetection
