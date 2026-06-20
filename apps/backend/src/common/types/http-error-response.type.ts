export type HttpErrorResponse = {
  statusCode: number;
  timestamp: string;
  path: string;
  method: string;
  message: string | string[];
  /** Legacy Nest error label */
  error?: string;
  /** Stable machine-readable code */
  code?: string;
  details?: unknown;
  requestId?: string;
};
