export type ComponentType =
  | 'Row'
  | 'Col'
  | 'Form'
  | 'FormItem'
  | 'Button'
  | 'Input'
  | 'Select'
  | 'Checkbox'
  | 'DatePicker'
  | 'Paragraph';

export interface BuilderNode {
  id: string;
  type: ComponentType;
  props: Record<string, any>;
  children?: BuilderNode[];
}

export interface ComponentConfig {
  type: ComponentType;
  label: string;
  icon?: string;
  description?: string;
  defaultProps: Record<string, any>;
  supportsChildren: boolean;
  allowedChildren?: ComponentType[];
  createChildren?: () => BuilderNode[];
}
