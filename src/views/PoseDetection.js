import React, { Fragment, useState, useEffect } from 'react'
import Form from 'react-bootstrap/Form'
import RangeSlider from 'react-bootstrap-range-slider'
import Chart from 'react-apexcharts'
import Loading from '../components/Loading'
import VideoPanel from '../components/VideoPanel'
import { BODY_PARTS } from '../util/constants'
import '@tensorflow/tfjs-backend-webgl'
const posenet = require('@tensorflow-models/posenet')

const DISPLAY_OPTIONS = {
  chart: {
    id: "basic-bar"
  },
  plotOptions: {
    bar: {
      horizontal: true
    }
  },
  xaxis: {
    categories: BODY_PARTS
  },
  yaxis: {
    min: 0.0,
    max: 1.0
  }
}

const createDefaultSeries = () => {
  return [{
    name: '-',
    data: BODY_PARTS.map(entry => {
      return {
        x: entry,
        y: 0.0
      }
    })
  }]
}

export const PoseDetection = (props) => {
  const [model, setModel] = useState(null)
  const [settings, setSettings] = useState({
    bodyThreshold: 0.3
  })
  const [segmentationData, setSegmentationData] = useState(createDefaultSeries())

  const loadModel = async () => {
    setModel(await posenet.load({
      architecture: 'MobileNetV1',
      outputStride: 16,
      inputResolution: { width: 640, height: 480 },
      multiplier: 0.75
    }))
  }
  
  const updateApplyPanel = async (modelApplyData, settings) => {
    let data = []
    if (modelApplyData && modelApplyData.length > 0) {
      modelApplyData.forEach((body, bodyIndex) => {
        // Apply the threshold when low confidence that this person exists
        console.log(`body ${bodyIndex}: score=${body.score}, threshold=${settings.bodyThreshold}`)
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
      data = createDefaultSeries()
    }

    setSegmentationData(data)
}

  const applySegmentationModel = async (video, settings) => {
     const modelApplyData = await model.estimateMultiplePoses(video)
     if (modelApplyData) {
       updateApplyPanel(modelApplyData, settings)
     }
  }

  useEffect(() => {
    loadModel()
  }, [])

  const onBodyThresholdChange = (event) => {
    setSettings({ ...settings, bodyThreshold: event.target.value })
  }
  
  const controlPanel = <Form>
    <Form.Group>
      <Form.Label>
        Body threshold
      </Form.Label>
      <RangeSlider
        value={settings.bodyThreshold}
        min={0.0}
        max={1.0}
        step={0.02}
        tooltip='on'
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
          applyModel={(source) => applySegmentationModel(source, settings)}
        >
          {<Chart options={DISPLAY_OPTIONS} series={segmentationData} type='bar' height='100%'/>}
        </VideoPanel>)
        || <Loading message={'Loading model...'}/>
      }
    </Fragment>
  )
}

export default PoseDetection
