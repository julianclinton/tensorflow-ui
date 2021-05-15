export const BODY_PARTS = [
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

export const BAR_CHART_DEFAULTS = {
  chart: {
    id: 'basic-bar'
  },
  plotOptions: {
    bar: {
      horizontal: false
    }
  },        
  dataLabels: {
    enabled: false
  },
  yaxis: {
    min: 0.0,
    max: 1.0,
    decimalsInFloat: 1
  }
}