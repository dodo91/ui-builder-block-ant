import React, { useState } from 'react';
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
  onDropNew: (targetId: string | null, index: number | null, type: ComponentType) => void;
  onMoveNode: (nodeId: string, targetId: string | null, index: number | null) => void;
}

const dropDataMime = 'application/x-builder';

type DropMode = 'new' | 'move';

interface DropPayload {
  mode: DropMode;
  type: ComponentType;
  nodeId?: string;
}

interface DropTarget {
  parentId: string | null;
  index: number | null;
}

const BuilderCanvas: React.FC<BuilderCanvasProps> = ({
  nodes,
  selectedId,
  onSelect,
  onDropNew,
  onMoveNode,
}) => {
  const [activeDropZone, setActiveDropZone] = useState<DropTarget | null>(null);

  const dropTargetsEqual = (a: DropTarget | null, b: DropTarget | null) => {
    if (!a || !b) {
      return a === b;
    }
    return a.parentId === b.parentId && a.index === b.index;
  };

  const getDropPayload = (event: React.DragEvent): DropPayload | null => {
    const raw =
      event.dataTransfer.getData(dropDataMime) || event.dataTransfer.getData('text/plain');
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as DropPayload;
    } catch (error) {
      return null;
    }
  };

  const evaluateDrop = (
    event: React.DragEvent,
    target: DropTarget
  ): { allow: boolean; dropEffect: DataTransfer['dropEffect']; payload?: DropPayload } => {
    const hasBuilderData = Array.from(event.dataTransfer.types).includes(dropDataMime);
    if (!hasBuilderData) {
      return { allow: false, dropEffect: 'none' };
    }
    const payload = getDropPayload(event);
    if (!payload) {
      return { allow: true, dropEffect: 'copy' };
    }
    if (!canDropOnTarget(nodes, target.parentId, payload.type)) {
      return { allow: false, dropEffect: 'none' };
    }
    if (payload.mode === 'move') {
      if (!payload.nodeId) {
        return { allow: false, dropEffect: 'none' };
      }
      if (target.parentId && isDescendant(nodes, payload.nodeId, target.parentId)) {
        return { allow: false, dropEffect: 'none' };
      }
      if (target.parentId === payload.nodeId) {
        return { allow: false, dropEffect: 'none' };
      }
      return { allow: true, dropEffect: 'move', payload };
    }
    return { allow: true, dropEffect: 'copy', payload };
  };

  const handleDragOver = (event: React.DragEvent, target: DropTarget) => {
    const { allow, dropEffect } = evaluateDrop(event, target);
    if (!allow) {
      event.dataTransfer.dropEffect = 'none';
      return false;
    }
    event.preventDefault();
    event.dataTransfer.dropEffect = dropEffect;
    return true;
  };

  const handleDragEnter = (event: React.DragEvent, target: DropTarget) => {
    if (handleDragOver(event, target) && !dropTargetsEqual(activeDropZone, target)) {
      setActiveDropZone(target);
    }
  };

  const handleDragLeave = (event: React.DragEvent, target: DropTarget) => {
    const nextTarget = event.relatedTarget as Node | null;
    if (nextTarget && event.currentTarget.contains(nextTarget)) {
      return;
    }
    if (dropTargetsEqual(activeDropZone, target)) {
      setActiveDropZone(null);
    }
  };

  const handleDrop = (event: React.DragEvent, target: DropTarget) => {
    const payload = getDropPayload(event);
    if (!payload) {
      setActiveDropZone(null);
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    if (!canDropOnTarget(nodes, target.parentId, payload.type)) {
      setActiveDropZone(null);
      return;
    }
    if (payload.mode === 'new') {
      onDropNew(target.parentId, target.index, payload.type);
    } else if (payload.mode === 'move' && payload.nodeId) {
      if (target.parentId && isDescendant(nodes, payload.nodeId, target.parentId)) {
        setActiveDropZone(null);
        return;
      }
      onMoveNode(payload.nodeId, target.parentId, target.index);
    }
    setActiveDropZone(null);
  };

  const renderDropZone = (parentId: string | null, index: number) => {
    const target: DropTarget = { parentId, index };
    const isActive = dropTargetsEqual(activeDropZone, target);
    return (
      <div
        key={`drop-${parentId ?? 'root'}-${index}`}
        className={`builder-drop-zone${isActive ? ' builder-drop-zone-active' : ''}`}
        onDragEnter={(event) => handleDragEnter(event, target)}
        onDragOver={(event) => handleDragOver(event, target)}
        onDragLeave={(event) => handleDragLeave(event, target)}
        onDrop={(event) => handleDrop(event, target)}
      />
    );
  };

  const renderEmptyPlaceholder = (parentId: string | null) => {
    const target: DropTarget = { parentId, index: 0 };
    const isActive = dropTargetsEqual(activeDropZone, target);
    return (
      <div
        key={`placeholder-${parentId ?? 'root'}`}
        className={`builder-drop-placeholder${isActive ? ' builder-drop-placeholder-active' : ''}`}
        data-placeholder
        onDragEnter={(event) => handleDragEnter(event, target)}
        onDragOver={(event) => handleDragOver(event, target)}
        onDragLeave={(event) => handleDragLeave(event, target)}
        onDrop={(event) => handleDrop(event, target)}
      >
        Drop components here
      </div>
    );
  };

  const renderChildren = (parentId: string | null, children: BuilderNode[] | undefined) => {
    if (!children || children.length === 0) {
      return renderEmptyPlaceholder(parentId);
    }
    const fragments: React.ReactNode[] = [];
    children.forEach((child, index) => {
      fragments.push(renderDropZone(parentId, index));
      fragments.push(renderNode(child));
    });
    fragments.push(renderDropZone(parentId, children.length));
    return fragments;
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
          onDragEnter: (event: React.DragEvent) =>
            handleDragEnter(event, { parentId: node.id, index: null }),
          onDragOver: (event: React.DragEvent) => handleDragOver(event, { parentId: node.id, index: null }),
          onDragLeave: (event: React.DragEvent) =>
            handleDragLeave(event, { parentId: node.id, index: null }),
          onDrop: (event: React.DragEvent) => handleDrop(event, { parentId: node.id, index: null }),
        }
      : undefined;

    return (
      <div
        key={node.id}
        className={className}
        data-node-type={node.type}
        draggable
        onDragStart={handleNodeDragStart}
        onDragEnd={() => setActiveDropZone(null)}
        onClick={(event) => {
          event.stopPropagation();
          onSelect(node.id);
        }}
      >
        {isContainer ? (
          <>
            <div className="builder-node-label">{config.label}</div>
            <div className="builder-node-body" {...droppableProps}>
              {renderContent(node, renderChildren(node.id, node.children))}
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

  const rootTarget: DropTarget = { parentId: null, index: null };

  return (
    <div
      className="builder-canvas"
      onDragEnter={(event) => handleDragEnter(event, rootTarget)}
      onDragOver={(event) => handleDragOver(event, rootTarget)}
      onDragLeave={(event) => handleDragLeave(event, rootTarget)}
      onDrop={(event) => handleDrop(event, rootTarget)}
    >
      {nodes.length === 0 ? (
        <div className="builder-empty-root" data-placeholder>
          <Empty description="Drag components here" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          {renderDropZone(null, 0)}
        </div>
      ) : (
        <>{renderChildren(null, nodes)}</>
      )}
    </div>
  );
};

export default BuilderCanvas;
