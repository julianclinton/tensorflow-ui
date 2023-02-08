import React, { Fragment, useState, useEffect } from 'react'
import Form from 'react-bootstrap/Form'
import Col from 'react-bootstrap/Col'
import Row from 'react-bootstrap/Row'
import RangeSlider from 'react-bootstrap-range-slider'
import Chart from 'react-apexcharts'
import Loading from '../components/Loading'
import VideoPanel from '../components/VideoPanel'
import { BODY_PARTS, BAR_CHART_DEFAULTS } from '../util/constants'
import { drawBoundingBox, drawSkeleton } from '../util/drawing'
import { createDefaultCategorySeries } from '../util/charts'
import '@tensorflow/tfjs-backend-webgl'
const bodySegmentation = require('@tensorflow-models/body-segmentation')

const DISPLAY_OPTIONS = {
  ...BAR_CHART_DEFAULTS,
  xaxis: {
    categories: BODY_PARTS
  }
}

const BODY_SEGMENTATION_CONFIG = {
  runtime: 'mediapipe', // or 'tfjs'
  solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation',
  modelType: 'general'
}

const BLAZE_POSE_CONFIG = {
  maxPoses: 1,
  type: 'full',
  visualization: 'binaryMask'
}

export const BodySegmentation = (props) => {
  const [model, setModel] = useState(null)
  const [settings, setSettings] = useState({
    segmentationMode: 'segmentPeople',
    bodyThreshold: 0.3
  })
  const [chartData, setChartData] = useState(createDefaultCategorySeries(BODY_PARTS))

  const loadModel = async () => {
    setModel(await bodySegmentation.createSegmenter(bodySegmentation.SupportedModels.MediaPipeSelfieSegmentation,
      {
        ...BODY_SEGMENTATION_CONFIG
      }))
  }
  
  const getFeatureData = (modelApplyData, settings) => {
    let featureData
    switch (settings.segmentationMode) {
      case 'segmentPeople':
        featureData = modelApplyData.allPoses; break
      case 'segmentEstimatePoses':
        featureData = modelApplyData.map(entry => entry.pose); break
      default:
        featureData = null
    }
    return featureData
  }

  const updateCanvas = async (source, canvas, ctx, modelApplyData, settings) => {
    const featureData = getFeatureData(modelApplyData, settings)
    if (featureData) {
      featureData.forEach((body, bodyIndex) => {
        // Apply the threshold when low confidence that this person exists
        // console.log(`body ${bodyIndex}: score=${body.score}, threshold=${settings.bodyThreshold}`)
        if (body.score > settings.bodyThreshold) {
          drawBoundingBox(body.keypoints, ctx)
          drawSkeleton(body.keypoints, 0.1, ctx, 1)
        }
      })
    }
  }

  const updateApplyPanel = async (modelApplyData, settings) => {
    const featureData = getFeatureData(modelApplyData, settings)

    let data = []
    if (featureData) {
      featureData.forEach((body, bodyIndex) => {
        // Apply the threshold when low confidence that this person exists
        // console.log(`body ${bodyIndex}: score=${body.score}, threshold=${settings.bodyThreshold}`)
        if (body.score > settings.bodyThreshold) {
          const bodyData = body.keypoints.map((entry) => {
              return {
              x: entry.part,
              y: entry.score
            }
          })

          data.push({
            name: `body-${bodyIndex + 1}`,
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
    /**
     * One of:
     *   - net.segmentPeople
     *   - net.segmentEstimatePoses
     * See documentation for details on each method.
     */
    let fn
    switch (settings.segmentationMode) {
      case 'segmentPeople':
        fn = model.segmentPeople; break
      case 'segmentEstimatePoses':
        fn = model.estimatePoses; break
      default:
        fn = null
    }

    let modelApplyData
    if (fn) {
      try {
        modelApplyData = await fn.call(model, video)
        updateApplyPanel(modelApplyData, settings)
      } catch (err) {
        console.log(`Error: ${err.message}`)
      }
    }
    return modelApplyData
  }

  const onSegmentationChange = (event) => {
    setSettings({ ...settings, segmentationMode: event.target.value })
  }

  const onBodyThresholdChange = (event) => {
    setSettings({ ...settings, bodyThreshold: event.target.value })
  }
  
  useEffect(() => {
    loadModel()
  }, [])

  const controlPanel = <Form>
    <Row>
      <Col>
        <Form.Label>Segmentation</Form.Label>
        <Form.Control value={settings.segmentationMode} as='select' onChange={onSegmentationChange}>
          <option value='segmentPeople'>People</option>
          <option value='segmentEstimatePoses'>Estimate poses</option>
        </Form.Control>
      </Col>
      <Col>
        <Form.Label>Body threshold</Form.Label>
        <RangeSlider
          value={settings.bodyThreshold}
          min={0.0}
          max={1.0}
          step={0.02}
          onChange={onBodyThresholdChange}
        />   
      </Col>
    </Row>
  </Form>

  return (
    <Fragment>
      <h2>Body Segmentation</h2>
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

export default BodySegmentation
