import { Card } from 'antd';
import { useMemo } from 'react';
import type { BuilderNode } from '../state/builderTypes';

const indent = (depth: number) => '  '.repeat(depth);

const formatValue = (value: unknown, depth: number) => {
  if (typeof value === 'string') {
    return `"${value}"`;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return `{${value}}`;
  }
  if (Array.isArray(value) || (typeof value === 'object' && value !== null)) {
    const json = JSON.stringify(value, null, 2)
      .split('\n')
      .map((line, index) => (index === 0 ? line : `${indent(depth + 2)}${line}`))
      .join('\n');
    return `{${json}}`;
  }
  return '{undefined}';
};

const getComponentName = (node: BuilderNode): string => {
  switch (node.type) {
    case 'FormItem':
      return 'Form.Item';
    case 'Paragraph':
      return 'Paragraph';
    default:
      return node.type;
  }
};

const prepareProps = (node: BuilderNode, depth: number): string => {
  const props = { ...node.props };
  if (node.type === 'Button' || node.type === 'Checkbox' || node.type === 'Paragraph') {
    delete (props as any).text;
  }
  if (node.type === 'Select') {
    // ensure options are preserved as array
    props.options = props.options ?? [];
  }
  const entries = Object.entries(props).filter(([, value]) => value !== undefined && value !== '');
  if (entries.length === 0) {
    return '';
  }
  return entries
    .map(([key, value]) => ` ${key}=${formatValue(value, depth)}`)
    .join('');
};

const renderNode = (node: BuilderNode, depth: number): string => {
  const componentName = getComponentName(node);
  const propsString = prepareProps(node, depth);
  const children = node.children ?? [];
  switch (node.type) {
    case 'Button': {
      const text = node.props.text ?? 'Button';
      return `${indent(depth)}<${componentName}${propsString}>${text}</${componentName}>`;
    }
    case 'Checkbox': {
      const text = node.props.text ?? 'Checkbox';
      return `${indent(depth)}<${componentName}${propsString}>${text}</${componentName}>`;
    }
    case 'Paragraph': {
      const text = node.props.text ?? '';
      return `${indent(depth)}<${componentName}${propsString}>${text}</${componentName}>`;
    }
    case 'Input':
    case 'Select':
    case 'DatePicker': {
      return `${indent(depth)}<${componentName}${propsString} />`;
    }
    default: {
      const childContent = children.map((child) => renderNode(child, depth + 1)).join('\n');
      if (childContent) {
        return `${indent(depth)}<${componentName}${propsString}>
${childContent}
${indent(depth)}</${componentName}>`;
      }
      return `${indent(depth)}<${componentName}${propsString} />`;
    }
  }
};

const renderTree = (nodes: BuilderNode[]): string => {
  if (nodes.length === 0) {
    return '      {/* Drag components into the canvas */}';
  }
  return nodes.map((node) => renderNode(node, 3)).join('\n');
};

const generateCode = (nodes: BuilderNode[]): string => {
  return `import React from 'react';
import { Row, Col, Form, Button, Input, Select, Checkbox, DatePicker, Typography } from 'antd';

const { Paragraph } = Typography;

const GeneratedLayout: React.FC = () => {
  return (
    <>
${renderTree(nodes)}
    </>
  );
};

export default GeneratedLayout;
`;
};

interface CodePreviewProps {
  nodes: BuilderNode[];
}

const CodePreview: React.FC<CodePreviewProps> = ({ nodes }) => {
  const code = useMemo(() => generateCode(nodes), [nodes]);
  return (
    <Card title="Generated Code" size="small" bodyStyle={{ padding: 0 }}>
      <pre
        style={{
          margin: 0,
          padding: 16,
          background: '#0f172a',
          color: '#e2e8f0',
          minHeight: 240,
          overflowX: 'auto',
          fontFamily: 'Menlo, Monaco, Consolas, "Courier New", monospace',
          fontSize: 12,
        }}
      >
        {code}
      </pre>
    </Card>
  );
};

export default CodePreview;
