import React from 'react';
import {
  Button,
  Checkbox,
  Col,
  DatePicker,
  Empty,
  Form,
  Input,
  Row,
  Select,
  Typography,
} from 'antd';
import type { BuilderNode, ComponentType } from '../state/builderTypes';
import { canDropOnTarget, isDescendant } from '../state/builderUtils';
import { componentRegistry } from '../state/componentRegistry';

const { Paragraph } = Typography;

interface BuilderCanvasProps {
  nodes: BuilderNode[];
  selectedId?: string;
  onSelect: (id: string) => void;
  onDropNew: (targetId: string | null, type: ComponentType) => void;
  onMoveNode: (nodeId: string, targetId: string | null) => void;
}

const dropDataMime = 'application/x-builder';

const BuilderCanvas: React.FC<BuilderCanvasProps> = ({
  nodes,
  selectedId,
  onSelect,
  onDropNew,
  onMoveNode,
}) => {
  const handleDragOver = (event: React.DragEvent, targetId: string | null) => {
    const hasBuilderData = Array.from(event.dataTransfer.types).includes(dropDataMime);
    if (!hasBuilderData) {
      return;
    }

    let allowDrop = true;
    let dropEffect: DataTransfer['dropEffect'] = 'move';

    try {
      const raw = event.dataTransfer.getData(dropDataMime);
      if (raw) {
        const payload = JSON.parse(raw) as { mode: string; type: ComponentType; nodeId?: string };
        if (!canDropOnTarget(nodes, targetId, payload.type)) {
          allowDrop = false;
        } else if (
          payload.mode === 'move' &&
          payload.nodeId &&
          targetId &&
          isDescendant(nodes, payload.nodeId, targetId)
        ) {
          allowDrop = false;
        } else {
          dropEffect = payload.mode === 'new' ? 'copy' : 'move';
        }
      } else {
        dropEffect = 'copy';
      }
    } catch (error) {
      dropEffect = 'copy';
    }

    if (!allowDrop) {
      event.dataTransfer.dropEffect = 'none';
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = dropEffect;
  };

  const handleDrop = (event: React.DragEvent, targetId: string | null) => {
    const raw =
      event.dataTransfer.getData(dropDataMime) || event.dataTransfer.getData('text/plain');
    if (!raw) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    try {
      const payload = JSON.parse(raw) as { mode: string; type: ComponentType; nodeId?: string };
      if (!canDropOnTarget(nodes, targetId, payload.type)) {
        return;
      }
      if (payload.mode === 'new') {
        onDropNew(targetId, payload.type);
      } else if (payload.mode === 'move' && payload.nodeId) {
        if (targetId && isDescendant(nodes, payload.nodeId, targetId)) {
          return;
        }
        onMoveNode(payload.nodeId, targetId);
      }
    } catch (error) {
      // ignore malformed data
    }
  };

  const renderChildren = (children: BuilderNode[] | undefined) => {
    if (!children || children.length === 0) {
      return (
        <div className="builder-drop-placeholder" data-placeholder>
          Drop components here
        </div>
      );
    }
    return children.map((child) => renderNode(child));
  };

  const renderContent = (node: BuilderNode, children: React.ReactNode) => {
    switch (node.type) {
      case 'Row':
        return (
          <Row gutter={node.props.gutter} justify={node.props.justify} align={node.props.align}>
            {children}
          </Row>
        );
      case 'Col':
        return (
          <Col span={node.props.span} flex={node.props.flex}>
            {children}
          </Col>
        );
      case 'Form':
        return (
          <Form layout={node.props.layout} colon={node.props.colon} disabled>
            {children}
          </Form>
        );
      case 'FormItem':
        return (
          <Form.Item label={node.props.label} name={node.props.name} required={node.props.required}>
            {children}
          </Form.Item>
        );
      case 'Button':
        return (
          <Button type={node.props.type} block={node.props.block} disabled>
            {node.props.text}
          </Button>
        );
      case 'Input':
        return <Input placeholder={node.props.placeholder} allowClear={node.props.allowClear} readOnly />;
      case 'Select':
        return (
          <Select
            placeholder={node.props.placeholder}
            options={node.props.options}
            style={{ width: '100%' }}
            disabled
          />
        );
      case 'Checkbox':
        return (
          <Checkbox checked={node.props.checked} disabled>
            {node.props.text}
          </Checkbox>
        );
      case 'DatePicker':
        return <DatePicker picker={node.props.picker} style={{ width: '100%' }} disabled />;
      case 'Paragraph':
        return <Paragraph>{node.props.text}</Paragraph>;
      default:
        return <div>{children}</div>;
    }
  };

  const renderNode = (node: BuilderNode) => {
    const config = componentRegistry[node.type];
    const isSelected = selectedId === node.id;
    const isContainer = config.supportsChildren;
    const className = [
      'builder-node',
      isSelected ? 'builder-node-selected' : '',
      isContainer ? 'builder-node-container' : 'builder-node-leaf',
    ]
      .filter(Boolean)
      .join(' ');

    const handleNodeDragStart = (event: React.DragEvent) => {
      event.dataTransfer.effectAllowed = 'move';
      const payload = JSON.stringify({ mode: 'move', nodeId: node.id, type: node.type });
      event.dataTransfer.setData(dropDataMime, payload);
      event.dataTransfer.setData('text/plain', payload);
    };

    const droppableProps = config.supportsChildren
      ? {
          onDragOver: (event: React.DragEvent) => handleDragOver(event, node.id),
          onDrop: (event: React.DragEvent) => handleDrop(event, node.id),
        }
      : undefined;

    return (
      <div
        key={node.id}
        className={className}
        draggable
        onDragStart={handleNodeDragStart}
        onClick={(event) => {
          event.stopPropagation();
          onSelect(node.id);
        }}
      >
        {isContainer ? (
          <>
            <div className="builder-node-label">{config.label}</div>
            <div className="builder-node-body" {...droppableProps}>
              {renderContent(node, renderChildren(node.children))}
            </div>
          </>
        ) : (
          <div className="builder-node-body builder-node-leaf-body">
            {renderContent(node, null)}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className="builder-canvas"
      onDragOver={(event) => handleDragOver(event, null)}
      onDrop={(event) => handleDrop(event, null)}
    >
      {nodes.length === 0 ? (
        <Empty description="Drag components here" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        nodes.map((node) => renderNode(node))
      )}
    </div>
  );
};

export default BuilderCanvas;
