import { useState, useCallback, useRef } from 'react';

interface PrinterState {
  connected: boolean;
  deviceName: string;
  error: string;
}

// USB Printer class codes and known vendor IDs
const PRINTER_FILTERS: USBDeviceFilter[] = [
  { classCode: 0x07 },         // USB Printer class (epson, star, xprinter, bixolon, rongta)
  { vendorId: 0x04b8 },        // Epson
  { vendorId: 0x0519 },        // Star Micronics
  { vendorId: 0x0483 },        // Xprinter
  { vendorId: 0x154f },        // SNBC
  { vendorId: 0x28e9 },        // Rongta / Generic
  { vendorId: 0x0dd4 },        // Custom Engineering
];

function findBulkOutEndpoint(device: USBDevice): { iface: number; ep: number } | null {
  for (const iface of device.configuration?.interfaces ?? []) {
    for (const alt of iface.alternates) {
      for (const ep of alt.endpoints) {
        if (ep.type === 'bulk' && ep.direction === 'out') {
          return { iface: iface.interfaceNumber, ep: ep.endpointNumber };
        }
      }
    }
  }
  return null;
}

export function usePrinter() {
  const [state, setState] = useState<PrinterState>({ connected: false, deviceName: '', error: '' });
  const deviceRef = useRef<USBDevice | null>(null);
  const ifaceRef = useRef<number>(0);
  const epRef = useRef<number>(1);

  const isSupported = typeof navigator !== 'undefined' && 'usb' in navigator;

  const connect = useCallback(async () => {
    if (!isSupported) {
      setState((s) => ({ ...s, error: 'WebUSB Chrome/Edge browserida ishlaydi' }));
      return false;
    }
    try {
      setState((s) => ({ ...s, error: '' }));
      const device = await navigator.usb.requestDevice({ filters: PRINTER_FILTERS });
      await device.open();

      if (device.configuration === null) {
        await device.selectConfiguration(1);
      }

      const endpoint = findBulkOutEndpoint(device);
      if (!endpoint) throw new Error('Printer endpoint topilmadi');

      await device.claimInterface(endpoint.iface);

      deviceRef.current = device;
      ifaceRef.current = endpoint.iface;
      epRef.current = endpoint.ep;

      setState({ connected: true, deviceName: device.productName ?? device.manufacturerName ?? 'Printer', error: '' });

      // Disconnect listener
      navigator.usb.addEventListener('disconnect', (e: USBConnectionEvent) => {
        if (e.device === device) {
          deviceRef.current = null;
          setState({ connected: false, deviceName: '', error: '' });
        }
      });

      return true;
    } catch (e: any) {
      const msg = e.message?.includes('No device selected') ? 'Printer tanlanmadi' : (e.message ?? 'Ulanishda xatolik');
      setState((s) => ({ ...s, connected: false, error: msg }));
      return false;
    }
  }, [isSupported]);

  const disconnect = useCallback(async () => {
    const device = deviceRef.current;
    if (!device) return;
    try {
      await device.releaseInterface(ifaceRef.current);
      await device.close();
    } catch { /* ignore */ }
    deviceRef.current = null;
    setState({ connected: false, deviceName: '', error: '' });
  }, []);

  const print = useCallback(async (data: Uint8Array): Promise<void> => {
    const device = deviceRef.current;
    if (!device) throw new Error('Printer ulanmagan');

    // Large buffers chunked — USB max transfer ~64KB
    const CHUNK = 16384;
    for (let offset = 0; offset < data.length; offset += CHUNK) {
      const chunk = data.slice(offset, offset + CHUNK);
      const result = await device.transferOut(epRef.current, chunk);
      if (result.status !== 'ok') throw new Error(`Transfer xatoligi: ${result.status}`);
    }
  }, []);

  return { connect, disconnect, print, ...state, isSupported };
}
