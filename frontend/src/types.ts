export interface Pin {
  id: string;
  name: string;
  x?: number;
  y?: number;
}

export interface ComponentData {
  id: string;
  type: string;
  reference: string;
  value?: number | string;
  unit?: string;
  pins: Pin[];
  properties: Record<string, any>;
  electricalModel?: string;
  position: { x: number; y: number };
  rotation?: number;
}

export interface ConnectionData {
  id: string;
  sourceComponent: string;
  sourcePin: string;
  targetComponent: string;
  targetPin: string;
  netId?: string;
}

export interface CircuitModel {
  id: string;
  name: string;
  description?: string;
  components: ComponentData[];
  connections: ConnectionData[];
  nodes?: string[];
  parameters?: Record<string, any>;
  assumptions?: string[];
  validation?: {
    isValid: boolean;
    errors: string[];
  };
  analysisSettings?: Record<string, any>;
  currentVersion: number;
}
