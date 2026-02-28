export interface Configuration {
  url?: string;
  token?: string;
  climate?: string;
  light?: string;
}

export interface HAState {
  state: string;
  attributes: {
    current_temperature?: number;
    temperature?: number;
    [key: string]: any;
  };
}
