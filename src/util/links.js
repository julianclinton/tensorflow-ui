import BodySegmentation from '../views/BodySegmentation'
import PoseDetection from '../views/PoseDetection'
import ObjectDetection from '../views/ObjectDetection'
import ImageClassification from '../views/ImageClassification'
import FaceLandmarksDetection from '../views/FaceLandmarksDetection'

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
  },
  {
    label: 'Face Landmarks Detection',
    ref: '/facelandmarksdetection',
    component: FaceLandmarksDetection
  },
  {
    label: 'Image Classification',
    ref: '/imageclassification',
    component: ImageClassification
  }
]
