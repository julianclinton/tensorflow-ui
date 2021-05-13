import React, { Fragment, useState, useEffect } from 'react'
import Chart from 'react-apexcharts'
import VideoPanel from '../components/VideoPanel'
require('@tensorflow/tfjs-backend-cpu')
require('@tensorflow/tfjs-backend-webgl')
const cocoSsd = require('@tensorflow-models/coco-ssd')

const DISPLAY_OPTIONS = {
  chart: {
    id: "basic-bar"
  },
  plotOptions: {
    bar: {
      horizontal: true
    }
  },        
  yaxis: {
    min: 0.0,
    max: 1.0
  }
}

export const ObjectSegmentation = (props) => {
  const [model, setModel] = useState(null)
  const [segmentationData, setSegmentationData] = useState([])

  const loadModel = async () => {
    setModel(await cocoSsd.load(/** optional arguments, see docs **/))
  }
  
  const updateApplyPanel = async (modelApplyData) => {
    if (modelApplyData) {
      const data = modelApplyData.map((entry) => {
        return {
          x: entry.class,
          y: entry.score
        }
      })
      // console.log(data)
      setSegmentationData([
        {
          name: "confidences",
          data: data
        }
      ])
    }
  }

  const applySegmentationModel = async (video) => {
     const modelApplyData = await await model.detect(video)
     if (modelApplyData) {
       updateApplyPanel(modelApplyData)
     }
  }

  useEffect(() => {
    loadModel()
  }, [])

  return (
    <Fragment>
      <h1>Object Detection</h1>
      { model &&
        <VideoPanel
          applyRateMS={500}
          applyModel={applySegmentationModel}
          applyPanel={<Chart options={DISPLAY_OPTIONS} series={segmentationData} type="bar" height={480} />}
        />
      }
    </Fragment>
  )
}

export default ObjectSegmentation
