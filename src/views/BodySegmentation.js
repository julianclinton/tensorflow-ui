import React, { Fragment, useState, useEffect } from 'react'
import Chart from 'react-apexcharts'
import VideoPanel from '../components/VideoPanel'
import '@tensorflow/tfjs-backend-webgl'
const bodyPix = require('@tensorflow-models/body-pix')

const BODY_PARTS = [
  "nose",
  "leftEye",
  "rightEye",
  "leftEar",
  "rightEar",
  "leftShoulder",
  "rightShoulder",
  "leftElbow",
  "rightElbow",
  "leftWrist",
  "rightWrist",
  "leftHip",
  "rightHip",
  "leftKnee",
  "rightKnee",
  "leftAnkle",
  "rightAnkle"
]

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

export const BodySegmentation = (props) => {
  const [model, setModel] = useState(null)
  const [segmentationData, setSegmentationData] = useState([])

  const loadModel = async () => {
    setModel(await bodyPix.load(/** optional arguments, see docs **/))
  }
  
  const updateApplyPanel = async (modelApplyData) => {
    if (modelApplyData.allPoses) {
      // For now assume a consistent order which is the same as BODY_PARTS
      const data = modelApplyData.allPoses[0].keypoints.map((entry) => entry.score)
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
    /**
     * One of (see documentation below):
     *   - net.segmentPerson
     *   - net.segmentPersonParts
     *   - net.segmentMultiPerson
     *   - net.segmentMultiPersonParts
     * See documentation for details on each method.
     */
     const modelApplyData = await await model.segmentPerson(video)
     if (modelApplyData) {
       updateApplyPanel(modelApplyData)
     }
  }

  useEffect(() => {
    loadModel()
  }, [])

  return (
    <Fragment>
      <h1>Body Segmentation</h1>
      { model &&
        <VideoPanel 
          applyModel={applySegmentationModel}
          applyPanel={<Chart options={DISPLAY_OPTIONS} series={segmentationData} type="bar" height={480} />}
        />
      }
    </Fragment>
  )
}

export default BodySegmentation
