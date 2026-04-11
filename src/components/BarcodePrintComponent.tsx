import React from 'react';
import Barcode from 'react-barcode';

interface BarcodePrintComponentProps {
  name: string;
  barcode: string;
  mrp: string;
}

const BarcodePrintComponent = React.forwardRef<HTMLDivElement, BarcodePrintComponentProps>(({ name, barcode, mrp }, ref) => {
  return (
    <div className="hidden">
      <div ref={ref} className="print:block p-2 bg-white text-center" style={{ width: '50mm', height: '25mm', margin: '0 auto', border: '1px solid #eee' }}>
        <div style={{ fontSize: '10px', fontWeight: '900', marginBottom: '2px', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', textTransform: 'uppercase', color: '#000' }}>
          {name}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2px' }}>
          <Barcode 
            value={barcode} 
            width={1.2} 
            height={35} 
            fontSize={10} 
            margin={0}
            background="transparent"
          />
        </div>
        <div style={{ fontSize: '11px', fontWeight: '900', color: '#000' }}>
          MRP: ₹{mrp}
        </div>
      </div>
    </div>
  );
});

export default BarcodePrintComponent;
