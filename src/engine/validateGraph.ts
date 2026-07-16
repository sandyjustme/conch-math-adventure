import { NODES, NODE_MAP } from "../data/knowledgeGraph";

export function validateGraph(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const node of NODES) {
    for (const dep of node.dependencies) {
      if (!NODE_MAP.has(dep)) {
        errors.push(`${node.id}: 依赖 ${dep} 不存在`);
      }
    }
  }

  const visited = new Set<string>();
  const recStack = new Set<string>();

  function hasCycle(nodeId: string): boolean {
    if (recStack.has(nodeId)) return true;
    if (visited.has(nodeId)) return false;

    visited.add(nodeId);
    recStack.add(nodeId);

    const node = NODE_MAP.get(nodeId);
    if (node) {
      for (const dep of node.dependencies) {
        if (hasCycle(dep)) {
          errors.push(`循环依赖: ${nodeId} → ${dep}`);
          return true;
        }
      }
    }

    recStack.delete(nodeId);
    return false;
  }

  for (const node of NODES) {
    if (!visited.has(node.id)) {
      hasCycle(node.id);
    }
  }

  const nodeIds = new Set(NODES.map((n) => n.id));
  if (nodeIds.size !== NODES.length) {
    errors.push("存在重复的知识点 ID");
  }

  return { valid: errors.length === 0, errors };
}

export function runValidation(): void {
  const result = validateGraph();
  if (!result.valid) {
    console.error("知识图谱验证失败:", result.errors);
  }
}
