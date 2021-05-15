import React, { Fragment, useState, useEffect } from 'react'
import Chart from 'react-apexcharts'
import Loading from '../components/Loading'
import VideoPanel from '../components/VideoPanel'
import { BAR_CHART_DEFAULTS } from '../util/constants'
require('@tensorflow/tfjs-backend-cpu')
require('@tensorflow/tfjs-backend-webgl')
const cocoSsd = require('@tensorflow-models/coco-ssd')

const DISPLAY_OPTIONS = { ...BAR_CHART_DEFAULTS }

export const ObjectSegmentation = (props) => {
  const [model, setModel] = useState(null)
  const [segmentationData, setSegmentationData] = useState([])

  const loadModel = async () => {
    setModel(await cocoSsd.load(/** optional arguments, see docs **/))
  }
  
  const updateApplyPanel = async (modelApplyData, settings) => {
    if (modelApplyData) {
      const data = modelApplyData.map((entry) => {
        return {
          x: entry.class,
          y: entry.score
        }
      })
      setSegmentationData([
        {
          name: "confidences",
          data: data
        }
      ])
    }
  }

  const applySegmentationModel = async (video, settings) => {
    const modelApplyData = await model.detect(video)
    if (modelApplyData) {
      updateApplyPanel(modelApplyData, settings)
    }
  }

  useEffect(() => {
    loadModel()
  }, [])

  return (
    <Fragment>
      <h2>Object Detection</h2>
      { (model &&
        <VideoPanel
          applyRateMS={500}
          applyModel={(source) => applySegmentationModel(source, null)}
        >
          {<Chart options={DISPLAY_OPTIONS} series={segmentationData} type='bar' height='100%'/>}
        </VideoPanel>)
        || <Loading message={'Loading model...'}/>
      }
    </Fragment>
  )
}

export default ObjectSegmentation
