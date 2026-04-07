import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X } from 'lucide-react';

interface ScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
}

export function Scanner({ onScan, onClose }: ScannerProps) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      'reader',
      { fps: 10, qrbox: { width: 250, height: 250 } },
      /* verbose= */ false
    );
    scannerRef.current = scanner;

    scanner.render(
      (decodedText) => {
        scanner.clear();
        onScan(decodedText);
      },
      (err) => {
        // Ignore normal scanning errors (e.g. no barcode found in frame)
      }
    );

    return () => {
      scanner.clear().catch(console.error);
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/90 p-4">
      <div className="flex justify-end">
        <button
          onClick={onClose}
          className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
        >
          <X className="h-6 w-6" />
        </button>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center">
        <div id="reader" className="w-full max-w-sm overflow-hidden rounded-2xl bg-white" />
        <p className="mt-6 text-center text-sm text-white/70">
          Point your camera at a vinyl record's barcode or QR code.
        </p>
      </div>
    </div>
  );
}
