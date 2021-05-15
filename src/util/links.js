import BodySegmentation from '../views/BodySegmentation'
import PoseDetection from '../views/PoseDetection'
import ObjectDetection from '../views/ObjectDetection'

export const TASK_LINKS = [
  {
    label: 'Body Segmentation',
    ref: '/bodysegmentation',
    component: BodySegmentation
  },
  {
    label: 'Pose Detection',
    ref: '/posedetection',
    component: PoseDetection
  },
  {
    label: 'Object Detection',
    ref: '/objectdetection',
    component: ObjectDetection
  }
]
