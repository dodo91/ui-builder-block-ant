import { nanoid } from 'nanoid';
import { BuilderNode, ComponentConfig, ComponentType } from './builderTypes';

const createNode = (
  type: ComponentType,
  props: Record<string, any>,
  children?: BuilderNode[]
): BuilderNode => ({
  id: nanoid(),
  type,
  props,
  children,
});

export const componentRegistry: Record<ComponentType, ComponentConfig> = {
  Row: {
    type: 'Row',
    label: 'Row',
    defaultProps: {
      gutter: 16,
      justify: 'start',
      align: 'top',
    },
    supportsChildren: true,
    allowedChildren: ['Col'],
    createChildren: () => [
      createNode('Col', { span: 12 }, []),
      createNode('Col', { span: 12 }, []),
    ],
  },
  Col: {
    type: 'Col',
    label: 'Column',
    defaultProps: {
      span: 12,
      flex: undefined,
    },
    supportsChildren: true,
    allowedChildren: [
      'Row',
      'Form',
      'FormItem',
      'Button',
      'Input',
      'Select',
      'Checkbox',
      'DatePicker',
      'Paragraph',
    ],
  },
  Form: {
    type: 'Form',
    label: 'Form',
    defaultProps: {
      layout: 'vertical',
      colon: false,
    },
    supportsChildren: true,
    allowedChildren: ['FormItem', 'Row', 'Col', 'Button', 'Paragraph'],
    createChildren: () => [
      createNode('FormItem', { label: 'Field Label' }, [
        createNode('Input', { placeholder: 'Enter value' }),
      ]),
    ],
  },
  FormItem: {
    type: 'FormItem',
    label: 'Form Item',
    defaultProps: {
      label: 'Field Label',
      name: 'fieldName',
      required: false,
    },
    supportsChildren: true,
    allowedChildren: ['Input', 'Select', 'Checkbox', 'DatePicker', 'Paragraph', 'Button'],
  },
  Button: {
    type: 'Button',
    label: 'Button',
    defaultProps: {
      text: 'Submit',
      type: 'primary',
      block: false,
    },
    supportsChildren: false,
  },
  Input: {
    type: 'Input',
    label: 'Input',
    defaultProps: {
      placeholder: 'Input',
      allowClear: true,
    },
    supportsChildren: false,
  },
  Select: {
    type: 'Select',
    label: 'Select',
    defaultProps: {
      placeholder: 'Select option',
      options: [
        { label: 'Option A', value: 'a' },
        { label: 'Option B', value: 'b' },
      ],
    },
    supportsChildren: false,
  },
  Checkbox: {
    type: 'Checkbox',
    label: 'Checkbox',
    defaultProps: {
      text: 'Accept terms',
      checked: false,
    },
    supportsChildren: false,
  },
  DatePicker: {
    type: 'DatePicker',
    label: 'Date Picker',
    defaultProps: {
      picker: 'date',
    },
    supportsChildren: false,
  },
  Paragraph: {
    type: 'Paragraph',
    label: 'Paragraph',
    defaultProps: {
      text: 'Descriptive text goes here.',
    },
    supportsChildren: false,
  },
};

export const componentList: ComponentConfig[] = Object.values(componentRegistry);

export const createDefaultNode = (type: ComponentType): BuilderNode => {
  const config = componentRegistry[type];
  const children = config.createChildren ? config.createChildren() : config.supportsChildren ? [] : undefined;
  return {
    id: nanoid(),
    type,
    props: { ...config.defaultProps },
    children,
  };
};

export const canAcceptChild = (parentType: ComponentType, childType: ComponentType): boolean => {
  const parent = componentRegistry[parentType];
  if (!parent || !parent.supportsChildren) {
    return false;
  }
  if (!parent.allowedChildren || parent.allowedChildren.length === 0) {
    return true;
  }
  return parent.allowedChildren.includes(childType);
};
