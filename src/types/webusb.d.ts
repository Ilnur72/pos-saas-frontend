// Minimal WebUSB type declarations
interface USBDeviceFilter { vendorId?: number; productId?: number; classCode?: number; subclassCode?: number; protocolCode?: number; serialNumber?: string }
interface USBConfiguration { interfaces: USBInterface[] }
interface USBInterface { interfaceNumber: number; alternates: USBAlternateInterface[] }
interface USBAlternateInterface { endpoints: USBEndpoint[] }
interface USBEndpoint { type: 'bulk' | 'interrupt' | 'isochronous'; direction: 'in' | 'out'; endpointNumber: number }
interface USBTransferOutResult { status: 'ok' | 'stall' | 'babble' }
interface USBConnectionEvent extends Event { device: USBDevice }

interface USBDevice {
  vendorId: number; productId: number;
  productName?: string; manufacturerName?: string;
  configuration: USBConfiguration | null;
  open(): Promise<void>;
  close(): Promise<void>;
  selectConfiguration(n: number): Promise<void>;
  claimInterface(n: number): Promise<void>;
  releaseInterface(n: number): Promise<void>;
  transferOut(ep: number, data: BufferSource): Promise<USBTransferOutResult>;
}

interface USB extends EventTarget {
  requestDevice(options: { filters: USBDeviceFilter[] }): Promise<USBDevice>;
  addEventListener(type: 'disconnect', listener: (e: USBConnectionEvent) => void): void;
}

interface Navigator { usb: USB }
