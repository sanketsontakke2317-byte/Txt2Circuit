import React from 'react';
import { Handle, Position } from '@xyflow/react';

const SYMBOLS: Record<string, React.FC<any>> = {
  Resistor: () => (
    <svg width="60" height="20" viewBox="0 0 60 20" style={{ overflow: 'visible' }}>
      <path d="M 0 10 L 10 10 L 15 5 L 25 15 L 35 5 L 45 15 L 50 10 L 60 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="bevel"/>
    </svg>
  ),
  Capacitor: () => (
    <svg width="40" height="40" viewBox="0 0 40 40" style={{ overflow: 'visible' }}>
      <path d="M 0 20 L 15 20 M 25 20 L 40 20" stroke="currentColor" strokeWidth="2" />
      <path d="M 15 5 L 15 35 M 25 5 L 25 35" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
  Inductor: () => (
    <svg width="60" height="20" viewBox="0 0 60 20" style={{ overflow: 'visible' }}>
      <path d="M 0 10 L 10 10 Q 15 0 20 10 Q 25 0 30 10 Q 35 0 40 10 Q 45 0 50 10 L 60 10" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
  'DC Source': () => (
    <svg width="40" height="40" viewBox="0 0 40 40" style={{ overflow: 'visible' }}>
      <circle cx="20" cy="20" r="15" fill="none" stroke="currentColor" strokeWidth="2"/>
      <path d="M 20 10 L 20 16 M 17 13 L 23 13" stroke="currentColor" strokeWidth="1.5" />
      <path d="M 17 27 L 23 27" stroke="currentColor" strokeWidth="1.5" />
      <path d="M 20 5 L 20 0 M 20 35 L 20 40" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
  Battery: () => (
    <svg width="40" height="40" viewBox="0 0 40 40" style={{ overflow: 'visible' }}>
      <path d="M 20 0 L 20 15 M 20 25 L 20 40" stroke="currentColor" strokeWidth="2"/>
      <path d="M 10 15 L 30 15 M 15 25 L 25 25" stroke="currentColor" strokeWidth="2"/>
      <path d="M 8 5 L 14 5 M 11 2 L 11 8" stroke="currentColor" strokeWidth="1"/>
    </svg>
  ),
  Ground: () => (
    <svg width="40" height="40" viewBox="0 0 40 40" style={{ overflow: 'visible' }}>
      <path d="M 20 0 L 20 20 M 10 20 L 30 20 M 14 25 L 26 25 M 18 30 L 22 30" stroke="currentColor" strokeWidth="2"/>
    </svg>
  ),
  Diode: () => (
    <svg width="50" height="20" viewBox="0 0 50 20" style={{ overflow: 'visible' }}>
      <path d="M 0 10 L 20 10 M 30 10 L 50 10" stroke="currentColor" strokeWidth="2"/>
      <polygon points="20,5 30,10 20,15" fill="none" stroke="currentColor" strokeWidth="2"/>
      <path d="M 30 5 L 30 15" stroke="currentColor" strokeWidth="2"/>
    </svg>
  ),
  LED: () => (
    <svg width="50" height="30" viewBox="0 0 50 30" style={{ overflow: 'visible' }}>
      <path d="M 0 20 L 20 20 M 30 20 L 50 20" stroke="currentColor" strokeWidth="2"/>
      <polygon points="20,15 30,20 20,25" fill="none" stroke="currentColor" strokeWidth="2"/>
      <path d="M 30 15 L 30 25" stroke="currentColor" strokeWidth="2"/>
      <path d="M 25 10 L 35 0 M 30 0 L 35 0 L 35 5" fill="none" stroke="currentColor" strokeWidth="1"/>
      <path d="M 30 12 L 40 2 M 35 2 L 40 2 L 40 7" fill="none" stroke="currentColor" strokeWidth="1"/>
    </svg>
  ),
  'AC Source': () => (
    <svg width="40" height="40" viewBox="0 0 40 40" style={{ overflow: 'visible' }}>
      <circle cx="20" cy="20" r="15" fill="none" stroke="currentColor" strokeWidth="2"/>
      <path d="M 10 20 Q 15 10 20 20 T 30 20" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M 20 5 L 20 0 M 20 35 L 20 40" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
  OpAmp: () => (
    <svg width="60" height="60" viewBox="0 0 60 60" style={{ overflow: 'visible' }}>
      <polygon points="10,10 10,50 50,30" fill="none" stroke="currentColor" strokeWidth="2"/>
      <path d="M 0 20 L 10 20 M 0 40 L 10 40 M 50 30 L 60 30" stroke="currentColor" strokeWidth="2"/>
      <text x="14" y="24" fontSize="10" fill="currentColor">+</text>
      <text x="14" y="44" fontSize="10" fill="currentColor">-</text>
    </svg>
  ),
  NPN: () => (
    <svg width="60" height="60" viewBox="0 0 60 60" style={{ overflow: 'visible' }}>
      <circle cx="35" cy="30" r="20" fill="none" stroke="currentColor" strokeWidth="2"/>
      <path d="M 0 30 L 25 30" stroke="currentColor" strokeWidth="2" />
      <path d="M 25 15 L 25 45" stroke="currentColor" strokeWidth="3" />
      <path d="M 25 20 L 45 0 L 45 -10" stroke="currentColor" strokeWidth="2" />
      <path d="M 25 40 L 45 60 L 45 70" stroke="currentColor" strokeWidth="2" />
      <polygon points="45,60 38,55 42,48" fill="currentColor" stroke="currentColor"/>
    </svg>
  ),
  Switch: () => (
    <svg width="40" height="20" viewBox="0 0 40 20" style={{ overflow: 'visible' }}>
      <path d="M 0 10 L 10 10 M 10 10 L 25 0 M 30 10 L 40 10" stroke="currentColor" strokeWidth="2"/>
      <circle cx="10" cy="10" r="2" fill="currentColor"/>
      <circle cx="30" cy="10" r="2" fill="none" stroke="currentColor" strokeWidth="2"/>
    </svg>
  ),
  Potentiometer: () => (
    <svg width="60" height="30" viewBox="0 0 60 30" style={{ overflow: 'visible' }}>
      <path d="M 0 20 L 10 20 L 15 15 L 25 25 L 35 15 L 45 25 L 50 20 L 60 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="bevel"/>
      <path d="M 30 0 L 30 10" stroke="currentColor" strokeWidth="2"/>
      <polygon points="30,12 25,6 35,6" fill="currentColor"/>
    </svg>
  )
};

const DefaultSymbol = ({ type }: { type: string }) => (
  <div style={{ padding: '8px', border: '2px solid currentColor', borderRadius: '4px', backgroundColor: 'var(--bg-surface)' }}>
    {type}
  </div>
);

function getPinPositionInfo(type: string, index: number, total: number) {
  if (['Resistor', 'Inductor', 'Diode', 'LED', 'Switch'].includes(type)) {
    return { pos: index === 0 ? Position.Left : Position.Right, top: '50%', left: index === 0 ? '0%' : '100%' };
  }
  if (type === 'Capacitor') {
    return { pos: index === 0 ? Position.Left : Position.Right, top: '50%', left: index === 0 ? '0%' : '100%' };
  }
  if (type === 'Potentiometer') {
    if (index === 0) return { pos: Position.Left, top: '66%', left: '0%' };
    if (index === 1) return { pos: Position.Right, top: '66%', left: '100%' };
    return { pos: Position.Top, top: '0%', left: '50%' };
  }
  if (['DC Source', 'AC Source', 'Battery'].includes(type)) {
    return { pos: index === 0 ? Position.Top : Position.Bottom, left: '50%', top: index === 0 ? '0%' : '100%' };
  }
  if (type === 'Ground') {
    return { pos: Position.Top, left: '50%', top: '0%' };
  }
  if (type === 'OpAmp') {
    if (index === 0) return { pos: Position.Left, top: '33%', left: '0%' };
    if (index === 1) return { pos: Position.Left, top: '66%', left: '0%' };
    if (index === 2) return { pos: Position.Right, top: '50%', left: '100%' };
  }
  if (type === 'NPN' || type === 'PNP' || type.includes('MOSFET')) {
    if (index === 0) return { pos: Position.Left, top: '50%', left: '0%' }; // Base/Gate
    if (index === 1) return { pos: Position.Top, top: '0%', left: '75%' }; // Collector/Drain
    if (index === 2) return { pos: Position.Bottom, top: '100%', left: '75%' }; // Emitter/Source
  }
  if (type === '555 Timer' && total === 8) {
    // 8-pin DIP mapping standard: Left side (1-4), Right side (8-5)
    if (index === 0) return { pos: Position.Left, top: '20%', left: '0%' };
    if (index === 1) return { pos: Position.Left, top: '40%', left: '0%' };
    if (index === 2) return { pos: Position.Left, top: '60%', left: '0%' };
    if (index === 3) return { pos: Position.Left, top: '80%', left: '0%' };
    if (index === 4) return { pos: Position.Right, top: '80%', left: '100%' };
    if (index === 5) return { pos: Position.Right, top: '60%', left: '100%' };
    if (index === 6) return { pos: Position.Right, top: '40%', left: '100%' };
    if (index === 7) return { pos: Position.Right, top: '20%', left: '100%' };
  }
  
  const positions = [Position.Left, Position.Right, Position.Top, Position.Bottom];
  return { pos: positions[index % 4], top: '50%', left: '50%' };
}

export function BaseComponentNode({ data, selected }: any) {
  const { reference, value, unit, type } = data;
  const SymbolComp = SYMBOLS[type] || DefaultSymbol;
  
  const isVertical = ['DC Source', 'AC Source', 'Battery', 'Ground'].includes(type);
  
  return (
    <div className={`component-node ${selected ? 'selected' : ''}`} style={{ 
        position: 'relative',
        display: 'flex',
        flexDirection: isVertical ? 'row' : 'column',
        alignItems: 'center',
        gap: '8px',
        color: selected ? 'var(--primary)' : 'var(--text-main)',
    }}>
      <div className="symbol-container" style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <SymbolComp type={type} />
        {data.pins && data.pins.map((pin: any, i: number) => {
          const { pos, top, left } = getPinPositionInfo(type, i, data.pins.length);
          return (
            <React.Fragment key={pin.id}>
              <Handle
                type="target"
                position={pos}
                id={pin.id}
                style={{ 
                  top, left,
                  width: '8px', height: '8px', 
                  background: 'var(--primary)', 
                  border: '2px solid var(--bg-surface)', 
                  zIndex: 10 
                }}
              />
              <Handle
                type="source"
                position={pos}
                id={pin.id}
                style={{ 
                  top, left,
                  width: '8px', height: '8px', 
                  background: 'transparent', 
                  border: 'none', 
                  zIndex: 10 
                }}
              />
            </React.Fragment>
          );
        })}
      </div>
      
      <div className="labels" style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: isVertical ? 'flex-start' : 'center',
          fontFamily: 'monospace',
          fontSize: '12px'
      }}>
        <div style={{ fontWeight: 'bold' }}>{reference}</div>
        {value && <div style={{ color: 'var(--text-muted)' }}>{value}{unit}</div>}
      </div>
    </div>
  );
}
