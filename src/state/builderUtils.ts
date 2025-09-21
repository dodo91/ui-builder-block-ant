import { BuilderNode, ComponentType } from './builderTypes';
import { canAcceptChild, componentRegistry, createDefaultNode } from './componentRegistry';

export const findNodeById = (nodes: BuilderNode[], id: string): BuilderNode | undefined => {
  for (const node of nodes) {
    if (node.id === id) {
      return node;
    }
    if (node.children) {
      const child = findNodeById(node.children, id);
      if (child) {
        return child;
      }
    }
  }
  return undefined;
};

export const updateNodeProps = (
  nodes: BuilderNode[],
  id: string,
  updater: (prev: BuilderNode) => BuilderNode
): BuilderNode[] => {
  return nodes.map((node) => {
    if (node.id === id) {
      return updater(node);
    }
    if (node.children) {
      return {
        ...node,
        children: updateNodeProps(node.children, id, updater),
      };
    }
    return node;
  });
};

export const removeNode = (
  nodes: BuilderNode[],
  id: string
): { nodes: BuilderNode[]; removed?: BuilderNode } => {
  const next: BuilderNode[] = [];
  let removed: BuilderNode | undefined;
  for (const node of nodes) {
    if (node.id === id) {
      removed = node;
      continue;
    }
    if (node.children) {
      const result = removeNode(node.children, id);
      if (result.removed) {
        removed = result.removed;
      }
      next.push({
        ...node,
        children: result.nodes,
      });
    } else {
      next.push(node);
    }
  }
  return { nodes: next, removed };
};

export const addChildNode = (
  nodes: BuilderNode[],
  targetId: string | null,
  newNode: BuilderNode
): BuilderNode[] => {
  if (targetId === null) {
    return [...nodes, newNode];
  }
  return nodes.map((node) => {
    if (node.id === targetId) {
      const children = node.children ? [...node.children, newNode] : [newNode];
      return { ...node, children };
    }
    if (node.children) {
      return { ...node, children: addChildNode(node.children, targetId, newNode) };
    }
    return node;
  });
};

export const createNodeFromType = (type: ComponentType): BuilderNode => {
  return createDefaultNode(type);
};

export const canDropOnTarget = (
  nodes: BuilderNode[],
  targetId: string | null,
  childType: ComponentType
): boolean => {
  if (targetId === null) {
    return true;
  }
  const target = findNodeById(nodes, targetId);
  if (!target) {
    return false;
  }
  return canAcceptChild(target.type, childType);
};

export const ensureChildArray = (node: BuilderNode): BuilderNode => {
  if (!componentRegistry[node.type].supportsChildren) {
    return node;
  }
  return {
    ...node,
    children: node.children ? [...node.children] : [],
  };
};

export const isDescendant = (nodes: BuilderNode[], parentId: string, possibleChildId: string): boolean => {
  const parent = findNodeById(nodes, parentId);
  if (!parent || !parent.children) {
    return false;
  }
  const stack = [...parent.children];
  while (stack.length) {
    const node = stack.pop()!;
    if (node.id === possibleChildId) {
      return true;
    }
    if (node.children) {
      stack.push(...node.children);
    }
  }
  return false;
};
