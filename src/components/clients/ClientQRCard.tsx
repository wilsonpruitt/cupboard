import { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';
import type { Client } from '@/types';

// ---------------------------------------------------------------------------
// Single QR Card
// ---------------------------------------------------------------------------

interface ClientQRCardProps {
  client: Client;
}

export function ClientQRCard({ client }: ClientQRCardProps) {
  const { settings } = useSettings();
  const printRef = useRef<HTMLDivElement>(null);

  function handlePrint() {
    if (!printRef.current) return;

    const printContent = printRef.current.innerHTML;
    const printWindow = window.open('', '_blank', 'width=400,height=300');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Card - ${client.firstName} ${client.lastName}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: system-ui, -apple-system, sans-serif; }
            @page { size: 3.5in 2in; margin: 0; }
            .qr-card {
              width: 3.5in;
              height: 2in;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              gap: 4px;
              padding: 8px;
            }
            .qr-card .header {
              font-size: 7pt;
              font-weight: 600;
              color: #666;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .qr-card .name {
              font-size: 12pt;
              font-weight: 700;
              color: #1a1a1a;
            }
            .qr-card .family {
              font-size: 8pt;
              color: #666;
            }
          </style>
        </head>
        <body>
          ${printContent}
          <script>window.onload = function() { window.print(); window.close(); }<\/script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }

  return (
    <div className="space-y-3">
      <div ref={printRef}>
        <div className="qr-card">
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <div className="text-center space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {settings.pantryName}
              </p>
              <QRCodeSVG value={client.id} size={120} level="M" />
              <p className="text-lg font-bold">
                {client.firstName} {client.lastName}
              </p>
              <p className="text-sm text-muted-foreground">
                Family of {client.numberInFamily}
              </p>
            </div>
          </div>
        </div>
      </div>

      <Button onClick={handlePrint} variant="outline" className="w-full">
        <Printer className="size-4" />
        Print Card
      </Button>
    </div>
  );
}
