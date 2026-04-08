import { BlockMath, InlineMath } from 'react-katex'
import 'katex/dist/katex.min.css'

interface FormulaDisplayProps {
  formula: string
  inline?: boolean
  title?: string
}

export default function FormulaDisplay({ formula, inline = false, title }: FormulaDisplayProps) {
  if (inline) {
    return (
      <span style={{ display: 'inline' }}>
        <InlineMath math={formula} />
      </span>
    )
  }

  return (
    <div style={{
      background: '#f0f0f0',
      border: '2px solid #c0c0c0',
      padding: '14px',
      margin: '12px 0',
      textAlign: 'center',
      borderLeft: '4px solid #000080',
      boxShadow: '1px 1px 0 #ffffff inset, -1px -1px 0 #dfdfdf inset'
    }}>
      {title && (
        <div style={{ 
          textAlign: 'left', 
          fontSize: '13px', 
          fontWeight: 'bold',
          marginBottom: '10px',
          fontFamily: 'MS Sans Serif',
          color: '#000080'
        }}>
          {title}
        </div>
      )}
      <div style={{ fontSize: '16px', overflow: 'auto' }}>
        <BlockMath math={formula} />
      </div>
    </div>
  )
}
