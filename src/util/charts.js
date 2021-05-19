
export const padChartSeries = (existing, maxLength) => {
  for (let i = existing.length; i < maxLength; ++i) {
    existing.push({
      x: '??',
      y: 0.0
    })
  }
  return existing
}

export const createDefaultSeries = (maxLength) => {
  return [{
    name: '-',
    data: padChartSeries([], maxLength)
  }]
}

export const createDefaultCategorySeries = (categories) => {
  return [{
    name: '-',
    data: categories.map(entry => {
      return {
        x: entry,
        y: 0.0
      }
    })
  }]
}
