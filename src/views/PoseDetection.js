import React, { Fragment, useState, useEffect } from 'react'
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
  const [segmentationData, setSegmentationData] = useState(createDefaultSeries())

  const loadModel = async () => {
    setModel(await posenet.load({
      architecture: 'MobileNetV1',
      outputStride: 16,
      inputResolution: { width: 640, height: 480 },
      multiplier: 0.75
    }))
  }
  
  const updateApplyPanel = async (modelApplyData) => {
    let data = []
    if (modelApplyData && modelApplyData.length > 0) {
      modelApplyData.forEach((body, bodyIndex) => {
        // Threshold when low confidence that this person exists
        if (body.score > 0.3) {
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

  const applySegmentationModel = async (video) => {
    /**
     * One of (see documentation below):
     *   - net.segmentPerson
     *   - net.segmentPersonParts
     *   - net.segmentMultiPerson
     *   - net.segmentMultiPersonParts
     * See documentation for details on each method.
     */
     const modelApplyData = await await model.estimateMultiplePoses(video)
     console.log(modelApplyData)
     if (modelApplyData) {
       updateApplyPanel(modelApplyData)
     }
  }

  useEffect(() => {
    loadModel()
  }, [])

  return (
    <Fragment>
      <h2>Pose Detection</h2>
      { (model &&
        <VideoPanel 
          applyRateMS={250}
          applyModel={applySegmentationModel}
        >
          {<Chart options={DISPLAY_OPTIONS} series={segmentationData} type="bar" height='100%'/>}
        </VideoPanel>)
        || <Loading message={'Loading model...'}/>
      }
    </Fragment>
  )
}

export default PoseDetection
