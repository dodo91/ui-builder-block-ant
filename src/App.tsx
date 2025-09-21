import { Layout, message } from 'antd';
import { useMemo, useState } from 'react';
import './App.css';
import BuilderCanvas from './components/BuilderCanvas';
import CodePreview from './components/CodePreview';
import ComponentInspector from './components/ComponentInspector';
import ComponentPalette from './components/ComponentPalette';
import type { BuilderNode, ComponentType } from './state/builderTypes';
import {
  addChildNode,
  canDropOnTarget,
  createNodeFromType,
  findNodeById,
  findNodeLocation,
  removeNode,
  updateNodeProps,
} from './state/builderUtils';

const { Header, Content } = Layout;

function App() {
  const [nodes, setNodes] = useState<BuilderNode[]>([]);
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [messageApi, contextHolder] = message.useMessage();

  const selectedNode = useMemo(() => {
    if (!selectedId) {
      return undefined;
    }
    return findNodeById(nodes, selectedId);
  }, [nodes, selectedId]);

  const handleDropNew = (targetId: string | null, index: number | null, type: ComponentType) => {
    setNodes((prev) => {
      if (!canDropOnTarget(prev, targetId, type)) {
        messageApi.warning('Drop target does not accept this component.');
        return prev;
      }
      const newNode = createNodeFromType(type);
      const next = addChildNode(prev, targetId, newNode, index ?? undefined);
      setSelectedId(newNode.id);
      return next;
    });
  };

  const handleMoveNode = (nodeId: string, targetId: string | null, index: number | null) => {
    setNodes((prev) => {
      if (targetId === nodeId) {
        return prev;
      }
      const movingNode = findNodeById(prev, nodeId);
      if (!movingNode) {
        return prev;
      }
      const dropType = movingNode.type;
      if (!canDropOnTarget(prev, targetId, dropType)) {
        messageApi.warning('Cannot move component to the selected area.');
        return prev;
      }
      const sourceLocation = findNodeLocation(prev, nodeId);
      const { nodes: withoutNode, removed } = removeNode(prev, nodeId);
      if (!removed) {
        return prev;
      }
      let nextIndex = index;
      if (sourceLocation && sourceLocation.parentId === targetId && nextIndex !== null && nextIndex !== undefined) {
        if (nextIndex > sourceLocation.index) {
          nextIndex -= 1;
        }
        if (nextIndex === sourceLocation.index) {
          return prev;
        }
      }
      const sanitizedNode: BuilderNode = {
        ...removed,
        children: removed.children ? [...removed.children] : undefined,
      };
      const next = addChildNode(withoutNode, targetId, sanitizedNode, nextIndex ?? undefined);
      setSelectedId(nodeId);
      return next;
    });
  };

  const handleUpdateNode = (id: string, patch: Record<string, any>) => {
    setNodes((prev) =>
      updateNodeProps(prev, id, (node) => ({
        ...node,
        props: { ...node.props, ...patch },
      }))
    );
  };

  const handleRemoveNode = (id: string) => {
    setNodes((prev) => {
      const { nodes: next } = removeNode(prev, id);
      if (selectedId === id) {
        setSelectedId(undefined);
      }
      return next;
    });
  };

  return (
    <Layout className="app-shell">
      {contextHolder}
      <Header className="app-header">
        <h1>Ant Design UI Builder</h1>
      </Header>
      <Content className="app-content">
        <div className="app-panels">
          <aside className="app-panel app-panel-left">
            <ComponentPalette onStartDrag={(_type) => messageApi.destroy()} />
          </aside>
          <main className="app-canvas">
            <BuilderCanvas
              nodes={nodes}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onDropNew={handleDropNew}
              onMoveNode={handleMoveNode}
            />
          </main>
          <aside className="app-panel app-panel-right">
            <ComponentInspector node={selectedNode} onUpdate={handleUpdateNode} onRemove={handleRemoveNode} />
          </aside>
        </div>
        <div className="app-code-preview">
          <CodePreview nodes={nodes} />
        </div>
      </Content>
    </Layout>
  );
}

export default App;
