interface IterationsTableProps {
  iterations: any[]
  title?: string
}

export default function IterationsTable({ iterations, title = "Tabla de Iteraciones" }: IterationsTableProps) {
  if (!iterations || iterations.length === 0) {
    return <div>No hay iteraciones para mostrar</div>
  }

  const headers = Object.keys(iterations[0])

  return (
    <div style={{ marginTop: '20px', overflowX: 'auto' }}>
      <h3>{title}</h3>
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: '0.9em'
      }}>
        <thead>
          <tr style={{ backgroundColor: '#f5f5f5' }}>
            {headers.map(header => (
              <th key={header} style={{
                padding: '10px',
                border: '1px solid #ddd',
                textAlign: 'left',
                color: '#667eea',
                fontWeight: 'bold'
              }}>
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {iterations.map((row, idx) => (
            <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#fff' : '#f9f9f9' }}>
              {headers.map(header => (
                <td key={`${idx}-${header}`} style={{
                  padding: '8px 10px',
                  border: '1px solid #ddd',
                  textAlign: typeof row[header] === 'number' ? 'right' : 'left'
                }}>
                  {typeof row[header] === 'number' 
                    ? header === 'i' 
                      ? Math.round(row[header])
                      : row[header].toFixed(6)
                    : row[header]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
