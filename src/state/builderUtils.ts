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

const insertAt = <T,>(list: T[], index: number | null | undefined, item: T): T[] => {
  const next = [...list];
  if (index === null || index === undefined) {
    next.push(item);
    return next;
  }
  const clampedIndex = Math.max(0, Math.min(index, next.length));
  next.splice(clampedIndex, 0, item);
  return next;
};

export const addChildNode = (
  nodes: BuilderNode[],
  targetId: string | null,
  newNode: BuilderNode,
  index?: number | null
): BuilderNode[] => {
  if (targetId === null) {
    return insertAt(nodes, index, newNode);
  }
  return nodes.map((node) => {
    if (node.id === targetId) {
      const children = node.children ? [...node.children] : [];
      const nextChildren = insertAt(children, index, newNode);
      return { ...node, children: nextChildren };
    }
    if (node.children) {
      return { ...node, children: addChildNode(node.children, targetId, newNode, index) };
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

export interface NodeLocation {
  parentId: string | null;
  index: number;
}

export const findNodeLocation = (
  nodes: BuilderNode[],
  id: string,
  parentId: string | null = null
): NodeLocation | undefined => {
  for (let index = 0; index < nodes.length; index += 1) {
    const node = nodes[index];
    if (node.id === id) {
      return { parentId, index };
    }
    if (node.children) {
      const childLocation = findNodeLocation(node.children, id, node.id);
      if (childLocation) {
        return childLocation;
      }
    }
  }
  return undefined;
};
