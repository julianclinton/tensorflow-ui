import React from 'react'
import BodySegmentation from '../views/BodySegmentation'
import ObjectDetection from '../views/ObjectDetection'

export const TASK_LINKS = [
  {
    label: 'Body Segmentation',
    ref: '/bodysegmentation',
    component: BodySegmentation
  },
  {
    label: 'Object detection',
    ref: '/objectdetection',
    component: ObjectDetection
  }
]
