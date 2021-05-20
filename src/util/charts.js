
export const padChartSeries = (existing, maxLength, formatter) => {
  for (let i = existing.length; i < maxLength; ++i) {
    existing.push({
      x: formatter ? formatter(i) : '??',
      y: 0.0
    })
  }
  return existing
}

export const createDefaultSeries = (maxLength, formatter) => {
  return [{
    name: '-',
    data: padChartSeries([], maxLength, formatter)
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
