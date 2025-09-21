import {
  Button as AntButton,
  Divider,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Switch,
  Typography,
} from 'antd';
import type { BuilderNode } from '../state/builderTypes';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface ComponentInspectorProps {
  node?: BuilderNode;
  onUpdate: (id: string, patch: Record<string, any>) => void;
  onRemove: (id: string) => void;
}

const ComponentInspector: React.FC<ComponentInspectorProps> = ({ node, onUpdate, onRemove }) => {
  const handlePropChange = (key: string, value: any) => {
    if (!node) {
      return;
    }
    onUpdate(node.id, { [key]: value });
  };

  if (!node) {
    return (
      <div style={{ padding: 16 }}>
        <Title level={4} style={{ marginBottom: 8 }}>
          Inspector
        </Title>
        <Text type="secondary">Select a component to edit its properties.</Text>
      </div>
    );
  }

  const renderRowControls = () => (
    <>
      <Form.Item label="Gutter">
        <InputNumber
          min={0}
          value={node.props.gutter}
          onChange={(value) => handlePropChange('gutter', value ?? 0)}
          style={{ width: '100%' }}
        />
      </Form.Item>
      <Form.Item label="Justify">
        <Select
          value={node.props.justify}
          onChange={(value) => handlePropChange('justify', value)}
          options={['start', 'center', 'end', 'space-between', 'space-around'].map((option) => ({
            label: option,
            value: option,
          }))}
        />
      </Form.Item>
      <Form.Item label="Align">
        <Select
          value={node.props.align}
          onChange={(value) => handlePropChange('align', value)}
          options={['top', 'middle', 'bottom', 'stretch'].map((option) => ({
            label: option,
            value: option,
          }))}
        />
      </Form.Item>
    </>
  );

  const renderColControls = () => (
    <>
      <Form.Item label="Span">
        <InputNumber
          min={1}
          max={24}
          value={node.props.span}
          onChange={(value) => handlePropChange('span', value ?? 1)}
          style={{ width: '100%' }}
        />
      </Form.Item>
      <Form.Item label="Flex">
        <Input
          value={node.props.flex ?? ''}
          onChange={(event) => handlePropChange('flex', event.target.value || undefined)}
          placeholder="e.g. 1 1 200px"
        />
      </Form.Item>
    </>
  );

  const renderFormControls = () => (
    <>
      <Form.Item label="Layout">
        <Select
          value={node.props.layout}
          onChange={(value) => handlePropChange('layout', value)}
          options={['horizontal', 'vertical', 'inline'].map((layout) => ({ label: layout, value: layout }))}
        />
      </Form.Item>
      <Form.Item label="Show Colon">
        <Switch
          checked={node.props.colon}
          onChange={(value) => handlePropChange('colon', value)}
        />
      </Form.Item>
    </>
  );

  const renderFormItemControls = () => (
    <>
      <Form.Item label="Label">
        <Input
          value={node.props.label}
          onChange={(event) => handlePropChange('label', event.target.value)}
        />
      </Form.Item>
      <Form.Item label="Field Name">
        <Input
          value={node.props.name}
          onChange={(event) => handlePropChange('name', event.target.value)}
        />
      </Form.Item>
      <Form.Item label="Required">
        <Switch
          checked={node.props.required}
          onChange={(value) => handlePropChange('required', value)}
        />
      </Form.Item>
    </>
  );

  const renderButtonControls = () => (
    <>
      <Form.Item label="Label">
        <Input
          value={node.props.text}
          onChange={(event) => handlePropChange('text', event.target.value)}
        />
      </Form.Item>
      <Form.Item label="Type">
        <Select
          value={node.props.type}
          onChange={(value) => handlePropChange('type', value)}
          options={['default', 'primary', 'dashed', 'link', 'text'].map((type) => ({ label: type, value: type }))}
        />
      </Form.Item>
      <Form.Item label="Block">
        <Switch
          checked={Boolean(node.props.block)}
          onChange={(value) => handlePropChange('block', value)}
        />
      </Form.Item>
    </>
  );

  const renderInputControls = () => (
    <>
      <Form.Item label="Placeholder">
        <Input
          value={node.props.placeholder}
          onChange={(event) => handlePropChange('placeholder', event.target.value)}
        />
      </Form.Item>
      <Form.Item label="Allow Clear">
        <Switch
          checked={Boolean(node.props.allowClear)}
          onChange={(value) => handlePropChange('allowClear', value)}
        />
      </Form.Item>
    </>
  );

  const renderSelectControls = () => {
    const optionText = (node.props.options ?? [])
      .map((option: { label: string; value: string }) => `${option.label}:${option.value}`)
      .join('\n');
    return (
      <>
        <Form.Item label="Placeholder">
          <Input
            value={node.props.placeholder}
            onChange={(event) => handlePropChange('placeholder', event.target.value)}
          />
        </Form.Item>
        <Form.Item label="Options (label:value per line)">
          <TextArea
            rows={4}
            value={optionText}
            onChange={(event) => {
              const value = event.target.value;
              const options = value
                .split('\n')
                .map((line) => line.trim())
                .filter(Boolean)
                .map((line) => {
                  const [label, val] = line.split(':');
                  const trimmedLabel = label?.trim() ?? '';
                  const trimmedValue = (val ?? label)?.trim() ?? '';
                  return { label: trimmedLabel, value: trimmedValue };
                });
              handlePropChange('options', options);
            }}
          />
        </Form.Item>
      </>
    );
  };

  const renderCheckboxControls = () => (
    <>
      <Form.Item label="Label">
        <Input
          value={node.props.text}
          onChange={(event) => handlePropChange('text', event.target.value)}
        />
      </Form.Item>
      <Form.Item label="Checked">
        <Switch
          checked={Boolean(node.props.checked)}
          onChange={(value) => handlePropChange('checked', value)}
        />
      </Form.Item>
    </>
  );

  const renderDatePickerControls = () => (
    <>
      <Form.Item label="Picker Type">
        <Select
          value={node.props.picker}
          onChange={(value) => handlePropChange('picker', value)}
          options={['date', 'week', 'month', 'quarter', 'year'].map((picker) => ({
            label: picker,
            value: picker,
          }))}
        />
      </Form.Item>
    </>
  );

  const renderParagraphControls = () => (
    <>
      <Form.Item label="Text">
        <TextArea
          rows={3}
          value={node.props.text}
          onChange={(event) => handlePropChange('text', event.target.value)}
        />
      </Form.Item>
    </>
  );

  const renderFormForNode = () => {
    switch (node.type) {
      case 'Row':
        return renderRowControls();
      case 'Col':
        return renderColControls();
      case 'Form':
        return renderFormControls();
      case 'FormItem':
        return renderFormItemControls();
      case 'Button':
        return renderButtonControls();
      case 'Input':
        return renderInputControls();
      case 'Select':
        return renderSelectControls();
      case 'Checkbox':
        return renderCheckboxControls();
      case 'DatePicker':
        return renderDatePickerControls();
      case 'Paragraph':
        return renderParagraphControls();
      default:
        return null;
    }
  };

  return (
    <div style={{ padding: 16, height: '100%', overflowY: 'auto' }}>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <div>
          <Title level={4} style={{ marginBottom: 0 }}>
            {node.type}
          </Title>
          <Text type="secondary">Adjust component properties</Text>
        </div>
        <Form layout="vertical" colon={false} requiredMark={false} style={{ width: '100%' }}>
          {renderFormForNode()}
        </Form>
        <Divider style={{ margin: '8px 0' }} />
        <AntButton danger onClick={() => onRemove(node.id)}>
          Remove Component
        </AntButton>
      </Space>
    </div>
  );
};

export default ComponentInspector;
