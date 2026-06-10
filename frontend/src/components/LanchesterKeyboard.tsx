import React from 'react';

interface LanchesterKeyboardProps {
  onInsert: (text: string) => void;
  onClear: () => void;
}

export default function LanchesterKeyboard({ onInsert, onClear }: LanchesterKeyboardProps) {
  const categories = {
    "Parámetros": ['α', 'β', 'γ', 'ε', 'μ', 'δ'],
    "Aritmética": ['+', '-', '*', '/', '**', '(', ')', 'x', 'y'],
    "Constantes": ['pi', 'e']
  };

  return (
    <div style={{ 
      padding: '15px', 
      backgroundColor: '#f8f9fa', 
      borderRadius: '8px', 
      border: '1px solid #ddd',
      marginTop: '10px'
    }}>
      {Object.entries(categories).map(([name, keys]) => (
        <div key={name} style={{ marginBottom: '10px' }}>
          <small style={{ color: '#666', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>{name}</small>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
            {keys.map(key => (
              <button
                key={key}
                type="button"
                onClick={() => onInsert(key)}
                style={{
                  padding: '6px 10px',
                  minWidth: '40px',
                  cursor: 'pointer',
                  backgroundColor: '#fff',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '13px'
                }}
              >
                {key}
              </button>
            ))}
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={onClear}
        style={{
          width: '100%',
          marginTop: '10px',
          padding: '8px',
          backgroundColor: '#dc3545',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Limpiar Todo (C)
      </button>
    </div>
  );
}
