import BodyPix from '../views/BodyPix'
import PoseDetection from '../views/PoseDetection'
import ObjectDetection from '../views/ObjectDetection'
import ImageClassification from '../views/ImageClassification'
import FaceLandmarksDetection from '../views/FaceLandmarksDetection'
import HandDetection from '../views/HandDetection'
import HandPoseDetection from '../views/HandPoseDetection'

export const TASK_LINKS = [
  {
    label: 'Body Pix (Legacy)',
    ref: '/bodypix',
    component: BodyPix
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
    label: 'Hand Detection (Single)',
    ref: '/handdetection',
    component: HandDetection
  },
  {
    label: 'Hand Pose Detection (Multiple)',
    ref: '/handposedetection',
    component: HandPoseDetection
  },
  {
    label: 'Image Classification',
    ref: '/imageclassification',
    component: ImageClassification
  }
]
