import { useEffect, useRef } from 'react'
import Plotly from 'plotly.js-dist-min'

interface PlotlyGraphProps {
  data: any[]
  layout?: any
  title?: string
}

export default function PlotlyGraph({ data, layout, title }: PlotlyGraphProps) {
  const graphDiv = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (graphDiv.current && data && data.length > 0) {
      const defaultLayout = {
        title: title || 'Gráfico',
        xaxis: { title: 'x' },
        yaxis: { title: 'y' },
        responsive: true,
        ...layout
      }

      Plotly.newPlot(graphDiv.current, data, defaultLayout, { responsive: true })

      return () => {
        if (graphDiv.current) {
          Plotly.purge(graphDiv.current)
        }
      }
    }
  }, [data, layout, title])

  return (
    <div 
      ref={graphDiv} 
      style={{ 
        width: '100%', 
        height: '400px', 
        border: '1px solid #ddd',
        borderRadius: '8px'
      }} 
    />
  )
}
